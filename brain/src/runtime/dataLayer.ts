export interface SessionRecord {
  id: string;
  testId: string;
  category: string;
  timestamp: number;
  rawScore: number;
  percentile: number;
  metadata?: Record<string, any>;
}

export interface UserSettings {
  streakCount: number;
  lastActiveDate: string; // YYYY-MM-DD
}

const DB_NAME = 'BrainBenchmarksDB';
const DB_VERSION = 1;
const STORE_NAME = 'sessions';

// Helper to initialize IndexedDB
function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('IndexedDB is only available in the browser'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

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
  async saveSession(record: Omit<SessionRecord, 'id' | 'timestamp'>): Promise<SessionRecord> {
    const db = await initDB();
    const newRecord: SessionRecord = {
      ...record,
      id: crypto.randomUUID(),
      timestamp: Date.now()
    };

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.add(newRecord);

      request.onsuccess = () => {
        // Also update the daily streak on a successful test completion
        this.updateStreak();
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

  // Retrieve Personal Best for a specific test (lower is better for reaction time, higher is better for typing/clicks)
  async getPersonalBest(testId: string, criteria: 'lower' | 'higher' = 'lower'): Promise<number | null> {
    const history = await this.getHistory(testId);
    if (history.length === 0) return null;

    const scores = history.map(h => h.rawScore);
    if (criteria === 'lower') {
      return Math.min(...scores);
    } else {
      return Math.max(...scores);
    }
  },

  // Streak system logic (localStorage, synchronous)
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
      // Already active today, streak is maintained
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
  }
};
