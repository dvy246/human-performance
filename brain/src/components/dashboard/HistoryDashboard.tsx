import React, { useState, useEffect } from 'react';
import { dataLayer, type SessionRecord } from '@/runtime/dataLayer';

export default function HistoryDashboard() {
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const history = await dataLayer.getHistory();
      setSessions(history.sort((a, b) => b.timestamp - a.timestamp));
    } catch (err) {
      console.error('Failed to load history:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredSessions = filter === 'all' 
    ? sessions 
    : sessions.filter(s => s.testId === filter);

  const testTypes = Array.from(new Set(sessions.map(s => s.testId)));

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return <div className="text-center text-muted text-sm py-12">Loading history...</div>;
  }

  if (sessions.length === 0) {
    return (
      <div className="text-center py-12 space-y-4">
        <div className="text-4xl">📊</div>
        <p className="text-muted text-sm">No test history yet. Take your first test to see it here!</p>
        <a href="/tests/reaction-time" className="inline-block px-4 py-2 bg-accent text-white text-sm rounded-md hover:opacity-90">
          Take a Test
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
            filter === 'all'
              ? 'bg-accent text-white'
              : 'border border-card-border text-muted hover:text-foreground hover:bg-subtle'
          }`}
        >
          All Tests ({sessions.length})
        </button>
        {testTypes.map(type => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              filter === type
                ? 'bg-accent text-white'
                : 'border border-card-border text-muted hover:text-foreground hover:bg-subtle'
            }`}
          >
            {type} ({sessions.filter(s => s.testId === type).length})
          </button>
        ))}
      </div>

      {/* History List */}
      <div className="space-y-2">
        {filteredSessions.map((session) => (
          <div
            key={session.id}
            className="flex items-center justify-between p-4 border border-card-border rounded-lg bg-card hover:bg-hover transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center text-lg">
                {getTestIcon(session.testId)}
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{session.testId}</p>
                <p className="text-xs text-muted">{formatDate(session.timestamp)}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-foreground">
                {session.rawScore} <span className="text-xs text-muted font-normal">{session.category}</span>
              </p>
              {session.percentile && (
                <p className="text-xs text-accent">
                  {session.percentile}th percentile
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Export Button */}
      {sessions.length > 0 && (
        <div className="flex justify-end">
          <button
            onClick={() => exportToCSV()}
            className="flex items-center gap-2 px-4 py-2 rounded-md border border-card-border text-sm text-muted hover:text-foreground hover:bg-subtle transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" x2="12" y1="15" y2="3"/>
            </svg>
            Export to CSV
          </button>
        </div>
      )}
    </div>
  );

  function getTestIcon(testType: string): string {
    const icons: Record<string, string> = {
      'reaction-time': '⚡',
      'f1-lights': '🏎️',
      'sound-reaction': '🔊',
      'choice-reaction': '🔢',
      'go-no-go': '🛡️',
      'click-speed': '🖱️',
      'sequence-memory': '🗂️',
      'number-memory': '🔢',
      'aim-trainer': '🎯',
      'visual-pattern': '🧩',
      'stroop': '🎨',
      'trail-making': '🧭',
      'typing-speed': '⌨️',
      'aim-coordination': '🎯',
      'pattern-reasoning': '🧠',
      'decision-speed': '⚖️',
      'planning': '📋',
      'prioritization': '📊',
      'gauntlet': '🏆',
      'tmt-partA': '🔵',
      'tmt-partB': '🔴',
      'focus-challenge': '🎯',
      'verbal-memory': '💬',
      'spatial-orientation': '🧭',
      'mouse-accuracy': '🖱️',
      'flick-trainer': '👆',
    };
    return icons[testType] || '📊';
  }

  function exportToCSV() {
    const headers = ['Test ID', 'Category', 'Score', 'Percentile', 'Date'];
    const rows = filteredSessions.map(s => [
      s.testId,
      s.category,
      s.rawScore,
      s.percentile || '',
      new Date(s.timestamp).toISOString()
    ]);
    
    const csv = [
      headers.join(','),
      ...rows.map(r => r.map(v => `"${v}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cogniarena-history-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
}
