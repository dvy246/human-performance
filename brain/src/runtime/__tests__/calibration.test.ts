// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { measureRefreshRate } from '../calibration';

describe('measureRefreshRate', () => {
  it('calls callback with result', () => new Promise<void>((done) => {
    const frameDuration = 16.67;
    let frameCount = 0;

    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb: FrameRequestCallback) => {
      const now = frameCount * frameDuration;
      frameCount++;
      if (frameCount <= 30) {
        cb(now);
      }
      return frameCount;
    });

    measureRefreshRate((result) => {
      expect(result.hz).toBe(60);
      expect(result.expectedLagMs).toBeCloseTo(8.3, 0);
      done();
    });
  }));

  it('snaps 59Hz to 60Hz standard', () => new Promise<void>((done) => {
    const frameDuration = 16.95; // ~59Hz
    let frameCount = 0;

    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb: FrameRequestCallback) => {
      const now = frameCount * frameDuration;
      frameCount++;
      if (frameCount <= 30) {
        cb(now);
      }
      return frameCount;
    });

    measureRefreshRate((result) => {
      expect(result.hz).toBe(60);
      done();
    });
  }));

  it('snaps 141Hz to 144Hz standard', () => new Promise<void>((done) => {
    const frameDuration = 7.09; // ~141Hz
    let frameCount = 0;

    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb: FrameRequestCallback) => {
      const now = frameCount * frameDuration;
      frameCount++;
      if (frameCount <= 30) {
        cb(now);
      }
      return frameCount;
    });

    measureRefreshRate((result) => {
      expect(result.hz).toBe(144);
      done();
    });
  }));

  it('returns 60Hz fallback when requestAnimationFrame is unavailable', () => {
    vi.stubGlobal('requestAnimationFrame', undefined);

    return new Promise<void>((resolve) => {
      measureRefreshRate((result) => {
        expect(result.hz).toBe(60);
        expect(result.expectedLagMs).toBe(16.7);
        resolve();
      });
    });
  });
});
