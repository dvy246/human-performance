import { useRef, useCallback } from 'react';

/**
 * Lightweight Web Audio API hook for generating programmatic sound effects.
 * No external audio files needed — all sounds are synthesized in real-time.
 * Respects user's mute preference stored in localStorage.
 */
export function useSound() {
  const ctxRef = useRef<AudioContext | null>(null);

  const getCtx = useCallback(() => {
    if (!ctxRef.current) {
      try {
        ctxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      } catch {
        return null;
      }
    }
    if (ctxRef.current.state === 'suspended') {
      ctxRef.current.resume().catch(() => {});
    }
    return ctxRef.current;
  }, []);

  const isMuted = useCallback(() => {
    if (typeof window === 'undefined') return true;
    return localStorage.getItem('cogniarena-muted') === 'true';
  }, []);

  const playTone = useCallback((freq: number, duration: number, type: OscillatorType = 'sine', volume = 0.15) => {
    if (isMuted()) return;
    const ctx = getCtx();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(volume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + duration);
    } catch { /* ignore audio errors */ }
  }, [getCtx, isMuted]);

  const playClick = useCallback(() => {
    playTone(600, 0.08, 'sine', 0.1);
  }, [playTone]);

  const playSuccess = useCallback(() => {
    playTone(523, 0.12, 'sine', 0.12);
    setTimeout(() => playTone(659, 0.12, 'sine', 0.12), 100);
    setTimeout(() => playTone(784, 0.2, 'sine', 0.15), 200);
  }, [playTone]);

  const playError = useCallback(() => {
    playTone(150, 0.3, 'sawtooth', 0.12);
  }, [playTone]);

  const playToneSequence = useCallback((notes: { freq: number; duration: number; delay: number }[], type: OscillatorType = 'sine', volume = 0.1) => {
    if (isMuted()) return;
    notes.forEach(note => {
      setTimeout(() => playTone(note.freq, note.duration, type, volume), note.delay);
    });
  }, [playTone, isMuted]);

  return { playTone, playClick, playSuccess, playError, playToneSequence, isMuted };
}
