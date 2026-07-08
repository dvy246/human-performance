import React, { useState, useEffect } from 'react';
import { TEST_CONFIGS, loadTestConfig, saveTestConfig, type ConfigOption, type GameConfig } from '../../runtime/testConfig';
import { useI18n } from '../../runtime/useI18n';

interface GameConfigPanelProps {
  testId: string;
  onStart: (config: GameConfig) => void;
  /** Optional override for the start button label */
  startLabel?: string;
  /** Optional emoji/icon shown above the title */
  icon?: string;
  /** Optional title override */
  title?: string;
  /** Optional description text */
  description?: string;
  /** Optional personal best to display */
  personalBest?: number | null;
  /** Optional personal best label */
  personalBestLabel?: string;
}

/**
 * Pre-game configuration panel shown before a test starts.
 * Displays difficulty selector, attempt/parameter options, sound toggle,
 * and a "Start Test" button. Persists last-used settings in localStorage.
 */
export default function GameConfigPanel({
  testId,
  onStart,
  startLabel = 'Start Assessment',
  icon,
  title,
  description,
  personalBest,
  personalBestLabel,
}: GameConfigPanelProps) {
  const { t } = useI18n();
  const options = TEST_CONFIGS[testId] || [];
  const [config, setConfig] = useState<GameConfig>(() => loadTestConfig(testId));
  const [soundEnabled, setSoundEnabled] = useState(() => {
    if (typeof window === 'undefined') return true;
    return localStorage.getItem('cogniarena-muted') !== 'true';
  });

  // Persist sound preference globally
  useEffect(() => {
    localStorage.setItem('cogniarena-muted', soundEnabled ? 'false' : 'true');
  }, [soundEnabled]);

  const handleOptionChange = (key: string, value: string | number) => {
    const next = { ...config, [key]: value };
    setConfig(next);
    saveTestConfig(testId, next);
  };

  const handleStart = () => {
    saveTestConfig(testId, config);
    onStart(config);
  };

  return (
    <div className="w-full min-h-[360px] rounded-xl border border-card-border bg-card p-8 flex flex-col items-center justify-center text-center">
      <div className="flex flex-col items-center gap-5 w-full max-w-sm">
        {/* Icon */}
        {icon && <span className="text-3xl">{icon}</span>}

        {/* Title */}
        {title && (
          <h2 className="text-xl font-bold text-foreground tracking-tight">{title}</h2>
        )}

        {/* Description */}
        {description && (
          <p className="text-muted text-xs leading-relaxed max-w-sm">{description}</p>
        )}

        {/* Config Options */}
        {options.length > 0 && (
          <div className="flex flex-col gap-3 w-full mt-2">
            {options.map((opt: ConfigOption) => (
              <div key={opt.key} className="flex flex-col gap-1.5">
                <span className="text-[10px] font-mono text-muted uppercase tracking-widest text-left">
                  {opt.label}
                </span>
                <div className="flex gap-2">
                  {opt.options.map((val) => {
                    const isSelected = config[opt.key] === val;
                    return (
                      <button
                        key={String(val)}
                        onClick={() => handleOptionChange(opt.key, val)}
                        className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold border transition-standard cursor-pointer ${
                          isSelected
                            ? 'bg-accent text-white border-accent'
                            : 'bg-subtle text-muted border-card-border hover:border-accent/30'
                        }`}
                      >
                        {val}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Sound Toggle */}
        <div className="flex items-center justify-between w-full mt-2 px-1">
          <span className="text-[10px] font-mono text-muted uppercase tracking-widest">{t('config.sound_effects')}</span>
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold border transition-standard cursor-pointer ${
              soundEnabled
                ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30'
                : 'bg-subtle text-muted border-card-border'
            }`}
          >
            <span>{soundEnabled ? '🔊' : '🔇'}</span>
            <span>{soundEnabled ? t('config.sound_on') : t('config.sound_off')}</span>
          </button>
        </div>

        {/* Personal Best */}
        {personalBest !== null && personalBest !== undefined && (
          <span className="text-xs text-accent font-mono mt-1">
            {t('config.personal_best')} {personalBest}{personalBestLabel ? ` ${personalBestLabel}` : ''}
          </span>
        )}

        {/* Start Button */}
        <button
          onClick={handleStart}
          className="w-full mt-3 h-11 rounded-lg bg-accent hover:bg-accent-hover text-white font-bold uppercase text-xs font-mono tracking-wider active:scale-[0.98] transition-standard shadow cursor-pointer"
        >
          {startLabel}
        </button>
      </div>
    </div>
  );
}
