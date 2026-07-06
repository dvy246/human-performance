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
  // Pick 6 random words
  const array = new Uint32Array(6);
  if (typeof window !== 'undefined' && window.crypto) {
    window.crypto.getRandomValues(array);
  } else {
    // Fallback if crypto is unavailable (e.g. node environment build test)
    for (let i = 0; i < 6; i++) {
      array[i] = Math.floor(Math.random() * 1000000);
    }
  }

  for (let i = 0; i < 6; i++) {
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
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
  
  // Minimal fallback for server-side build steps
  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    hash = (hash << 5) - hash + normalized.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }
  return 'fallback-' + Math.abs(hash).toString(16);
}
