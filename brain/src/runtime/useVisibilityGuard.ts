import { useEffect } from 'react';

/**
 * Hook to guard against tab switching, minimization, or loss of focus during tests.
 * Triggers a callback (e.g., to pause or invalidate) when visibility changes or blur occurs.
 */
export function useVisibilityGuard(onVisibilityLoss: () => void, active: boolean) {
  useEffect(() => {
    if (!active) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        onVisibilityLoss();
      }
    };

    const handleBlur = () => {
      onVisibilityLoss();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
    };
  }, [onVisibilityLoss, active]);
}
