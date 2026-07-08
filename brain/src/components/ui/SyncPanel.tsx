import React, { useState, useEffect } from 'react';
import { dataLayer } from '../../runtime/dataLayer';
import { generateRecoveryCode } from '../../runtime/recovery';

export default function SyncPanel() {
  const [recoveryCode, setRecoveryCode] = useState<string | null>(null);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [inputCode, setInputCode] = useState<string>('');
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [syncMessage, setSyncMessage] = useState<string>('');

  useEffect(() => {
    setRecoveryCode(dataLayer.getRecoveryCode());
  }, []);

  const handleEnableSync = async () => {
    setSyncStatus('syncing');
    setSyncMessage('Generating keys...');
    
    const code = generateRecoveryCode();
    dataLayer.setRecoveryCode(code);
    setRecoveryCode(code);

    try {
      setSyncMessage('Uploading local history...');
      await dataLayer.triggerSync();
      setSyncStatus('success');
      setSyncMessage('Cloud sync activated.');
      setTimeout(() => setSyncStatus('idle'), 3000);
    } catch (err: any) {
      setSyncStatus('error');
      setSyncMessage('Failed to trigger initial upload.');
    }
  };

  const handlePullSync = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCode.trim()) return;

    setSyncStatus('syncing');
    setSyncMessage('Downloading edge telemetry...');

    try {
      dataLayer.setRecoveryCode(inputCode);
      const recordsMerged = await dataLayer.pullSync();
      setRecoveryCode(inputCode);
      setSyncStatus('success');
      setSyncMessage(`Synced! Merged ${recordsMerged} assessments.`);
      setInputCode('');
      setTimeout(() => {
        setSyncStatus('idle');
        setShowModal(false);
        // Refresh page to load IndexedDB changes into state
        window.location.reload();
      }, 2000);
    } catch (err: any) {
      // Revert if failed
      dataLayer.setRecoveryCode('');
      setRecoveryCode(null);
      setSyncStatus('error');
      setSyncMessage('Invalid recovery code or server offline.');
    }
  };

  const handleDisconnect = () => {
    if (confirm('Disconnect sync? Your score history remains safely on this browser, but changes will no longer back up to the cloud.')) {
      dataLayer.setRecoveryCode('');
      setRecoveryCode(null);
      setShowModal(false);
    }
  };

  return (
    <div className="flex flex-col gap-2 w-full pt-4 border-t border-card-border/50">
      <div className="flex items-center justify-between text-[11px] text-muted font-mono">
        <span>Backup Sync</span>
        {recoveryCode ? (
          <div className="flex items-center gap-1.5 text-success">
            <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse"></span>
            <span>Cloud Active</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-muted">
            <span className="w-1.5 h-1.5 rounded-full bg-muted"></span>
            <span>Local Only</span>
          </div>
        )}
      </div>

      {recoveryCode ? (
        <button
          onClick={() => setShowModal(true)}
          className="text-left text-[11px] text-muted hover:text-foreground hover:underline transition-colors mt-0.5"
        >
          Manage Sync Key &middot; View Code
        </button>
      ) : (
        <button
          onClick={() => setShowModal(true)}
          className="text-left text-[11px] text-accent hover:text-accent-hover hover:underline transition-colors mt-0.5"
        >
          Enable Cloud Sync (Backup)
        </button>
      )}

      {/* Sync Management Overlay Dialog */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-card border border-card-border p-6 rounded-xl relative shadow-2xl">
            <button
              onClick={() => { setShowModal(false); setSyncStatus('idle'); }}
              className="absolute right-4 top-4 text-muted hover:text-foreground font-mono text-lg p-1"
              aria-label="Close Sync Modal"
            >
              &times;
            </button>

            <h3 className="text-base font-bold text-foreground tracking-tight mb-2">Cloud Telemetry Sync</h3>
            <p className="text-secondary text-xs leading-relaxed mb-6">
              CogniArena is anonymous and stores data local-first. Activate backup sync to protect your scores and streaks against browser cache wipes, or load scores onto another device.
            </p>

            {recoveryCode ? (
              /* ACTIVE SYNC VIEWER */
              <div className="flex flex-col gap-4">
                <div className="bg-subtle border border-card-border p-4 rounded-lg flex flex-col gap-2">
                  <span className="text-[10px] font-mono uppercase text-muted">Your 8-Word Recovery Code</span>
                  <div className="text-foreground font-mono text-xs select-all bg-[var(--btn-secondary-bg)] px-3 py-2 rounded border border-card-border break-all text-center">
                    {recoveryCode}
                  </div>
                  <span className="text-[10px] text-muted leading-normal">
                    ⚠️ Save this code somewhere safe. Copy and enter this code on another device to restore all attempts and streaks instantly.
                  </span>
                </div>

                <div className="flex gap-3 justify-end mt-2">
                  <button
                    onClick={handleDisconnect}
                    className="px-3 h-8 text-[11px] font-mono uppercase border border-error-border hover:border-error bg-error-bg text-error rounded active:scale-98 transition-all cursor-pointer"
                  >
                    Disconnect
                  </button>
                  <button
                    onClick={() => { dataLayer.triggerSync(); setSyncStatus('success'); setSyncMessage('Forced sync upload complete.'); setTimeout(() => setSyncStatus('idle'), 2000); }}
                    className="px-3 h-8 text-[11px] font-mono uppercase bg-accent text-white font-bold rounded hover:bg-accent-hover active:scale-98 transition-all cursor-pointer"
                  >
                    Force Sync Now
                  </button>
                </div>
              </div>
            ) : (
              /* INACTIVE SYNC GENERATOR/LOADER */
              <div className="flex flex-col gap-6">
                {/* Generate New */}
                <div className="flex flex-col gap-2 p-4 rounded-lg bg-subtle border border-card-border">
                  <h4 className="text-xs font-semibold text-foreground">Create New Sync Key</h4>
                  <p className="text-muted text-[11px] leading-normal mb-2">
                    Generates an anonymous recovery key to lock your local attempts to the Cloudflare Edge database.
                  </p>
                  <button
                    onClick={handleEnableSync}
                    disabled={syncStatus === 'syncing'}
                    className="w-full h-8 text-[11px] font-mono uppercase bg-[var(--btn-secondary-bg)] border border-[var(--btn-secondary-border)] hover:bg-[var(--btn-secondary-hover-bg)] text-foreground rounded active:scale-98 transition-all cursor-pointer"
                  >
                    Generate Recovery Code
                  </button>
                </div>

                {/* Import Existing */}
                <form onSubmit={handlePullSync} className="flex flex-col gap-2 p-4 rounded-lg bg-subtle border border-card-border">
                  <h4 className="text-xs font-semibold text-foreground">Sync Existing Profile</h4>
                  <p className="text-muted text-[11px] leading-normal mb-3">
                    Paste your 8-word recovery code below to load history from the edge.
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. word-word-word-word-word-word-word-word"
                      value={inputCode}
                      onChange={(e) => setInputCode(e.target.value)}
                      className="flex-1 h-8 bg-[var(--bg-input)] border border-card-border px-3 rounded text-xs font-mono text-foreground placeholder-muted focus:outline-none focus:border-accent"
                    />
                    <button
                      type="submit"
                      disabled={syncStatus === 'syncing'}
                      className="h-8 px-4 text-[11px] font-mono uppercase bg-accent hover:bg-accent-hover text-white font-semibold rounded active:scale-98 transition-all cursor-pointer"
                    >
                      Import
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Sync Notifications status bar */}
            {syncStatus !== 'idle' && (
              <div className={`mt-4 p-3 rounded-lg border text-xs font-mono text-center ${
                syncStatus === 'syncing' ? 'bg-subtle border-card-border text-muted' :
                syncStatus === 'success' ? 'bg-success-bg border-success-border text-success' :
                'bg-error-bg border-error-border text-error'
              }`}>
                {syncMessage}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
