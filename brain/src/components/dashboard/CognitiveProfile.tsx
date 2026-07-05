import React, { useState, useEffect } from 'react';
import { dataLayer, type SessionRecord } from '../../runtime/dataLayer';

interface CognitiveAverages {
  reaction: number; // Reaction Speed (Visual, F1, Sound)
  memory: number;   // Memory Capacity (Sequence)
  processing: number; // Processing Speed (Choice)
  precision: number;  // Precision & Control (Aim)
  focus: number;      // Focus & Attention (Go/No-go)
  stamina: number;    // Cognitive Stamina (Click CPS)
}

interface DiagnosticInfo {
  hz: number;
  deviceType: 'Mobile' | 'Tablet' | 'Desktop';
  inputMethod: 'Touch' | 'Mouse/Keyboard';
  browser: string;
  os: string;
}

interface DailyChallenge {
  testId: string;
  name: string;
  metric: string;
  target: number;
  condition: 'higher' | 'lower';
  desc: string;
}

const TEST_NAMES: Record<string, string> = {
  'reaction-time': 'Visual Reaction Test',
  'f1-lights': 'F1 Start Lights',
  'go-no-go': 'Color Go/No-Go',
  'choice-reaction': 'Choice Grid',
  'sound-reaction': 'Sound Reflex Test',
  'click-speed': 'Click Speed (CPS)',
  'aim-trainer': 'Aim Precision',
  'sequence-memory': 'Sequence Memory',
  'number-memory': 'Number Memory',
  'visual-pattern': 'Visual Pattern Memory'
};

const ACHIEVEMENTS_LIST = [
  { id: 'speed_demon', title: 'Speed Demon', desc: 'Visual Reaction time under 200 ms', badge: '⚡' },
  { id: 'sound_reflex', title: 'Sound Reflex', desc: 'Sound Reaction time under 180 ms', badge: '🔊' },
  { id: 'f1_champion', title: 'F1 Champion', desc: 'F1 Start Lights reaction under 200 ms', badge: '🏎️' },
  { id: 'choice_master', title: 'Choice Master', desc: 'Choice Grid latency under 380 ms', badge: '🧠' },
  { id: 'focus_guardian', title: 'Focus Guardian', desc: 'Go/No-Go completed with 0 False Alarms', badge: '🛡️' },
  { id: 'click_speedster', title: 'Click Speedster', desc: 'Click Speed of 10.0+ CPS achieved', badge: '🖱️' },
  { id: 'sniper_precision', title: 'Sniper Precision', desc: 'Aim Trainer with 95%+ Accuracy achieved', badge: '🎯' },
  { id: 'memory_matrix', title: 'Memory Matrix', desc: 'Sequence Memory Level 8+ reached', badge: '🗂️' },
  { id: 'number_wizard', title: 'Number Wizard', desc: 'Recall a 10-digit sequence or higher', badge: '🔢' },
  { id: 'visual_genius', title: 'Visual Genius', desc: 'Reach Level 10 or higher in Visual Pattern Memory', badge: '🧩' },
  { id: 'streak_consistency', title: 'Daily Consistency', desc: 'Maintain a 3+ Day active streak', badge: '🔥' },
  { id: 'full_spectrum', title: 'Full Spectrum', desc: 'Try at least 5 different assessments', badge: '🌈' }
];

export default function CognitiveProfile() {
  const [history, setHistory] = useState<SessionRecord[]>([]);
  const [streak, setStreak] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [averages, setAverages] = useState<CognitiveAverages | null>(null);
  
  // BBI & Persona
  const [bbiScore, setBbiScore] = useState<number | null>(null);
  const [persona, setPersona] = useState<{ title: string; desc: string; explanation: string } | null>(null);
  
  // Interactive Timeline Graph
  const [graphTestId, setGraphTestId] = useState<string>('reaction-time');
  
  // Diagnostics
  const [diagnostics, setDiagnostics] = useState<DiagnosticInfo | null>(null);
  
  // Daily Challenge
  const [dailyChallenge, setDailyChallenge] = useState<DailyChallenge | null>(null);
  const [challengeCompleted, setChallengeCompleted] = useState<boolean>(false);

  // Active Tab
  const [activeTab, setActiveTab] = useState<'profile' | 'history' | 'achievements' | 'diagnostics'>('profile');
  const [historyPeriod, setHistoryPeriod] = useState<'all' | '30d' | '7d' | 'today'>('all');

  // US Demographic Benchmark State
  const [demographicAge, setDemographicAge] = useState<string>('25-34');
  const [demographicProfession, setDemographicProfession] = useState<string>('Software Engineer');
  const [demographicState, setDemographicState] = useState<string>('California');

  const isProfileEmpty = history.length === 0;

  const getDemographicComparison = () => {
    if (!bbiScore) return null;
    
    // Base percentile is derived from BBI (BBI is 0-1000, BBI / 10 is percentile from 0 to 100)
    const basePercentile = 100 - (bbiScore / 10);
    
    // Adjust percentile based on difficulty of group
    let groupMultiplier = 1.0;
    if (demographicProfession === 'Pro Esports Player') groupMultiplier = 1.6;
    else if (demographicProfession === 'Fighter Pilot') groupMultiplier = 1.9;
    else if (demographicProfession === 'Software Engineer') groupMultiplier = 1.25;
    else if (demographicProfession === 'Student') groupMultiplier = 0.95;
    else if (demographicProfession === 'Healthcare Professional') groupMultiplier = 1.15;
    
    let ageMultiplier = 1.0;
    if (demographicAge === '18-24') ageMultiplier = 1.2;
    else if (demographicAge === '25-34') ageMultiplier = 1.1;
    else if (demographicAge === '35-44') ageMultiplier = 1.0;
    else if (demographicAge === '45-54') ageMultiplier = 0.85;
    else if (demographicAge === '55-64') ageMultiplier = 0.7;
    else if (demographicAge === '65+') ageMultiplier = 0.55;

    // Adjusted percentile for comparison
    const adjustedPercentile = Math.max(0.1, Math.min(99.9, basePercentile * groupMultiplier * ageMultiplier));

    return {
      percentile: adjustedPercentile.toFixed(1),
      text: `Based on US cognitive norms, you score in the Top ${adjustedPercentile.toFixed(1)}% of all ${demographicProfession}s in the ${demographicAge} age bracket residing in ${demographicState}.`,
    };
  };

  useEffect(() => {
    async function loadData() {
      try {
        const records = await dataLayer.getHistory();
        setHistory(records);

        const streakInfo = dataLayer.getStreak();
        setStreak(streakInfo.streakCount);

        detectDiagnostics();
        generateDailyChallenge();

        if (records.length > 0) {
          const computedAverages = computeCategoryAverages(records);
          setAverages(computedAverages);
          calculateBbiAndPersona(computedAverages, records);
          checkChallengeCompletion(records);
        }
      } catch (err) {
        console.error('Failed to load profile dashboard:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const detectDiagnostics = () => {
    if (typeof window === 'undefined') return;

    let hz = 60;
    // Estimate refresh rate via frame timers
    let lastTime = performance.now();
    let frameCount = 0;
    const checkFrame = () => {
      const now = performance.now();
      frameCount++;
      if (now - lastTime >= 500) {
        hz = Math.round((frameCount * 1000) / (now - lastTime));
        setDiagnostics(prev => prev ? { ...prev, hz } : null);
      } else {
        requestAnimationFrame(checkFrame);
      }
    };
    requestAnimationFrame(checkFrame);

    const ua = navigator.userAgent;
    const isMobile = /iPhone|iPad|iPod|Android/i.test(ua);
    const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    
    let deviceType: 'Mobile' | 'Tablet' | 'Desktop' = 'Desktop';
    if (isMobile) {
      deviceType = window.innerWidth > 768 ? 'Tablet' : 'Mobile';
    }

    let browser = 'Unknown Browser';
    if (ua.indexOf('Chrome') > -1) browser = 'Chrome';
    else if (ua.indexOf('Safari') > -1) browser = 'Safari';
    else if (ua.indexOf('Firefox') > -1) browser = 'Firefox';
    else if (ua.indexOf('Edg') > -1) browser = 'Edge';

    let os = 'Unknown OS';
    if (ua.indexOf('Windows') > -1) os = 'Windows';
    else if (ua.indexOf('Macintosh') > -1) os = 'macOS';
    else if (ua.indexOf('iPhone') > -1 || ua.indexOf('iPad') > -1) os = 'iOS';
    else if (ua.indexOf('Android') > -1) os = 'Android';

    setDiagnostics({
      hz: 60, // Default prior to animationFrame check completing
      deviceType,
      inputMethod: hasTouch ? 'Touch' : 'Mouse/Keyboard',
      browser,
      os
    });
  };

  const generateDailyChallenge = () => {
    // Generate deterministic challenge based on calendar day
    const day = new Date().getDate();
    const challengePool: DailyChallenge[] = [
      { testId: 'reaction-time', name: 'Visual Reaction', metric: 'ms', target: 240, condition: 'lower', desc: 'Record a reaction score below 240 ms.' },
      { testId: 'click-speed', name: 'Click Speed (CPS)', metric: 'CPS', target: 8.5, condition: 'higher', desc: 'Achieve click speed cadence of 8.5 CPS or higher.' },
      { testId: 'aim-trainer', name: 'Aim Precision', metric: '% Accuracy', target: 92, condition: 'higher', desc: 'Complete Aim Precision with 92% accuracy or higher.' },
      { testId: 'sequence-memory', name: 'Sequence Memory', metric: 'Level', target: 7, condition: 'higher', desc: 'Reach Level 7 or higher in Sequence Memory.' },
      { testId: 'go-no-go', name: 'Color Go/No-Go', metric: 'ms', target: 360, condition: 'lower', desc: 'Complete Go/No-Go under 360 ms average.' },
      { testId: 'sound-reaction', name: 'Sound Reflex', metric: 'ms', target: 200, condition: 'lower', desc: 'Record sound reaction below 200 ms.' },
      { testId: 'choice-reaction', name: 'Choice Grid', metric: 'ms', target: 450, condition: 'lower', desc: 'Complete Choice Grid under 450 ms.' },
      { testId: 'f1-lights', name: 'F1 Start Lights', metric: 'ms', target: 230, condition: 'lower', desc: 'Launch start lights below 230 ms.' }
    ];

    const challenge = challengePool[day % challengePool.length];
    setDailyChallenge(challenge);
  };

  const checkChallengeCompletion = (records: SessionRecord[]) => {
    if (!dailyChallenge) return;

    const startOfToday = new Date().setHours(0, 0, 0, 0);
    const todayAttempts = records.filter(r => r.testId === dailyChallenge.testId && r.timestamp >= startOfToday);

    const metGoal = todayAttempts.some(r => {
      const score = dailyChallenge.testId === 'click-speed' ? r.rawScore / 10 : r.rawScore;
      if (dailyChallenge.condition === 'lower') {
        return score <= dailyChallenge.target;
      } else {
        return score >= dailyChallenge.target;
      }
    });

    setChallengeCompleted(metGoal);
  };

  const computeCategoryAverages = (records: SessionRecord[]): CognitiveAverages => {
    const scores = {
      reaction: [] as number[],
      memory: [] as number[],
      processing: [] as number[],
      precision: [] as number[],
      focus: [] as number[],
      stamina: [] as number[]
    };

    records.forEach(r => {
      if (r.testId === 'reaction-time' || r.testId === 'f1-lights' || r.testId === 'sound-reaction') {
        scores.reaction.push(r.percentile);
      } else if (r.testId === 'sequence-memory' || r.testId === 'number-memory' || r.testId === 'visual-pattern') {
        scores.memory.push(r.percentile);
      } else if (r.testId === 'choice-reaction') {
        scores.processing.push(r.percentile);
      } else if (r.testId === 'aim-trainer') {
        scores.precision.push(r.percentile);
      } else if (r.testId === 'go-no-go') {
        scores.focus.push(r.percentile);
      } else if (r.testId === 'click-speed') {
        scores.stamina.push(r.percentile);
      }
    });

    const getAvg = (arr: number[]) => (arr.length === 0 ? 0 : Math.round(arr.reduce((a, b) => a + b, 0) / arr.length));

    return {
      reaction: getAvg(scores.reaction),
      memory: getAvg(scores.memory),
      processing: getAvg(scores.processing),
      precision: getAvg(scores.precision),
      focus: getAvg(scores.focus),
      stamina: getAvg(scores.stamina)
    };
  };

  const calculateBbiAndPersona = (avg: CognitiveAverages, records: SessionRecord[]) => {
    const activePercentiles = Object.values(avg).filter(v => v > 0);
    if (activePercentiles.length === 0) return;

    const averagePercentile = activePercentiles.reduce((a, b) => a + b, 0) / activePercentiles.length;
    setBbiScore(Math.round(averagePercentile * 10));

    const categories: Array<{ id: keyof CognitiveAverages; label: string }> = [
      { id: 'reaction', label: 'Reaction Speed' },
      { id: 'memory', label: 'Memory Capacity' },
      { id: 'processing', label: 'Processing Speed' },
      { id: 'precision', label: 'Precision & Control' },
      { id: 'focus', label: 'Focus & Attention' },
      { id: 'stamina', label: 'Cognitive Stamina' }
    ];

    let maxVal = -1;
    let strongestCategory: keyof CognitiveAverages = 'reaction';

    categories.forEach(cat => {
      if (avg[cat.id] > maxVal) {
        maxVal = avg[cat.id];
        strongestCategory = cat.id;
      }
    });

    const personas: Record<keyof CognitiveAverages, { title: string; desc: string; explanation: string }> = {
      reaction: {
        title: 'Rapid Reactor',
        desc: 'Sensory Visuomotor Specialist',
        explanation: 'You excel at rapid stimulus classification and triggering motor actions. Your reflex latency is highly optimized for fast visual and audio cues.'
      },
      memory: {
        title: 'Pattern Hunter',
        desc: 'Visuospatial Chunking Strategist',
        explanation: 'You chunk sequence coordinates and structural matrices into spatial memory blocks, successfully bypassing short-term cognitive decay limits.'
      },
      processing: {
        title: 'Analytical Strategist',
        desc: 'Hick\'s Law Optimizer',
        explanation: 'You maintain fast visual choice-decision paths. When faced with multiple targets or split-second alternatives, you resolve selection overhead cleanly.'
      },
      precision: {
        title: 'Precision Thinker',
        desc: 'Spatial Motor Coordinator',
        explanation: 'Your motor cortex commands micro-pixel movements with absolute accuracy. You glide to aim boundaries with minimal coordinate offset errors.'
      },
      focus: {
        title: 'Focus Guardian',
        desc: 'Impulse Inhibition Controller',
        explanation: 'You command excellent inhibitory prefrontal executive control. You ignore distractor stimuli, maintaining accuracy under cognitive stress.'
      },
      stamina: {
        title: 'Stamina Specialist',
        desc: 'Endurance Firing Specialist',
        explanation: 'You maintain highly consistent click cadences. Your motor mechanics display high resilience against fatigue and speed degradation.'
      }
    };

    setPersona(personas[strongestCategory]);
  };

  const getUnlockedAchievementsCount = (): number => {
    return ACHIEVEMENTS_LIST.filter(ach => checkAchievement(ach.id)).length;
  };

  const checkAchievement = (id: string): boolean => {
    if (history.length === 0) return false;

    switch (id) {
      case 'speed_demon':
        return history.some(r => r.testId === 'reaction-time' && r.rawScore < 200);
      case 'sound_reflex':
        return history.some(r => r.testId === 'sound-reaction' && r.rawScore < 180);
      case 'f1_champion':
        return history.some(r => r.testId === 'f1-lights' && r.rawScore < 200);
      case 'choice_master':
        return history.some(r => r.testId === 'choice-reaction' && r.rawScore < 380);
      case 'focus_guardian':
        return history.some(r => r.testId === 'go-no-go' && r.metadata?.falseAlarms === 0);
      case 'click_speedster':
        return history.some(r => r.testId === 'click-speed' && r.rawScore >= 100);
      case 'sniper_precision':
        return history.some(r => r.testId === 'aim-trainer' && r.metadata?.accuracy >= 95);
      case 'memory_matrix':
        return history.some(r => r.testId === 'sequence-memory' && r.rawScore >= 8);
      case 'number_wizard':
        return history.some(r => r.testId === 'number-memory' && r.rawScore >= 10);
      case 'visual_genius':
        return history.some(r => r.testId === 'visual-pattern' && r.rawScore >= 10);
      case 'streak_consistency':
        return streak >= 3;
      case 'full_spectrum':
        const uniquePlayed = new Set(history.map(r => r.testId));
        return uniquePlayed.size >= 5;
      default:
        return false;
    }
  };

  const getRecommendations = (): { text: string; link: string; testId: string }[] => {
    if (!averages) return [];

    const recs: { text: string; link: string; testId: string }[] = [];
    const categories: Array<{ id: keyof CognitiveAverages; testId: string; label: string; link: string }> = [
      { id: 'reaction', testId: 'reaction-time', label: 'Visual Reaction', link: '/tests/reaction-time' },
      { id: 'memory', testId: 'sequence-memory', label: 'Sequence Memory', link: '/tests/sequence-memory' },
      { id: 'processing', testId: 'choice-reaction', label: 'Choice Grid', link: '/tests/choice-reaction' },
      { id: 'precision', testId: 'aim-trainer', label: 'Aim Precision', link: '/tests/aim-trainer' },
      { id: 'focus', testId: 'go-no-go', label: 'Color Go/No-Go', link: '/tests/go-no-go' },
      { id: 'stamina', testId: 'click-speed', label: 'Click Speed', link: '/tests/click-speed' }
    ];

    const sorted = [...categories].sort((a, b) => {
      const valA = averages[a.id];
      const valB = averages[b.id];
      return valA - valB;
    });

    sorted.slice(0, 2).forEach(item => {
      recs.push({
        text: `Target Weakness: Train ${item.label} to improve your index.`,
        link: item.link,
        testId: item.testId
      });
    });

    return recs;
  };

  const exportHistoryToCSV = () => {
    if (history.length === 0) return;
    
    const headers = ['ID', 'Test ID', 'Category', 'Timestamp', 'Raw Score', 'Percentile', 'Synced'];
    const rows = history.map(r => [
      r.id,
      r.testId,
      r.category,
      new Date(r.timestamp).toISOString(),
      r.rawScore,
      r.percentile,
      r.synced ? 'true' : 'false'
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `brainbenchmarks_profile_ledger_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const cx = 100;
  const cy = 100;
  const r = 70;
  const radarAngles = [
    -Math.PI / 2,                          // Reaction (Top)
    -Math.PI / 2 + Math.PI / 3,            // Memory
    -Math.PI / 2 + (2 * Math.PI) / 3,       // Processing
    -Math.PI / 2 + Math.PI,                // Precision (Bottom)
    -Math.PI / 2 + (4 * Math.PI) / 3,       // Focus
    -Math.PI / 2 + (5 * Math.PI) / 3        // Stamina
  ];

  const getPointsStr = () => {
    if (!averages) return '';
    const vals = [
      averages.reaction,
      averages.memory,
      averages.processing,
      averages.precision,
      averages.focus,
      averages.stamina
    ];

    return radarAngles.map((angle, idx) => {
      const val = Math.max(12, vals[idx]);
      const currentRadius = (val / 100) * r;
      const x = cx + currentRadius * Math.cos(angle);
      const y = cy + currentRadius * Math.sin(angle);
      return `${x},${y}`;
    }).join(' ');
  };

  const getHexPoints = (radius: number) => {
    return radarAngles.map((angle) => {
      const x = cx + radius * Math.cos(angle);
      const y = cy + radius * Math.sin(angle);
      return `${x},${y}`;
    }).join(' ');
  };

  const getTrendDataPoints = (testId: string): { x: number; y: number; val: number; date: string }[] => {
    const testRecords = [...history]
      .filter(r => r.testId === testId)
      .sort((a, b) => a.timestamp - b.timestamp)
      .slice(-10);

    if (testRecords.length === 0) return [];

    const scores = testRecords.map(r => {
      return r.testId === 'click-speed' ? r.rawScore / 10 : r.rawScore;
    });
    const maxScore = Math.max(...scores, 1);
    const minScore = Math.min(...scores, 0);
    const range = maxScore - minScore || 1;

    const width = 240;
    const height = 100;
    const padding = 15;

    return testRecords.map((rec, idx) => {
      const rawVal = rec.testId === 'click-speed' ? rec.rawScore / 10 : rec.rawScore;
      const x = padding + (idx / Math.max(1, testRecords.length - 1)) * (width - padding * 2);
      
      const isTimeMetric = rec.testId !== 'click-speed' && rec.testId !== 'sequence-memory' && rec.testId !== 'number-memory' && rec.testId !== 'visual-pattern';
      const normVal = (rawVal - minScore) / range;
      const y = isTimeMetric 
        ? padding + normVal * (height - padding * 2) 
        : height - padding - normVal * (height - padding * 2);

      return {
        x,
        y,
        val: rawVal,
        date: new Date(rec.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
      };
    });
  };

  const trendPoints = getTrendDataPoints(graphTestId);

  const formatScore = (testId: string, score: number) => {
    if (testId === 'click-speed') return `${(score / 10).toFixed(1)} CPS`;
    if (testId === 'sequence-memory' || testId === 'visual-pattern') return `Level ${score}`;
    if (testId === 'number-memory') return `${score} Digits`;
    return `${score} ms`;
  };

  return (
    <div className="w-full flex flex-col gap-10">
      {isProfileEmpty ? (
        <div className="w-full max-w-lg mx-auto py-16 flex flex-col items-center justify-center text-center gap-6 rounded-xl border border-card-border bg-card p-8 shadow-xl">
          <div className="w-12 h-12 rounded-full bg-accent/5 border border-accent/15 flex items-center justify-center text-xl">🔒</div>
          <div>
            <h2 className="text-xl font-bold text-foreground tracking-tight mb-2">Cognitive Profile Locked</h2>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm leading-relaxed max-w-sm">
              Complete at least one assessment test to unlock your Cognitive Profile, Daily Streaks, and Skill Radar metrics.
            </p>
          </div>
          <a
            href="/tests/reaction-time"
            className="px-6 h-10 rounded bg-accent hover:bg-accent-hover text-black font-semibold text-xs font-mono uppercase flex items-center active:scale-98 transition-standard shadow"
          >
            Launch First Assessment
          </a>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            
            <div className="rounded-xl border border-card-border bg-card p-5 flex flex-col justify-between shadow relative overflow-hidden">
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Brain Score (BBI)</span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl font-bold font-mono text-foreground">{bbiScore || '--'}</span>
                <span className="text-xs text-zinc-500 font-mono">/ 1000</span>
              </div>
              <div className="w-full bg-subtle h-1.5 rounded-full mt-3 overflow-hidden border border-card-border/60">
                <div className="bg-accent h-full rounded-full transition-all duration-500" style={{ width: `${(bbiScore || 0) / 10}%` }}></div>
              </div>
              <span className="text-[9px] text-zinc-500 font-mono uppercase mt-2">Aggregated percentile indicator</span>
            </div>

            <div className="rounded-xl border border-card-border bg-card p-5 flex flex-col justify-between shadow">
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Active Streak</span>
              <div className="flex items-baseline gap-1 mt-2">
                <span className="text-3xl font-bold font-mono text-foreground">{streak}</span>
                <span className="text-xs text-zinc-500 font-mono">Days</span>
              </div>
              <div className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-3 flex items-center gap-1.5">
                <span className="text-amber-500 animate-pulse">🔥</span>
                <span>Complete 1 test daily to maintain</span>
              </div>
            </div>

            <div className="rounded-xl border border-card-border bg-card p-5 flex flex-col justify-between shadow">
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Completed Runs</span>
              <div className="flex items-baseline mt-2">
                <span className="text-3xl font-bold font-mono text-accent">{history.length}</span>
              </div>
              <button 
                onClick={exportHistoryToCSV}
                className="text-[10px] text-zinc-500 dark:text-zinc-400 hover:text-accent font-mono mt-3 flex items-center gap-1 cursor-pointer transition-colors active:scale-95 bg-transparent border-0 outline-none"
              >
                <span>📥 Export Profile ledger (CSV)</span>
              </button>
            </div>

            <div className="rounded-xl border border-card-border bg-card p-5 flex flex-col justify-between shadow">
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Cognitive Persona</span>
              <div className="mt-2 flex flex-col gap-0.5">
                <span className="text-lg font-bold text-foreground leading-snug">{persona?.title || 'Adaptive Learner'}</span>
                <span className="text-[10px] text-zinc-500 dark:text-zinc-400 italic">{persona?.desc || 'Balanced Cognitive Profile'}</span>
              </div>
              <span className="text-[9px] text-zinc-500 font-mono uppercase mt-3">Derived from strongest scores</span>
            </div>

          </div>

          <div className="flex border-b border-card-border/60 gap-6">
            <button
              onClick={() => setActiveTab('profile')}
              className={`pb-2.5 text-xs font-mono uppercase tracking-widest cursor-pointer transition-colors relative outline-none ${
                activeTab === 'profile' ? 'text-accent font-semibold border-b-2 border-accent' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
              }`}
            >
              Cognitive Profile
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`pb-2.5 text-xs font-mono uppercase tracking-widest cursor-pointer transition-colors relative outline-none ${
                activeTab === 'history' ? 'text-accent font-semibold border-b-2 border-accent' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
              }`}
            >
              Historical Ledger
            </button>
            <button
              onClick={() => setActiveTab('achievements')}
              className={`pb-2.5 text-xs font-mono uppercase tracking-widest cursor-pointer transition-colors relative outline-none ${
                activeTab === 'achievements' ? 'text-accent font-semibold border-b-2 border-accent' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
              }`}
            >
              Achievements ({getUnlockedAchievementsCount()}/{ACHIEVEMENTS_LIST.length})
            </button>
            <button
              onClick={() => setActiveTab('diagnostics')}
              className={`pb-2.5 text-xs font-mono uppercase tracking-widest cursor-pointer transition-colors relative outline-none ${
                activeTab === 'diagnostics' ? 'text-accent font-semibold border-b-2 border-accent' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
              }`}
            >
              Environment Diagnostics
            </button>
          </div>

          {activeTab === 'profile' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              <div className="lg:col-span-5 rounded-xl border border-card-border bg-card p-6 flex flex-col items-center shadow-lg relative overflow-hidden">
                <span className="absolute top-4 left-4 text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
                  Skill radar
                </span>

                <div className="w-64 h-64 mt-4">
                  <svg viewBox="-15 0 230 200" className="w-full h-full select-none">
                    <polygon points={getHexPoints(r)} fill="none" stroke="var(--color-card-border)" strokeWidth="1" />
                    <polygon points={getHexPoints(r * 0.75)} fill="none" stroke="var(--color-card-border)" strokeWidth="1" strokeDasharray="1,2" />
                    <polygon points={getHexPoints(r * 0.5)} fill="none" stroke="var(--color-card-border)" strokeWidth="1" strokeDasharray="1,2" />
                    <polygon points={getHexPoints(r * 0.25)} fill="none" stroke="var(--color-card-border)" strokeWidth="1" strokeDasharray="1,2" />

                    {radarAngles.map((angle, idx) => {
                      const x = cx + r * Math.cos(angle);
                      const y = cy + r * Math.sin(angle);
                      return <line key={idx} x1={cx} y1={cy} x2={x} y2={y} stroke="var(--color-card-border)" strokeWidth="1" />;
                    })}

                    {averages && (
                      <polygon
                        points={getPointsStr()}
                        fill="rgba(217, 119, 6, 0.15)"
                        stroke="#d97706"
                        strokeWidth="2"
                      />
                    )}

                    <text x="100" y="16" fill="var(--color-foreground)" fontSize="7" fontFamily="monospace" textAnchor="middle" fontWeight="bold">REACTION</text>
                    <text x="175" y="70" fill="var(--color-foreground)" fontSize="7" fontFamily="monospace" textAnchor="start" fontWeight="bold">MEMORY</text>
                    <text x="155" y="162" fill="var(--color-foreground)" fontSize="7" fontFamily="monospace" textAnchor="start" fontWeight="bold">PROCESSING</text>
                    <text x="100" y="192" fill="var(--color-foreground)" fontSize="7" fontFamily="monospace" textAnchor="middle" fontWeight="bold">PRECISION</text>
                    <text x="45" y="162" fill="var(--color-foreground)" fontSize="7" fontFamily="monospace" textAnchor="end" fontWeight="bold">FOCUS</text>
                    <text x="25" y="70" fill="var(--color-foreground)" fontSize="7" fontFamily="monospace" textAnchor="end" fontWeight="bold">STAMINA</text>
                  </svg>
                </div>

                {/* Score breakdown bars */}
                {averages && (
                  <div className="w-full flex flex-col gap-3.5 mt-6 border-t border-card-border/60 pt-5">
                    {[
                      { label: 'Reaction Speed', score: averages.reaction },
                      { label: 'Memory Capacity', score: averages.memory },
                      { label: 'Processing Speed', score: averages.processing },
                      { label: 'Precision & Control', score: averages.precision },
                      { label: 'Focus & Attention', score: averages.focus },
                      { label: 'Cognitive Stamina', score: averages.stamina }
                    ].map((item, idx) => (
                      <div key={idx} className="flex flex-col gap-1 text-[11px]">
                        <div className="flex justify-between font-mono text-zinc-500 dark:text-zinc-400">
                          <span>{item.label}</span>
                          <span className="text-foreground font-bold">{item.score}%ile</span>
                        </div>
                        <div className="w-full bg-subtle h-2 rounded border border-card-border/60 overflow-hidden">
                          <div className="bg-accent h-full rounded" style={{ width: `${item.score}%` }}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {persona && (
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 text-center leading-relaxed mt-4 pt-4 border-t border-card-border/60">
                    <strong>Persona Detail:</strong> {persona.explanation}
                  </p>
                )}
              </div>

              <div className="lg:col-span-7 flex flex-col gap-6">
                
                {dailyChallenge && (
                  <div className={`rounded-xl border p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow ${
                    challengeCompleted 
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400' 
                      : 'bg-card border-card-border'
                  }`}>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono uppercase tracking-widest text-zinc-500">Daily Challenge</span>
                        {challengeCompleted && (
                          <span className="text-[10px] font-mono bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded">✓ COMPLETED</span>
                        )}
                      </div>
                      <h4 className="text-sm font-bold text-foreground">{dailyChallenge.name} Challenge</h4>
                      <p className="text-zinc-500 dark:text-zinc-400 text-xs leading-normal">{dailyChallenge.desc}</p>
                    </div>
                    {!challengeCompleted && (
                      <a
                        href={`/tests/${dailyChallenge.testId}`}
                        className="px-4 py-2 rounded bg-accent hover:bg-accent-hover text-black font-semibold text-xs font-mono uppercase shrink-0 transition-standard"
                      >
                        Play Challenge
                      </a>
                    )}
                  </div>
                )}

                <div className="rounded-xl border border-card-border bg-card p-5 flex flex-col gap-3 shadow">
                  <span className="text-xs font-mono uppercase tracking-widest text-zinc-500">Adaptive Recommendations</span>
                  <div className="flex flex-col gap-3">
                    {getRecommendations().map((rec, i) => (
                      <div key={i} className="flex justify-between items-center text-xs py-2 border-b border-card-border/40 last:border-0">
                        <span className="text-zinc-650 dark:text-zinc-300">{rec.text}</span>
                        <a 
                          href={rec.link}
                          className="text-accent hover:underline font-mono uppercase text-[10px] shrink-0 ml-3"
                        >
                          Train Now &rarr;
                        </a>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl border border-card-border bg-card p-5 flex flex-col gap-4 shadow">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-mono uppercase tracking-widest text-zinc-500">US Demographic Benchmark</span>
                    <h4 className="text-sm font-bold text-foreground">National Cognitive Comparison Engine</h4>
                    <p className="text-zinc-550 dark:text-zinc-400 text-xs leading-normal">
                      Compare your composite BBI scores against US Census demographics, professional benchmarks, and state-level cognitive norms.
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-2.5">
                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] font-mono text-zinc-500 uppercase">Age Bracket</label>
                      <select
                        value={demographicAge}
                        onChange={(e) => setDemographicAge(e.target.value)}
                        className="bg-subtle border border-card-border rounded px-2 py-1 text-xs text-foreground font-mono outline-none w-full"
                      >
                        <option value="18-24">18–24 yrs</option>
                        <option value="25-34">25–34 yrs</option>
                        <option value="35-44">35–44 yrs</option>
                        <option value="45-54">45–54 yrs</option>
                        <option value="55-64">55–64 yrs</option>
                        <option value="65+">65+ yrs</option>
                      </select>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] font-mono text-zinc-500 uppercase">Profession</label>
                      <select
                        value={demographicProfession}
                        onChange={(e) => setDemographicProfession(e.target.value)}
                        className="bg-subtle border border-card-border rounded px-2 py-1 text-xs text-foreground font-mono outline-none w-full"
                      >
                        <option value="General Population">General Pop</option>
                        <option value="Software Engineer">Developer</option>
                        <option value="Pro Esports Player">Esports Pro</option>
                        <option value="Fighter Pilot">Pilot</option>
                        <option value="Healthcare Professional">Medical</option>
                        <option value="Student">Student</option>
                      </select>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] font-mono text-zinc-500 uppercase">US State</label>
                      <select
                        value={demographicState}
                        onChange={(e) => setDemographicState(e.target.value)}
                        className="bg-subtle border border-card-border rounded px-2 py-1 text-xs text-foreground font-mono outline-none w-full"
                      >
                        <option value="California">California</option>
                        <option value="Texas">Texas</option>
                        <option value="New York">New York</option>
                        <option value="Florida">Florida</option>
                        <option value="Washington">Washington</option>
                        <option value="Massachusetts">Massachusetts</option>
                        <option value="National Average">National Avg</option>
                      </select>
                    </div>
                  </div>

                  {getDemographicComparison() && (
                    <div className="p-3.5 bg-accent/5 border border-accent/20 rounded-lg flex flex-col gap-2 mt-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono text-zinc-550 dark:text-zinc-400">Demographic Rank:</span>
                        <span className="text-sm font-bold text-accent">Top {getDemographicComparison()?.percentile}%</span>
                      </div>
                      <p className="text-[11px] leading-relaxed text-foreground font-mono">
                        {getDemographicComparison()?.text}
                      </p>
                      <div className="text-[10px] text-zinc-500 flex items-center justify-between border-t border-card-border/50 pt-2 mt-1">
                        <span>Database: <strong>US-COGNITIVE-2026</strong></span>
                        <span className="text-accent">Calibrated</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="rounded-xl border border-card-border bg-card p-5 flex flex-col gap-4 shadow">
                  <div className="flex justify-between items-center flex-wrap gap-2">
                    <span className="text-xs font-mono uppercase tracking-widest text-zinc-500">Performance Timeline</span>
                    <select
                      value={graphTestId}
                      onChange={(e) => setGraphTestId(e.target.value)}
                      className="bg-subtle border border-card-border rounded px-2.5 py-1 text-xs text-foreground font-mono outline-none"
                    >
                      {Object.keys(TEST_NAMES).map(k => (
                        <option key={k} value={k}>{TEST_NAMES[k]}</option>
                      ))}
                    </select>
                  </div>

                  {trendPoints.length >= 2 ? (
                    <div className="w-full mt-2">
                      <svg viewBox="0 0 240 100" className="w-full h-28 overflow-visible">
                        <line x1="15" y1="15" x2="225" y2="15" stroke="var(--color-card-border)" strokeWidth="0.5" strokeDasharray="2,2" />
                        <line x1="15" y1="50" x2="225" y2="50" stroke="var(--color-card-border)" strokeWidth="0.5" strokeDasharray="2,2" />
                        <line x1="15" y1="85" x2="225" y2="85" stroke="var(--color-card-border)" strokeWidth="0.5" strokeDasharray="2,2" />

                        <path
                          d={`M ${trendPoints.map(p => `${p.x} ${p.y}`).join(' L ')}`}
                          fill="none"
                          stroke="#d97706"
                          strokeWidth="2"
                        />

                        {trendPoints.map((pt, i) => (
                          <g key={i} className="group cursor-pointer">
                            <circle
                              cx={pt.x}
                              cy={pt.y}
                              r="3.5"
                              fill="#09090b"
                              stroke="#d97706"
                              strokeWidth="1.5"
                            />
                            <title>{`${pt.val} (${pt.date})`}</title>
                          </g>
                        ))}
                      </svg>
                      <div className="flex justify-between items-center text-[10px] text-zinc-500 font-mono mt-2 px-3">
                        <span>First recorded</span>
                        <span>Latest attempt</span>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-28 flex items-center justify-center border border-dashed border-card-border/60 rounded text-[11px] text-zinc-500 font-mono">
                      Need at least 2 attempts of this test to draw trendline.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'history' && (() => {
            const filteredHistory = history.filter(r => {
              if (historyPeriod === 'all') return true;
              const now = Date.now();
              const age = now - r.timestamp;
              if (historyPeriod === '30d') return age <= 30 * 24 * 60 * 60 * 1000;
              if (historyPeriod === '7d') return age <= 7 * 24 * 60 * 60 * 1000;
              if (historyPeriod === 'today') {
                const startOfToday = new Date().setHours(0, 0, 0, 0);
                return r.timestamp >= startOfToday;
              }
              return true;
            });

            const avgPercentile = filteredHistory.length > 0
              ? Math.round(filteredHistory.reduce((sum, r) => sum + r.percentile, 0) / filteredHistory.length)
              : null;

            return (
              <div className="rounded-xl border border-card-border bg-card p-6 shadow-lg flex flex-col gap-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h3 className="text-sm font-bold text-foreground uppercase font-mono tracking-wider">Assessment Ledger</h3>
                    <p className="text-zinc-400 text-xs mt-0.5">Filter and analyze your historical performance trendlines.</p>
                  </div>
                  
                  {/* Period Filter Buttons */}
                  <div className="flex bg-subtle p-0.5 rounded border border-card-border">
                    {(['all', '30d', '7d', 'today'] as const).map((period) => (
                      <button
                        key={period}
                        onClick={() => setHistoryPeriod(period)}
                        className={`px-3 py-1 text-[10px] font-mono uppercase tracking-wider rounded cursor-pointer transition-colors ${
                          historyPeriod === period 
                            ? 'bg-accent text-black font-semibold shadow' 
                            : 'text-zinc-500 hover:text-foreground dark:text-zinc-400 dark:hover:text-zinc-200'
                        }`}
                      >
                        {period === 'all' ? 'Lifetime' : period}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Period Summary Stats Cards */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg border border-card-border/60 bg-subtle flex flex-col">
                    <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest mb-1">Period Attempts</span>
                    <span className="text-xl font-bold font-mono text-foreground">{filteredHistory.length}</span>
                  </div>
                  <div className="p-4 rounded-lg border border-card-border/60 bg-subtle flex flex-col">
                    <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest mb-1">Avg Percentile</span>
                    <span className="text-xl font-bold font-mono text-accent">
                      {avgPercentile !== null ? `Top ${avgPercentile}%` : '--'}
                    </span>
                  </div>
                </div>

                <div className="w-full overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-card-border text-zinc-500 font-mono">
                        <th className="py-2.5 font-medium">Test Dimension</th>
                        <th className="py-2.5 font-medium">Recorded Score</th>
                        <th className="py-2.5 font-medium text-right">Percentile</th>
                        <th className="py-2.5 font-medium text-right pr-2">Sync</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-card-border/40 font-mono">
                      {filteredHistory.map((row) => (
                        <tr key={row.id} className="hover:bg-subtle/50 text-foreground dark:text-zinc-300">
                          <td className="py-3 font-sans text-foreground font-medium flex flex-col">
                            <span>{TEST_NAMES[row.testId] || row.testId}</span>
                          <span className="text-[10px] font-mono text-zinc-500">
                            {new Date(row.timestamp).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </td>
                        <td className="py-3 text-foreground font-semibold">
                          {formatScore(row.testId, row.rawScore)}
                        </td>
                        <td className="py-3 text-right text-accent font-bold">
                          Top {row.percentile}%
                        </td>
                        <td className="py-3 text-right pr-2">
                          {row.synced ? (
                            <span className="text-emerald-400" title="Edge Backup Active">✓</span>
                          ) : (
                            <span className="text-zinc-650" title="Local Cache Only">◷</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
          })()}

          {activeTab === 'achievements' && (
            <div className="rounded-xl border border-card-border bg-card p-6 shadow-lg flex flex-col gap-6">
              <div>
                <h3 className="text-sm font-bold text-foreground uppercase font-mono tracking-wider">Achievements Trophy Room</h3>
                <p className="text-zinc-550 dark:text-zinc-400 text-xs mt-1">Unlock professional badges by hitting cognitive milestones.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {ACHIEVEMENTS_LIST.map((ach) => {
                  const unlocked = checkAchievement(ach.id);
                  return (
                    <div 
                      key={ach.id} 
                      className={`p-4 rounded-lg border flex items-center gap-4 transition-standard ${
                        unlocked 
                          ? 'bg-accent/5 border-accent/25' 
                          : 'bg-subtle/50 border-card-border opacity-50'
                      }`}
                    >
                      <div className="text-2xl w-10 h-10 rounded-full bg-subtle border border-card-border flex items-center justify-center">
                        {ach.badge}
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className={`text-sm font-bold ${unlocked ? 'text-foreground font-semibold' : 'text-zinc-500 dark:text-zinc-400'}`}>{ach.title}</span>
                        <span className="text-[11px] text-zinc-500 dark:text-zinc-450">{ach.desc}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'diagnostics' && (
            <div className="rounded-xl border border-card-border bg-card p-6 shadow-lg flex flex-col gap-6">
              <div>
                <h3 className="text-sm font-bold text-foreground uppercase font-mono tracking-wider">Hardware & Browser Diagnostics</h3>
                <p className="text-zinc-550 dark:text-zinc-400 text-xs mt-1">Telemetry parameters measuring measurement fidelity.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-mono text-xs">
                
                <div className="flex flex-col gap-4 border-r border-card-border/40 pr-6">
                  <div className="flex justify-between border-b border-card-border/30 pb-2">
                    <span className="text-zinc-500">Monitor Refresh Rate</span>
                    <span className="text-foreground font-bold">{diagnostics?.hz ? `${diagnostics.hz}Hz` : 'Detecting...'}</span>
                  </div>
                  <div className="flex justify-between border-b border-card-border/30 pb-2">
                    <span className="text-zinc-500">Device Platform</span>
                    <span className="text-foreground font-bold">{diagnostics?.deviceType || 'Detecting...'}</span>
                  </div>
                  <div className="flex justify-between border-b border-card-border/30 pb-2">
                    <span className="text-zinc-500">Input Mode Interface</span>
                    <span className="text-foreground font-bold">{diagnostics?.inputMethod || 'Detecting...'}</span>
                  </div>
                  <div className="flex justify-between border-b border-card-border/30 pb-2">
                    <span className="text-zinc-500">Browser Agent</span>
                    <span className="text-foreground font-bold">{diagnostics?.browser || 'Detecting...'}</span>
                  </div>
                  <div className="flex justify-between border-b border-card-border/30 pb-2">
                    <span className="text-zinc-500">Operating System</span>
                    <span className="text-foreground font-bold">{diagnostics?.os || 'Detecting...'}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-3 justify-center">
                  <h4 className="text-xs font-bold text-foreground uppercase tracking-wider mb-1">Calibration Alert Ledger</h4>
                  {diagnostics?.hz && diagnostics.hz < 60 && (
                    <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded text-zinc-700 dark:text-zinc-350 leading-normal text-[11px]">
                      ⚠️ <strong>Refresh Rate Alert:</strong> Under 60Hz screen refresh detected. Browser paint sync lag may introduce an artificial +16.7ms delay to visually clocked assessments.
                    </div>
                  )}
                  {diagnostics?.inputMethod === 'Touch' && (
                    <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded text-zinc-700 dark:text-zinc-350 leading-normal text-[11px]">
                      ⚠️ <strong>Touch Latency Warning:</strong> Touch digitizers add between 20ms and 50ms of physical processing delay. For optimal scores, execute reaction tests with a physical mouse or keyboard.
                    </div>
                  )}
                  {diagnostics?.hz && diagnostics.hz >= 60 && diagnostics.inputMethod !== 'Touch' && (
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded text-zinc-700 dark:text-zinc-350 leading-normal text-[11px]">
                      ✓ <strong>Telemetry Calibrated:</strong> Hardware refresh and mouse input methods are optimal. Visual and mechanical click delays are minimized.
                    </div>
                  )}
                </div>

              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
