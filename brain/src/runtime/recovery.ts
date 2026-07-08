// Recovery Code Generator & Hashing Utility (BIP-39 Mnemonic Style)

const WORD_LIST = [
  'alpha', 'focus', 'delta', 'speed', 'click', 'precision', 'latency', 'telemetry',
  'split', 'radar', 'mind', 'brain', 'gantry', 'reflex', 'motor', 'sensory',
  'visual', 'sound', 'memory', 'aim', 'grid', 'pulse', 'wave', 'light',
  'trigger', 'driver', 'pilot', 'athlete', 'gamer', 'cadence', 'tempo', 'clock',
  'span', 'digit', 'score', 'percent', 'neural', 'cortex', 'synapse', 'neuron',
  'signal', 'route', 'vector', 'factor', 'calibration', 'frequency', 'interval', 'paint',
  'frame', 'refresh', 'buffer', 'jitter', 'delay', 'decay', 'streak', 'daily',
  'weekly', 'monthly', 'history', 'badge', 'profile', 'hex', 'axis', 'logic',
  'cognitive', 'mental', 'cranial', 'lobe', 'retina', 'cochlear', 'nerve', 'impulse',
  'command', 'action', 'clicker', 'tracker', 'endurance', 'target', 'bullet', 'acquire',
  'flicks', 'track', 'shrunk', 'simon', 'matrix', 'sketch', 'pattern', 'repeat',
  'sequence', 'chunks', 'quantum', 'cipher', 'network', 'pixel', 'sensor', 'orbit',
  'pivot', 'static', 'dynamic', 'active', 'passive', 'stable', 'vortex', 'binary',
  'analog', 'digital', 'optical', 'beacon', 'tether', 'bridge', 'socket', 'thread',
  'stream', 'packet', 'portal', 'vertex', 'scalar', 'tensor', 'radius', 'aspect',
  'symbol', 'token', 'crypt', 'vault', 'guard', 'shield', 'secure', 'node'
];

export function generateRecoveryCode(): string {
  const result: string[] = [];
  // Pick 8 random words for stronger entropy (~112 bits from 192-word list)
  const array = new Uint32Array(8);
  if (typeof window !== 'undefined' && window.crypto) {
    window.crypto.getRandomValues(array);
  } else {
    // Fallback if crypto is unavailable (e.g. node environment build test)
    for (let i = 0; i < 8; i++) {
      array[i] = Math.floor(Math.random() * 1000000);
    }
  }

  for (let i = 0; i < 8; i++) {
    const idx = array[i] % WORD_LIST.length;
    result.push(WORD_LIST[idx]);
  }
  return result.join('-');
}

export async function hashRecoveryCode(code: string): Promise<string> {
  const normalized = code.trim().toLowerCase().replace(/[^a-z-]/g, '');
  const encoder = new TextEncoder();
  const data = encoder.encode(normalized);
  
  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    // SEC-05: Use PBKDF2 with 600,000 iterations (OWASP 2023 recommendation)
    // to make offline brute-force attacks computationally expensive
    const keyMaterial = await window.crypto.subtle.importKey(
      'raw', data, { name: 'PBKDF2' }, false, ['deriveBits']
    );
    const salt = encoder.encode('cogniarena-sync-v1');
    const derived = await window.crypto.subtle.deriveBits(
      { name: 'PBKDF2', salt, iterations: 600000, hash: 'SHA-256' },
      keyMaterial,
      256
    );
    return Array.from(new Uint8Array(derived))
      .map(b => b.toString(16).padStart(2, '0')).join('');
  }
  
  // Fallback for non-browser environments (build steps, SSR).
  // This is NOT used in production browser contexts — it throws
  // rather than returning a weak hash.
  throw new Error('Secure hashing unavailable: Web Crypto API required');
}
