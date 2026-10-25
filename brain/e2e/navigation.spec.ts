import { test, expect } from '@playwright/test';

test.describe('Navigation and Core Flows', () => {
  test.beforeEach(async ({ page }) => { 
    await page.addInitScript(() => window.localStorage.setItem("hasSeenOnboarding", "true")); 
  });
  test('homepage loads and has key elements', async ({ page }) => {
    await page.goto('/');
    
    // Check main heading
    await expect(page.locator('h1')).toContainText(/How Fast is Your Brain?/i);
    
    // Check main CTA
    const cta = page.locator('text=Take the Brain Challenge');
    await expect(cta).toBeVisible();
    
    // Check category links are present
    const categories = ['Reaction', 'Memory', 'Reasoning', 'Focus', 'Motor', 'Executive'];
    for (const cat of categories) {
      await expect(page.locator(`text=${cat}`).first()).toBeVisible();
    }
  });

  test('navigation to a test works', async ({ page }) => {
    await page.goto('/');

    // Click on the main CTA to go to Gauntlet
    const cta = page.locator('text=Take the Brain Challenge').first();
    await expect(cta).toBeVisible();
    
    await Promise.all([
      page.waitForURL('**/gauntlet/'),
      cta.click(),
    ]);

    // Check we landed on the correct page
    await expect(page.locator('h1')).toContainText(/The Gauntlet/i);
  });

  test('404 page', async ({ page }) => {
    const response = await page.goto('/this-page-does-not-exist');
    expect(response?.status()).toBe(404);
    await expect(page.locator('h1')).toBeVisible();
  });
});
