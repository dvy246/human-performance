import { test, expect } from '@playwright/test';

test.describe('Dashboard Interactions', () => {
  test.beforeEach(async ({ page }) => { 
    await page.addInitScript(() => window.localStorage.setItem("hasSeenOnboarding", "true")); 
  });
  test('Dashboard loads correctly', async ({ page }) => {
    await page.goto('/dashboard/');
    
    // Check main title
    await expect(page.locator('h1')).toContainText(/Dashboard/i);
    
    // Verify the CognitiveProfile component loaded
    await expect(page.getByRole('heading', { name: /Skill Radar/i }).first()).toBeVisible();
    
    // Verify empty state text
    await expect(page.locator('text=Complete at least one assessment')).toBeVisible();
  });
});
