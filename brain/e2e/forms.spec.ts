import { test, expect } from '@playwright/test';

test.describe('Forms Interactions', () => {
  test.beforeEach(async ({ page }) => { 
    await page.addInitScript(() => window.localStorage.setItem("hasSeenOnboarding", "true")); 
  });
  test('Contact form structure', async ({ page }) => {
    await page.goto('/contact/');
    
    // Check main title
    await expect(page.locator('h1')).toContainText(/Contact Platform Support/i);
    
    // Check form fields
    const subjectSelect = page.locator('select#contact-subject');
    await expect(subjectSelect).toBeVisible();
    
    const messageInput = page.locator('textarea#contact-message');
    await expect(messageInput).toBeVisible();
    
    // Fill the form
    await subjectSelect.selectOption('Integration Request');
    await messageInput.fill('This is a test message for E2E.');
    
    // Verify the submit button
    const submitBtn = page.locator('button[type="submit"]');
    await expect(submitBtn).toBeVisible();
    
    // Check required attribute
    const isRequired = await messageInput.getAttribute('required');
    expect(isRequired).not.toBeNull();
  });
});
