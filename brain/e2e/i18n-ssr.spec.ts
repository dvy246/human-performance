import { test, expect } from '@playwright/test';

test('localized pages should SSR translated content and metadata', async ({ page }) => {
  // Disable javascript to ensure we are testing Server-Side Rendered (SSR) HTML
  // because Googlebot primarily indexes the SSR HTML first, and we want to avoid duplicate content.
  await page.route('**/*.js', route => route.abort());

  await page.goto('/es/quiz/iq-test/');
  
  // The description meta tag should be translated, not English
  const metaDescription = await page.locator('meta[name="description"]').getAttribute('content');
  expect(metaDescription).not.toContain('Take a free online logic benchmark');
  expect(metaDescription).toBeTruthy();

  // The schema should be translated or not contain the English description
  const schemaScript = await page.locator('script[type="application/ld+json"]').first().textContent();
  expect(schemaScript).not.toContain('Take a free online logic benchmark');

  // The main UI should be translated
  // Check the title
  const h1Text = await page.locator('h1').textContent();
  expect(h1Text?.trim()).not.toBe('Free Logic Benchmark');

  // Check the React component content (it shouldn't be English on the server!)
  // The english string was "Free Cognitive Reasoning Quiz"
  const bodyText = await page.locator('body').textContent();
  expect(bodyText).not.toContain('Free Cognitive Reasoning Quiz');
  expect(bodyText).not.toContain('20 questions across');
});
