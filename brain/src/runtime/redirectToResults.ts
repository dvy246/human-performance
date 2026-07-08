/**
 * Stores test result data in sessionStorage and redirects to the dedicated results page.
 * Called by each test component after finalizeTest() completes.
 */
export interface ResultsPayload {
  testId: string;
  testName: string;
  attempts: number[];
  unit: string;
  percentile: number;
  personalBest: number | null;
  category: string;
  average: number;
}

export function redirectToResults(payload: ResultsPayload): void {
  try {
    sessionStorage.setItem('cogniarena-last-result', JSON.stringify(payload));
  } catch { /* ignore quota errors */ }
  window.location.href = '/tests/results/';
}
