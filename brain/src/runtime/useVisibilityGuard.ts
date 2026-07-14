import { useEffect, useRef } from "react"

/**
 * Hook to guard against tab switching, minimization, or loss of focus during tests.
 * Triggers a callback (e.g., to pause or invalidate) when visibility changes or blur occurs.
 * Memoizes the callback using a ref to prevent event listeners from re-registering on every update.
 */
export function useVisibilityGuard(
  onVisibilityLoss: () => void,
  active: boolean
) {
  const cbRef = useRef(onVisibilityLoss)

  useEffect(() => {
    cbRef.current = onVisibilityLoss
  }, [onVisibilityLoss])

  useEffect(() => {
    if (!active) return

    const handleVisibilityChange = () => {
      if (document.hidden) {
        cbRef.current()
      }
    }

    const handleBlur = () => {
      cbRef.current()
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)
    window.addEventListener("blur", handleBlur)

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      window.removeEventListener("blur", handleBlur)
    }
  }, [active])
}
