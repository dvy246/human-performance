import { hashRecoveryCode } from './recovery';

export interface SessionRecord {
  id: string;
  testId: string;
  category: string;
  timestamp: number;
  rawScore: number;
  percentile: number;
  metadata?: Record<string, any>;
  synced?: boolean; // Phase 2: local-first sync marker
}

export interface UserSettings {
  streakCount: number;
  lastActiveDate: string; // YYYY-MM-DD
}

const DB_NAME = 'CogniArenaDB';
const DB_VERSION = 1;
const STORE_NAME = 'sessions';
const SYNC_API_URL = 'https://cogniarena-sync.divyyadav.workers.dev';

// Persistent connection pool caching
let dbCache: IDBDatabase | null = null;

// Helper to initialize IndexedDB
function initDB(): Promise<IDBDatabase> {
  if (dbCache) return Promise.resolve(dbCache);

  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('IndexedDB is only available in the browser'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      dbCache = request.result;
      resolve(dbCache);
    };

    request.onupgradeneeded = (event) => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('testId', 'testId', { unique: false });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
  });
}

export const dataLayer = {
  // Save a test result session
  async saveSession(record: Omit<SessionRecord, 'id' | 'timestamp' | 'synced'>): Promise<SessionRecord> {
    const db = await initDB();
    const newRecord: SessionRecord = {
      ...record,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      synced: false
    };

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.add(newRecord);

      request.onsuccess = () => {
        this.updateStreak();
        // Trigger background sync if recovery code exists
        this.triggerSync().catch(console.error);
        resolve(newRecord);
      };
      request.onerror = () => reject(request.error);
    });
  },

  // Get full history or filter by testId
  async getHistory(testId?: string): Promise<SessionRecord[]> {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const records: SessionRecord[] = [];

      let request: IDBRequest<any>;
      if (testId) {
        const index = store.index('testId');
        request = index.openCursor(IDBKeyRange.only(testId));
      } else {
        request = store.openCursor(null, 'prev'); // newer first
      }

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue | null>).result;
        if (cursor) {
          records.push(cursor.value);
          cursor.continue();
        } else {
          // Sort manually if filtered by index to ensure ordering is newest first
          if (testId) {
            records.sort((a, b) => b.timestamp - a.timestamp);
          }
          resolve(records);
        }
      };

      request.onerror = () => reject(request.error);
    });
  },

  // Retrieve Personal Best for a specific test
  async getPersonalBest(testId: string, criteria: 'lower' | 'higher' = 'lower'): Promise<number | null> {
    const history = await this.getHistory(testId);
    if (history.length === 0) return null;

    const scores = history.map(h => h.rawScore);
    if (criteria === 'lower') {
      return scores.reduce((min, p) => p < min ? p : min, scores[0]);
    } else {
      return scores.reduce((max, p) => p > max ? p : max, scores[0]);
    }
  },

  // Streak system logic
  getStreak(): UserSettings {
    if (typeof window === 'undefined') {
      return { streakCount: 0, lastActiveDate: '' };
    }

    const streakCount = Number(localStorage.getItem('bb_streak_count') || '0');
    const lastActiveDate = localStorage.getItem('bb_last_active_date') || '';

    return { streakCount, lastActiveDate };
  },

  updateStreak(): UserSettings {
    if (typeof window === 'undefined') {
      return { streakCount: 0, lastActiveDate: '' };
    }

    const today = new Date().toISOString().split('T')[0];
    const { streakCount, lastActiveDate } = this.getStreak();

    if (lastActiveDate === today) {
      return { streakCount, lastActiveDate };
    }

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    let newStreak = 1;
    if (lastActiveDate === yesterdayStr) {
      newStreak = streakCount + 1;
    }

    localStorage.setItem('bb_streak_count', String(newStreak));
    localStorage.setItem('bb_last_active_date', today);

    return { streakCount: newStreak, lastActiveDate: today };
  },

  // Phase 2 Sync Engine
  getRecoveryCode(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('bb_recovery_code');
  },

  setRecoveryCode(code: string) {
    if (typeof window === 'undefined') return;
    if (!code) {
      localStorage.removeItem('bb_recovery_code');
    } else {
      localStorage.setItem('bb_recovery_code', code.trim().toLowerCase());
    }
  },

  // Pushes local unsynced records to the edge D1 database
  async triggerSync(): Promise<void> {
    const code = this.getRecoveryCode();
    if (!code) return; // Sync not configured

    const history = await this.getHistory();
    const unsynced = history.filter(r => !r.synced);
    if (unsynced.length === 0) return; // Nothing to sync

    const hash = await hashRecoveryCode(code);
    const payloadAttempts = unsynced.map(r => ({
      id: r.id,
      testId: r.testId,
      category: r.category,
      rawScore: r.rawScore,
      percentile: r.percentile,
      metadata: JSON.stringify(r.metadata || {}),
      createdAt: r.timestamp
    }));

    try {
      const response = await fetch(`${SYNC_API_URL}/api/sync/push`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recoveryHash: hash,
          attempts: payloadAttempts
        })
      });

      if (response.ok) {
        // Mark pushed records as synced locally
        const db = await initDB();
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);

        for (const record of unsynced) {
          record.synced = true;
          store.put(record);
        }
      }
    } catch (err) {
      console.warn('Sync push deferred (offline or network failure):', err);
    }
  },

  // Pulls all records from edge D1 and merges them into local IndexedDB
  async pullSync(): Promise<number> {
    const code = this.getRecoveryCode();
    if (!code) throw new Error('No recovery code is set');

    const hash = await hashRecoveryCode(code);

    const response = await fetch(`${SYNC_API_URL}/api/sync/pull`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recoveryHash: hash })
    });

    if (!response.ok) {
      throw new Error(`Sync pull failed with code: ${response.status}`);
    }

    const body: { success: boolean; attempts: any[] } = await response.json();
    if (!body.success || !Array.isArray(body.attempts)) {
      throw new Error('Invalid server sync response');
    }

    const db = await initDB();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    let mergeCount = 0;

    for (const item of body.attempts) {
      let metadataObj: Record<string, unknown> = {};
      if (typeof item.metadata === 'string') {
        try { metadataObj = JSON.parse(item.metadata); } catch { metadataObj = {}; }
      } else {
        metadataObj = item.metadata || {};
      }

      const mergedRecord: SessionRecord = {
        id: item.id,
        testId: item.testId,
        category: item.category,
        rawScore: item.rawScore,
        percentile: item.percentile,
        timestamp: item.createdAt,
        metadata: metadataObj,
        synced: true
      };

      store.put(mergedRecord);
      mergeCount++;
    }

    return mergeCount;
  }
};
