import { test, expect } from '@playwright/test';

test.describe('Cognitive Tests Interactions', () => {
  test.beforeEach(async ({ page }) => { 
    await page.addInitScript(() => window.localStorage.setItem("hasSeenOnboarding", "true")); 
  });
  
  test('Reaction Time Test flow - early abort', async ({ page }) => {
    await page.goto('/tests/reaction-time/');
    
    // Test configuration panel is visible
    await expect(page.locator('text=Reaction Time Test').first()).toBeVisible();
    
    // Find and click start button
    const startBtn = page.getByRole('button', { name: 'Start Test', exact: true });
    await expect(startBtn).toBeVisible();
    await startBtn.click({ force: true });
    
    // Verify we enter waiting state
    const gameArea = page.locator('div[role="button"][aria-live="polite"]');
    await expect(gameArea.locator('text=WAITING')).toBeVisible();
    
    // Click while waiting to trigger abort
    await gameArea.click({ force: true });
    
    // Should show abort/too early state
    await expect(page.locator('text=⚠️')).toBeVisible();
  });

  test('Gauntlet flow intro', async ({ page }) => {
    await page.goto('/gauntlet/');
    
    // Check main title
    await expect(page.locator('h1')).toContainText(/The Gauntlet/i);
    
    // Start the gauntlet
    const startGauntletBtn = page.getByRole('button', { name: 'Begin the Gauntlet', exact: true });
    if (await startGauntletBtn.isVisible()) {
      await startGauntletBtn.click({ force: true });
      
      // Should show the first stage (Reaction)
      await expect(page.locator('text=Stage 1/5')).toBeVisible();
    }
  });
});
