import React, { useEffect } from 'react';

export default function useKeyboardShortcuts() {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Don't trigger if modifier keys are pressed
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      switch (e.key.toLowerCase()) {
        case 'r':
          // Restart test - look for restart button
          const restartBtn = document.querySelector('[data-shortcut="restart"]') as HTMLButtonElement;
          if (restartBtn) {
            e.preventDefault();
            restartBtn.click();
          }
          break;

        case 'escape':
          // Exit test - look for exit button
          const exitBtn = document.querySelector('[data-shortcut="exit"]') as HTMLButtonElement;
          if (exitBtn) {
            e.preventDefault();
            exitBtn.click();
          }
          break;

        case ' ':
        case 'enter':
          // Start test - look for start button
          const startBtn = document.querySelector('[data-shortcut="start"]') as HTMLButtonElement;
          if (startBtn) {
            e.preventDefault();
            startBtn.click();
          }
          break;

        case 'h':
          // Go home
          if (e.target === document.body) {
            e.preventDefault();
            window.location.href = '/';
          }
          break;

        case '?':
          // Show keyboard shortcuts help
          const helpModal = document.getElementById('keyboard-shortcuts-help');
          if (helpModal) {
            e.preventDefault();
            helpModal.classList.toggle('hidden');
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return null;
}

export function KeyboardShortcutsHelp() {
  return (
    <div id="keyboard-shortcuts-help" className="hidden fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-card border border-card-border rounded-lg shadow-2xl max-w-md w-full p-6 relative">
        <h2 className="text-lg font-bold text-foreground mb-4">Keyboard Shortcuts</h2>
        
        <div className="space-y-3 text-sm">
          <div className="flex justify-between items-center">
            <span className="text-muted">Start test</span>
            <kbd className="px-2 py-1 bg-subtle border border-card-border rounded text-xs font-mono">Space / Enter</kbd>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted">Restart test</span>
            <kbd className="px-2 py-1 bg-subtle border border-card-border rounded text-xs font-mono">R</kbd>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted">Exit test</span>
            <kbd className="px-2 py-1 bg-subtle border border-card-border rounded text-xs font-mono">Esc</kbd>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted">Go home</span>
            <kbd className="px-2 py-1 bg-subtle border border-card-border rounded text-xs font-mono">H</kbd>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted">Show this help</span>
            <kbd className="px-2 py-1 bg-subtle border border-card-border rounded text-xs font-mono">?</kbd>
          </div>
        </div>

        <button
          onClick={() => document.getElementById('keyboard-shortcuts-help')?.classList.add('hidden')}
          className="w-full mt-6 px-4 py-2 rounded-md bg-accent text-white text-sm font-medium hover:opacity-90 transition-opacity"
        >
          Got it
        </button>
      </div>
    </div>
  );
}
