import React, { useState, useEffect } from 'react';
import { dataLayer, type SessionRecord } from '../../runtime/dataLayer';
import { formatTopPercentile } from '../../runtime/percentileLookup';
import { 
  computeCategoryAverages, 
  calculateBbiScore, 
  getRadarCoordinates,
  type CognitiveAverages 
} from '../../runtime/skillRadar';
import { 
  determinePersona, 
  generateDailyChallengeForDay, 
  getAdaptiveRecommendations,
  type DailyChallenge
} from '../../runtime/trainingEngine';
import TestSummaryGrid from './TestSummaryGrid';
import CrossTestBarChart from './CrossTestBarChart';
import MultiTrendChart from './MultiTrendChart';
import CompletionTracker from './CompletionTracker';

interface DiagnosticInfo {
  hz: number;
  deviceType: 'Mobile' | 'Tablet' | 'Desktop';
  inputMethod: 'Touch' | 'Mouse/Keyboard';
  browser: string;
  os: string;
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
  'visual-pattern': 'Visual Pattern Memory',
  'stroop': 'Stroop Attention Test',
  'pattern-reasoning': 'Pattern Reasoning Test',
  'tmt-partA': 'Trail Making Test (Part A)',
  'tmt-partB': 'Trail Making Test (Part B)',
  'dual-n-back': 'Dual N-Back Memory',
  'focus-challenge': 'Focus Challenge',
  'gauntlet': 'The Gauntlet',
  'verbal-memory': 'Verbal Memory Test',
  'spatial-orientation': 'Spatial Orientation Test',
  'mouse-accuracy': 'Mouse Accuracy Test',
  'flick-trainer': 'Flick Trainer',
  'decision-speed': 'Decision Speed Test',
  'planning': 'Planning Test',
  'prioritization': 'Prioritization Test'
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
  { id: 'stroop_master', title: 'Stroop Master', desc: 'Stroop color clash average under 750 ms', badge: '🎨' },
  { id: 'pattern_detective', title: 'Pattern Detective', desc: 'Achieve 7,500+ Pts in Pattern Reasoning', badge: '🔮' },
  { id: 'trail_blazer', title: 'Trail Blazer', desc: 'Complete Trail Making Part B under 45 seconds', badge: '🧭' },
  { id: 'quantum_memory', title: 'Quantum Memory', desc: 'Achieve 4,500+ Pts in Dual N-Back', badge: '🧠' },
  { id: 'streak_consistency', title: 'Daily Consistency', desc: 'Maintain a 3+ Day active streak', badge: '🔥' },
  { id: 'full_spectrum', title: 'Full Spectrum', desc: 'Try at least 5 different assessments', badge: '🌈' },
  { id: 'focus_challenge', title: 'Brain Rot Survivor', desc: 'Complete all 5 stages of the Focus Challenge', badge: '🧠' },
  { id: 'gauntlet_champion', title: 'The Gauntlet Champion', desc: 'Achieve CAI 80+ in The Gauntlet', badge: '🏆' },
  { id: 'verbal_legend', title: 'Verbal Legend', desc: 'Recall 8+ words in Verbal Memory Test', badge: '📝' },
  { id: 'spatial_master', title: 'Spatial Master', desc: 'Score 80%+ in Spatial Orientation Test', badge: '🔄' },
  { id: 'surgical_aim', title: 'Surgical Aim', desc: 'Average offset under 10px in Mouse Accuracy', badge: '🎯' },
  { id: 'flick_pro', title: 'Flick Pro', desc: '90%+ accuracy in Flick Trainer', badge: '⚡' },
  { id: 'lightning_decisions', title: 'Lightning Decisions', desc: '90%+ accuracy in Decision Speed Test', badge: '⚡' },
  { id: 'grandmaster_planner', title: 'Grandmaster Planner', desc: 'Complete Planning Test in 15 moves', badge: '♟️' },
  { id: 'priority_ace', title: 'Priority Ace', desc: 'Score 300+ total points in Prioritization Test', badge: '📊' }
];

export default function CognitiveProfile() {
  const [history, setHistory] = useState<SessionRecord[]>([]);
  const [streak, setStreak] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [averages, setAverages] = useState<CognitiveAverages | null>(null);
  
  // CAI & Persona
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
  const [activeTab, setActiveTab] = useState<'profile' | 'alltests' | 'history' | 'achievements' | 'diagnostics'>('profile');
  const [historyPeriod, setHistoryPeriod] = useState<'all' | '30d' | '7d' | 'today'>('all');

  // US Demographic Benchmark State
  const [demographicAge, setDemographicAge] = useState<string>('25-34');
  const [demographicProfession, setDemographicProfession] = useState<string>('Software Engineer');
  const [demographicState, setDemographicState] = useState<string>('California');

  const isProfileEmpty = history.length === 0;

  const getDemographicComparison = () => {
    if (!bbiScore) return null;
    
    // Base percentile is derived from CAI (CAI is 0-1000, CAI / 10 is percentile from 0 to 100)
    const basePercentile = bbiScore / 10;
    
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
      text: `Illustrative Estimate: your performance adjusted ranking is approximately in the Top ${adjustedPercentile.toFixed(1)}% of all ${demographicProfession}s in the ${demographicAge} age bracket residing in ${demographicState}.`,
    };
  };

  useEffect(() => {
    let mounted = true;
    async function loadData() {
      try {
        const records = await dataLayer.getHistory();
        if (!mounted) return;
        setHistory(records);

        const streakInfo = dataLayer.getStreak();
        if (!mounted) return;
        setStreak(streakInfo.streakCount);

        detectDiagnostics();
        
        // Determinstically set daily challenge
        const day = new Date().getDate();
        const challenge = generateDailyChallengeForDay(day);
        if (!mounted) return;
        setDailyChallenge(challenge);

        if (records.length > 0) {
          const computedAverages = computeCategoryAverages(records);
          if (!mounted) return;
          setAverages(computedAverages);
          
          // Calculate CAI and Persona
          if (!mounted) return;
          setBbiScore(calculateBbiScore(computedAverages));
          if (!mounted) return;
          setPersona(determinePersona(computedAverages));
          
          // Check challenge completion state
          const startOfToday = new Date().setHours(0, 0, 0, 0);
          const todayAttempts = records.filter(r => r.testId === challenge.testId && r.timestamp >= startOfToday);
          const metGoal = todayAttempts.some(r => {
            const score = challenge.testId === 'click-speed' ? r.rawScore / 10 : r.rawScore;
            return challenge.condition === 'lower' ? score <= challenge.target : score >= challenge.target;
          });
          if (!mounted) return;
          setChallengeCompleted(metGoal);
        }
      } catch (err) {
        console.error('Failed to load profile dashboard:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadData();
    return () => { mounted = false; };
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
      case 'stroop_master':
        return history.some(r => r.testId === 'stroop' && r.rawScore < 750);
      case 'pattern_detective':
        return history.some(r => r.testId === 'pattern-reasoning' && r.rawScore >= 7500);
      case 'trail_blazer':
        return history.some(r => r.testId === 'tmt-partB' && r.rawScore < 45000);
      case 'quantum_memory':
        return history.some(r => r.testId === 'dual-n-back' && r.rawScore >= 4500);
      case 'streak_consistency':
        return streak >= 3;
      case 'full_spectrum':
        const uniquePlayed = new Set(history.map(r => r.testId));
        return uniquePlayed.size >= 5;
      case 'focus_challenge':
        return history.some(r => r.testId === 'focus-challenge' && r.rawScore >= 60);
      case 'gauntlet_champion':
        return history.some(r => r.testId === 'gauntlet' && r.rawScore >= 80);
      case 'verbal_legend':
        return history.some(r => r.testId === 'verbal-memory' && r.rawScore >= 8);
      case 'spatial_master':
        return history.some(r => r.testId === 'spatial-orientation' && r.rawScore >= 80);
      case 'surgical_aim':
        return history.some(r => r.testId === 'mouse-accuracy' && r.metadata?.avgOffsetPx < 10);
      case 'flick_pro':
        return history.some(r => r.testId === 'flick-trainer' && r.metadata?.accuracy >= 90);
      case 'lightning_decisions':
        return history.some(r => r.testId === 'decision-speed' && r.metadata?.accuracy >= 90);
      case 'grandmaster_planner':
        return history.some(r =>
          r.testId === 'planning' &&
          r.metadata != null &&
          typeof r.metadata.moves === 'number' &&
          typeof r.metadata.optimalMoves === 'number' &&
          r.metadata.moves === r.metadata.optimalMoves
        );
      case 'priority_ace':
        return history.some(r => r.testId === 'prioritization' && r.metadata?.totalPoints >= 300);
      default:
        return false;
    }
  };

  const getUnlockedAchievementsCount = (): number => {
    return ACHIEVEMENTS_LIST.filter(a => checkAchievement(a.id)).length;
  };

  const getRecommendations = () => {
    if (!averages) return [];
    return getAdaptiveRecommendations(averages);
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
    link.setAttribute("download", `cogniarena_profile_ledger_${Date.now()}.csv`);
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
    return getRadarCoordinates(averages, cx, r);
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
    const maxScore = scores.reduce((a, b) => Math.max(a, b), 1);
    const minScore = scores.reduce((a, b) => Math.min(a, b), 0);
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
            <p className="text-muted text-sm leading-relaxed max-w-sm">
              Complete at least one assessment test to unlock your Cognitive Profile, Daily Streaks, and Skill Radar metrics.
            </p>
          </div>
          <a
            href="/tests/reaction-time"
            className="px-6 h-10 rounded bg-accent hover:bg-accent-hover text-white font-semibold text-xs font-mono uppercase flex items-center active:scale-98 transition-standard shadow"
          >
            Launch First Assessment
          </a>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            
            <div className="rounded-xl border border-card-border bg-card p-5 flex flex-col justify-between shadow relative overflow-hidden">
              <span className="text-[10px] font-mono text-muted uppercase tracking-widest">CogniArena Index (CAI)</span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl font-bold font-mono text-foreground">{bbiScore !== null && bbiScore !== undefined ? bbiScore : '--'}</span>
                <span className="text-xs text-muted font-mono">/ 1000</span>
              </div>
              <div className="w-full bg-subtle h-1.5 rounded-full mt-3 overflow-hidden border border-card-border/60">
                <div className="bg-accent h-full rounded-full transition-all duration-500" style={{ width: `${(bbiScore || 0) / 10}%` }}></div>
              </div>
              <span className="text-[9px] text-muted font-mono uppercase mt-2">Aggregated percentile indicator</span>
            </div>

            <div className="rounded-xl border border-card-border bg-card p-5 flex flex-col justify-between shadow">
              <span className="text-[10px] font-mono text-muted uppercase tracking-widest">Active Streak</span>
              <div className="flex items-baseline gap-1 mt-2">
                <span className="text-3xl font-bold font-mono text-foreground">{streak}</span>
                <span className="text-xs text-muted font-mono">Days</span>
              </div>
              <div className="text-[10px] text-muted mt-3 flex items-center gap-1.5">
                <span className="text-warning animate-pulse">🔥</span>
                <span>Complete 1 test daily to maintain</span>
              </div>
            </div>

            <div className="rounded-xl border border-card-border bg-card p-5 flex flex-col justify-between shadow">
              <span className="text-[10px] font-mono text-muted uppercase tracking-widest">Completed Runs</span>
              <div className="flex items-baseline mt-2">
                <span className="text-3xl font-bold font-mono text-accent">{history.length}</span>
              </div>
              <button 
                onClick={exportHistoryToCSV}
                className="text-[10px] text-muted hover:text-accent font-mono mt-3 flex items-center gap-1 cursor-pointer transition-colors active:scale-95 bg-transparent border-0 outline-none"
              >
                <span>📥 Export Profile ledger (CSV)</span>
              </button>
            </div>

            <div className="rounded-xl border border-card-border bg-card p-5 flex flex-col justify-between shadow">
              <span className="text-[10px] font-mono text-muted uppercase tracking-widest">Cognitive Persona</span>
              <div className="mt-2 flex flex-col gap-0.5">
                <span className="text-lg font-bold text-foreground leading-snug">{persona?.title || 'Adaptive Learner'}</span>
                <span className="text-[10px] text-muted italic">{persona?.desc || 'Balanced Cognitive Profile'}</span>
              </div>
              <span className="text-[9px] text-muted font-mono uppercase mt-3">Derived from strongest scores</span>
            </div>

          </div>

          {/* Visible scientific/medical disclaimer alert in same viewport */}
          <div className="bg-subtle border border-card-border p-4 rounded-xl text-xs text-muted flex items-start gap-3 leading-relaxed shadow-sm">
            <span className="text-lg leading-none select-none">⚠️</span>
            <div>
              <strong className="text-foreground font-semibold">Disclaimer & Scope Note:</strong>{' '}
              CogniArena is an educational self-tracking and cognitive training platform. All index scores (CAI), comparative percentiles, occupational rankings, and cognitive personas represent simulated performance benchmarks. They are not medical, clinical, diagnostic, or neuropsychological evaluations. If you have concerns about your cognitive function, memory, focus, or reflexes, please consult a licensed medical professional. Read our full{' '}
              <a href="/terms" className="text-accent hover:underline font-medium">
                Terms
              </a>{' '}
              and{' '}
              <a href="/methodology" className="text-accent hover:underline font-medium">
                Methodology
              </a>.
            </div>
          </div>

          {/* Overview Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <CrossTestBarChart />
            <MultiTrendChart />
          </div>

          {/* Completion Tracker */}
          <CompletionTracker />

          <div className="flex border-b border-card-border/60 gap-6 overflow-x-auto">
            <button
              onClick={() => setActiveTab('profile')}
              className={`pb-2.5 text-xs font-mono uppercase tracking-widest cursor-pointer transition-colors relative outline-none whitespace-nowrap ${
                activeTab === 'profile' ? 'text-accent font-semibold border-b-2 border-accent' : 'text-muted hover:text-foreground'
              }`}
            >
              Cognitive Profile
            </button>
            <button
              onClick={() => setActiveTab('alltests')}
              className={`pb-2.5 text-xs font-mono uppercase tracking-widest cursor-pointer transition-colors relative outline-none whitespace-nowrap ${
                activeTab === 'alltests' ? 'text-accent font-semibold border-b-2 border-accent' : 'text-muted hover:text-foreground'
              }`}
            >
              All Tests
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`pb-2.5 text-xs font-mono uppercase tracking-widest cursor-pointer transition-colors relative outline-none whitespace-nowrap ${
                activeTab === 'history' ? 'text-accent font-semibold border-b-2 border-accent' : 'text-muted hover:text-foreground'
              }`}
            >
              Historical Ledger
            </button>
            <button
              onClick={() => setActiveTab('achievements')}
              className={`pb-2.5 text-xs font-mono uppercase tracking-widest cursor-pointer transition-colors relative outline-none whitespace-nowrap ${
                activeTab === 'achievements' ? 'text-accent font-semibold border-b-2 border-accent' : 'text-muted hover:text-foreground'
              }`}
            >
              Achievements ({getUnlockedAchievementsCount()}/{ACHIEVEMENTS_LIST.length})
            </button>
            <button
              onClick={() => setActiveTab('diagnostics')}
              className={`pb-2.5 text-xs font-mono uppercase tracking-widest cursor-pointer transition-colors relative outline-none whitespace-nowrap ${
                activeTab === 'diagnostics' ? 'text-accent font-semibold border-b-2 border-accent' : 'text-muted hover:text-foreground'
              }`}
            >
              Diagnostics
            </button>
          </div>

          {activeTab === 'profile' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              <div className="lg:col-span-5 rounded-xl border border-card-border bg-card p-6 flex flex-col items-center shadow-lg relative overflow-hidden">
                <span className="absolute top-4 left-4 text-[10px] font-mono text-muted uppercase tracking-widest">
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
                        fill="var(--chart-accent-light)"
                        stroke="var(--chart-accent)"
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
                        <div className="flex justify-between font-mono text-muted">
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
                  <p className="text-[11px] text-muted text-center leading-relaxed mt-4 pt-4 border-t border-card-border/60">
                    <strong>Persona Detail:</strong> {persona.explanation}
                  </p>
                )}
              </div>

              <div className="lg:col-span-7 flex flex-col gap-6">
                
                {dailyChallenge && (
                  <div className={`rounded-xl border p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow ${
                    challengeCompleted 
                      ? 'bg-[var(--success-bg)] border-[var(--success-border)] text-success' 
                      : 'bg-card border-card-border'
                  }`}>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono uppercase tracking-widest text-muted">Daily Challenge</span>
                        {challengeCompleted && (
                          <span className="text-[10px] font-mono bg-[var(--success-bg)] border border-[var(--success-border)] text-success px-1.5 py-0.5 rounded">✓ COMPLETED</span>
                        )}
                      </div>
                      <h4 className="text-sm font-bold text-foreground">{dailyChallenge.name} Challenge</h4>
                      <p className="text-muted text-xs leading-normal">{dailyChallenge.desc}</p>
                    </div>
                    {!challengeCompleted && (
                      <a
                        href={`/tests/${dailyChallenge.testId}`}
                        className="px-4 py-2 rounded bg-accent hover:bg-accent-hover text-white font-semibold text-xs font-mono uppercase shrink-0 transition-standard"
                      >
                        Play Challenge
                      </a>
                    )}
                  </div>
                )}

                <div className="rounded-xl border border-card-border bg-card p-5 flex flex-col gap-3 shadow">
                  <span className="text-xs font-mono uppercase tracking-widest text-muted">Adaptive Recommendations</span>
                  <div className="flex flex-col gap-3">
                    {getRecommendations().map((rec, i) => (
                      <div key={i} className="flex justify-between items-center text-xs py-2 border-b border-card-border/40 last:border-0">
                        <span className="text-muted dark:text-muted">{rec.text}</span>
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
                    <span className="text-xs font-mono uppercase tracking-widest text-muted">US Demographic Benchmark</span>
                    <h4 className="text-sm font-bold text-foreground">National Cognitive Comparison Engine</h4>
                    <p className="text-muted text-xs leading-normal">
                      Compare your composite CAI scores against US Census demographics, professional benchmarks, and state-level cognitive norms.
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-2.5">
                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] font-mono text-muted uppercase">Age Bracket</label>
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
                      <label className="text-[9px] font-mono text-muted uppercase">Profession</label>
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
                      <label className="text-[9px] font-mono text-muted uppercase">US State</label>
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
                        <span className="text-xs font-mono text-muted">Demographic Rank:</span>
                        <span className="text-sm font-bold text-accent">Top {getDemographicComparison()?.percentile}%</span>
                      </div>
                      <p className="text-[11px] leading-relaxed text-foreground font-mono">
                        {getDemographicComparison()?.text}
                      </p>
                      <div className="text-[10px] text-muted flex items-center justify-between border-t border-card-border/50 pt-2 mt-1">
                        <span>Database: <strong>US-COGNITIVE-2026</strong></span>
                        <span className="text-accent">Calibrated</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="rounded-xl border border-card-border bg-card p-5 flex flex-col gap-4 shadow">
                  <div className="flex justify-between items-center flex-wrap gap-2">
                    <span className="text-xs font-mono uppercase tracking-widest text-muted">Performance Timeline</span>
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
                          stroke="var(--chart-accent)"
                          strokeWidth="2"
                        />

                        {trendPoints.map((pt, i) => (
                          <g key={i} className="group cursor-pointer">
                            <circle
                              cx={pt.x}
                              cy={pt.y}
                              r="3.5"
                              fill="var(--bg-card)"
                              stroke="var(--chart-accent)"
                              strokeWidth="1.5"
                            />
                            <title>{`${pt.val} (${pt.date})`}</title>
                          </g>
                        ))}
                      </svg>
                      <div className="flex justify-between items-center text-[10px] text-muted font-mono mt-2 px-3">
                        <span>First recorded</span>
                        <span>Latest attempt</span>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-28 flex items-center justify-center border border-dashed border-card-border/60 rounded text-[11px] text-muted font-mono">
                      Need at least 2 attempts of this test to draw trendline.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'alltests' && (
            <TestSummaryGrid />
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
                    <p className="text-secondary text-xs mt-0.5">Filter and analyze your historical performance trendlines.</p>
                  </div>
                  
                  {/* Period Filter Buttons */}
                  <div className="flex bg-subtle p-0.5 rounded border border-card-border">
                    {(['all', '30d', '7d', 'today'] as const).map((period) => (
                      <button
                        key={period}
                        onClick={() => setHistoryPeriod(period)}
                        className={`px-3 py-1 text-[10px] font-mono uppercase tracking-wider rounded cursor-pointer transition-colors ${
                          historyPeriod === period 
                            ? 'bg-accent text-white font-semibold shadow' 
                            : 'text-muted hover:text-foreground dark:text-secondary dark:hover:text-foreground'
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
                    <span className="text-[9px] font-mono text-muted uppercase tracking-widest mb-1">Period Attempts</span>
                    <span className="text-xl font-bold font-mono text-foreground">{filteredHistory.length}</span>
                  </div>
                  <div className="p-4 rounded-lg border border-card-border/60 bg-subtle flex flex-col">
                    <span className="text-[9px] font-mono text-muted uppercase tracking-widest mb-1">Avg Percentile</span>
                    <span className="text-xl font-bold font-mono text-accent">
                      {avgPercentile !== null ? `Top ${100 - avgPercentile}%` : '--'}
                    </span>
                  </div>
                </div>

                <div className="w-full overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-card-border text-muted font-mono">
                        <th className="py-2.5 font-medium">Test Dimension</th>
                        <th className="py-2.5 font-medium">Recorded Score</th>
                        <th className="py-2.5 font-medium text-right">Percentile</th>
                        <th className="py-2.5 font-medium text-right pr-2">Sync</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-card-border/40 font-mono">
                      {filteredHistory.map((row) => (
                        <tr key={row.id} className="hover:bg-subtle/50 text-foreground dark:text-muted">
                          <td className="py-3 font-sans text-foreground font-medium flex flex-col">
                            <span>{TEST_NAMES[row.testId] || row.testId}</span>
                          <span className="text-[10px] font-mono text-muted">
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
                          Top {formatTopPercentile(row.percentile)}%
                        </td>
                        <td className="py-3 text-right pr-2">
                          {row.synced ? (
                            <span className="text-success" title="Edge Backup Active">✓</span>
                          ) : (
                            <span className="text-muted" title="Local Cache Only">◷</span>
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
                <p className="text-muted text-xs mt-1">Unlock professional badges by hitting cognitive milestones.</p>
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
                        <span className={`text-sm font-bold ${unlocked ? 'text-foreground font-semibold' : 'text-muted'}`}>{ach.title}</span>
                        <span className="text-[11px] text-muted">{ach.desc}</span>
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
                <p className="text-muted text-xs mt-1">Telemetry parameters measuring measurement fidelity.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-mono text-xs">
                
                <div className="flex flex-col gap-4 border-r border-card-border/40 pr-6">
                  <div className="flex justify-between border-b border-card-border/30 pb-2">
                    <span className="text-muted">Monitor Refresh Rate</span>
                    <span className="text-foreground font-bold">{diagnostics?.hz ? `${diagnostics.hz}Hz` : 'Detecting...'}</span>
                  </div>
                  <div className="flex justify-between border-b border-card-border/30 pb-2">
                    <span className="text-muted">Device Platform</span>
                    <span className="text-foreground font-bold">{diagnostics?.deviceType || 'Detecting...'}</span>
                  </div>
                  <div className="flex justify-between border-b border-card-border/30 pb-2">
                    <span className="text-muted">Input Mode Interface</span>
                    <span className="text-foreground font-bold">{diagnostics?.inputMethod || 'Detecting...'}</span>
                  </div>
                  <div className="flex justify-between border-b border-card-border/30 pb-2">
                    <span className="text-muted">Browser Agent</span>
                    <span className="text-foreground font-bold">{diagnostics?.browser || 'Detecting...'}</span>
                  </div>
                  <div className="flex justify-between border-b border-card-border/30 pb-2">
                    <span className="text-muted">Operating System</span>
                    <span className="text-foreground font-bold">{diagnostics?.os || 'Detecting...'}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-3 justify-center">
                  <h4 className="text-xs font-bold text-foreground uppercase tracking-wider mb-1">Calibration Alert Ledger</h4>
                  {diagnostics?.hz && diagnostics.hz < 60 && (
                    <div className="p-3 bg-warning-bg border border-warning-border rounded text-secondary leading-normal text-[11px]">
                      ⚠️ <strong>Refresh Rate Alert:</strong> Under 60Hz screen refresh detected. Browser paint sync lag may introduce an artificial +16.7ms delay to visually clocked assessments.
                    </div>
                  )}
                  {diagnostics?.inputMethod === 'Touch' && (
                    <div className="p-3 bg-warning-bg border border-warning-border rounded text-secondary leading-normal text-[11px]">
                      ⚠️ <strong>Touch Latency Warning:</strong> Touch digitizers add between 20ms and 50ms of physical processing delay. For optimal scores, execute reaction tests with a physical mouse or keyboard.
                    </div>
                  )}
                  {diagnostics?.hz && diagnostics.hz >= 60 && diagnostics.inputMethod !== 'Touch' && (
                    <div className="p-3 bg-success-bg border border-success-border rounded text-secondary leading-normal text-[11px]">
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
