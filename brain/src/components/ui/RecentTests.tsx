import React, { useState, useEffect } from 'react';
import { dataLayer } from '@/runtime/dataLayer';

interface RecentTest {
  testId: string;
  timestamp: number;
  rawScore: number;
}

export default function RecentTests() {
  const [recentTests, setRecentTests] = useState<RecentTest[]>([]);

  useEffect(() => {
    loadRecentTests();
  }, []);

  const loadRecentTests = async () => {
    try {
      const history = await dataLayer.getHistory();
      const recent = history.slice(0, 5).map(h => ({
        testId: h.testId,
        timestamp: h.timestamp,
        rawScore: h.rawScore
      }));
      setRecentTests(recent);
    } catch (err) {
      console.error('Failed to load recent tests:', err);
    }
  };

  const formatTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (recentTests.length === 0) {
    return (
      <div className="text-xs text-muted text-center py-4">
        No recent tests yet
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="text-[10px] font-semibold text-muted uppercase tracking-widest px-2 mb-1 font-mono">Recent Tests</span>
      {recentTests.map((test, idx) => (
        <a
          key={idx}
          href={`/tests/${test.testId.toLowerCase().replace(/\s+/g, '-')}`}
          className="flex items-center justify-between px-3 py-2 rounded-md text-xs transition-standard hover:bg-subtle group"
        >
          <span className="text-muted group-hover:text-foreground truncate">
            {test.testId}
          </span>
          <span className="text-[10px] text-muted font-mono ml-2 shrink-0">
            {formatTime(test.timestamp)}
          </span>
        </a>
      ))}
      <a
        href="/history"
        className="text-[10px] text-accent hover:underline text-center mt-2 font-mono"
      >
        View all history →
      </a>
    </div>
  );
}
