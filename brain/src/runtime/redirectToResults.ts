/**
 * Stores test result data in sessionStorage and redirects to the dedicated results page.
 * Called by each test component after finalizeTest() completes.
 */
export interface ResultsPayload {
  testId: string
  testName: string
  attempts: number[]
  unit: string
  percentile: number
  personalBest: number | null
  category: string
  average: number
  difficulty?: string
}

/**
 * Stores result payload for the dedicated results page.
 * Does NOT automatically redirect — the inline result screen stays visible.
 * Users can navigate to /tests/results/ via UI buttons if they want the full breakdown.
 */
export function redirectToResults(payload: ResultsPayload): void {
  try {
    sessionStorage.setItem("cogniarena-last-result", JSON.stringify(payload))
  } catch {
    /* ignore quota errors */
  }
}

/** Navigate to the dedicated results page (call from a user-initiated action). */
export function navigateToResults(): void {
  window.location.href = "/tests/results/?hasResult=1"
}
