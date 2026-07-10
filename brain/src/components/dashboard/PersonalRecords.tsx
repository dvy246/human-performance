import React, { useState, useEffect } from 'react';
import { dataLayer, type SessionRecord } from '@/runtime/dataLayer';
import { formatTopPercentile } from '@/runtime/percentileLookup';

const LOWER_IS_BETTER = new Set(['reaction-time', 'f1-lights', 'sound-reaction', 'choice-reaction', 'go-no-go', 'aim-trainer', 'aim-coordination', 'mouse-accuracy', 'flick-trainer', 'stroop', 'tmt-partA', 'tmt-partB', 'planning']);

interface PersonalBest {
  testId: string;
  category: string;
  bestScore: number;
  percentile: number;
  attempts: number;
  lastAttempt: number;
}

export default function PersonalRecords() {
  const [records, setRecords] = useState<PersonalBest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadRecords();
  }, []);

  const loadRecords = async () => {
    try {
      const history = await dataLayer.getHistory();
      
      // Group by testId and find personal bests
      const grouped = new Map<string, SessionRecord[]>();
      history.forEach(record => {
        const existing = grouped.get(record.testId) || [];
        existing.push(record);
        grouped.set(record.testId, existing);
      });

      const personalBests: PersonalBest[] = [];
      grouped.forEach((records, testId) => {
        const sorted = records.sort((a, b) => {
          const isLowerBetter = LOWER_IS_BETTER.has(testId);
          return isLowerBetter ? a.rawScore - b.rawScore : b.rawScore - a.rawScore;
        });
        
        const best = sorted[0];
        const lastAttempt = records.reduce((latest, r) => r.timestamp > latest.timestamp ? r : latest, records[0]).timestamp;
        personalBests.push({
          testId,
          category: best.category,
          bestScore: best.rawScore,
          percentile: best.percentile,
          attempts: records.length,
          lastAttempt
        });
      });

      setRecords(personalBests.sort((a, b) => b.percentile - a.percentile));
    } catch (err) {
      console.error('Failed to load records:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (isLoading) {
    return <div className="text-center text-muted text-sm py-12">Loading records...</div>;
  }

  if (records.length === 0) {
    return (
      <div className="text-center py-12 space-y-4">
        <div className="text-4xl">🏆</div>
        <p className="text-muted text-sm">No personal records yet. Take your first test to start tracking!</p>
        <a href="/tests/reaction-time" className="inline-block px-4 py-2 bg-accent text-white text-sm rounded-md hover:opacity-90">
          Take a Test
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="border border-card-border rounded-lg p-4 bg-card">
          <p className="text-xs text-muted mb-1">Total Tests</p>
          <p className="text-2xl font-bold text-foreground">{records.length}</p>
        </div>
        <div className="border border-card-border rounded-lg p-4 bg-card">
          <p className="text-xs text-muted mb-1">Avg Percentile</p>
          <p className="text-2xl font-bold text-foreground">
            {Math.round(records.reduce((sum, r) => sum + r.percentile, 0) / records.length)}
          </p>
        </div>
        <div className="border border-card-border rounded-lg p-4 bg-card">
          <p className="text-xs text-muted mb-1">Total Attempts</p>
          <p className="text-2xl font-bold text-foreground">
            {records.reduce((sum, r) => sum + r.attempts, 0)}
          </p>
        </div>
        <div className="border border-card-border rounded-lg p-4 bg-card">
          <p className="text-xs text-muted mb-1">Top Percentile</p>
          <p className="text-2xl font-bold text-accent">
            {records.reduce((max, r) => Math.max(max, r.percentile), 0)}
          </p>
        </div>
      </div>

      {/* Records List */}
      <div className="space-y-2">
        {records.map((record, idx) => (
          <div
            key={record.testId}
            className="flex items-center justify-between p-4 border border-card-border rounded-lg bg-card hover:bg-hover transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center text-xl">
                {getMedal(idx)}
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{TEST_NAMES[record.testId] || record.testId}</p>
                <p className="text-xs text-muted">{record.category} • {record.attempts} attempts</p>
                <p className="text-xs text-muted">Last: {formatDate(record.lastAttempt)}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-foreground">{record.bestScore}</p>
              <p className="text-xs text-accent font-medium">{formatTopPercentile(record.percentile, record.testId)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  function getMedal(idx: number): string {
    if (idx === 0) return '🥇';
    if (idx === 1) return '🥈';
    if (idx === 2) return '🥉';
    return '🏆';
  }
}
