import { test, expect } from '@playwright/test';

test.describe('SEO and Meta Tags', () => {
  test.beforeEach(async ({ page }) => { 
    await page.addInitScript(() => window.localStorage.setItem("hasSeenOnboarding", "true")); 
  });
  const pagesToTest = [
    { url: '/', title: 'CogniArena' },
    { url: '/tests/reaction-time/', title: 'Reaction Time Test' },
    { url: '/gauntlet/', title: 'The Gauntlet' },
  ];

  for (const pageInfo of pagesToTest) {
    test(`SEO tags for ${pageInfo.url}`, async ({ page }) => {
      await page.goto(pageInfo.url);

      // Title
      await expect(page).toHaveTitle(new RegExp(pageInfo.title, 'i'));

      // Canonical URL
      const canonical = page.locator('link[rel="canonical"]');
      await expect(canonical).toHaveCount(1);
      await expect(canonical).toHaveAttribute('href', /^https:\/\/cogniarena\.com/);

      // Open Graph
      await expect(page.locator('meta[property="og:title"]')).toHaveCount(1);
      await expect(page.locator('meta[property="og:description"]')).toHaveCount(1);
      await expect(page.locator('meta[property="og:url"]')).toHaveCount(1);

      // Twitter Cards
      await expect(page.locator('meta[name="twitter:card"]')).toHaveCount(1);

      // JSON-LD Schema
      const jsonLdScripts = page.locator('script[type="application/ld+json"]');
      const count = await jsonLdScripts.count();
      expect(count).toBeGreaterThan(0);

      let foundOrganizationOrWebSite = false;
      for (let i = 0; i < count; i++) {
        const content = await jsonLdScripts.nth(i).textContent();
        if (content && (content.includes('Organization') || content.includes('WebSite'))) {
          foundOrganizationOrWebSite = true;
          break;
        }
      }
      expect(foundOrganizationOrWebSite).toBeTruthy();
    });
  }
});
