import { test, expect } from '@playwright/test';

/**
 * Test user authentication
 */
test('Test Authentication', async ({ page }) => {
  await page.goto('http://localhost:3000/register');

  // register a new user
  await page.getByLabel('name').fill("Playwright");
  await page.getByLabel('email').fill("playwright@gmail.com");
  await page.getByLabel('Password', { exact: true }).fill("password");
  await page.getByLabel('Confirm Password', { exact: true }).fill("password");

  await page.getByRole('button', { name: /Create account/i }).click();

  // login with the registerd user
  await page.waitForURL('**/login');
  await expect(page).toHaveURL('http://localhost:3000/login');
  await page.getByLabel('email').fill("playwright@gmail.com");
  await page.getByLabel('password').fill("password");
  await page.getByRole('button', { name: /sign in/i }).click();
  await expect(page.getByText('Control Center')).toBeVisible();
  
  
});
