import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:5173/story-wars/';

test.describe('Home page', () => {
  test.beforeEach(async ({ page, context }) => {
    await context.addInitScript(() => {
      localStorage.setItem('storywars-tts-enabled', 'false');
    });
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
  });

  test('shows create and join options', async ({ page }) => {
    await expect(page.getByPlaceholder('Your name')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Create Room' })).toBeVisible();
    await expect(page.getByPlaceholder('Room Code')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Join' })).toBeVisible();
    // Avatar picker should be present
    await expect(page.locator('img[alt]').first()).toBeVisible();
  });

  test('rules modal opens and closes', async ({ page }) => {
    await page.getByText('How to Play').click();
    await expect(page.getByText('Create & Join')).toBeVisible();
    // Navigate to last step (Score & Win) to check scoring info and "Got it!" button
    for (let i = 0; i < 4; i++) {
      await page.getByRole('button', { name: 'Next' }).click();
    }
    await expect(page.getByText('Score & Win')).toBeVisible();
    await expect(page.getByText('Correct guess')).toBeVisible();
    await page.getByRole('button', { name: 'Got it!' }).click();
    await expect(page.getByText('Score & Win')).not.toBeVisible();
  });

  test('create room requires a name', async ({ page }) => {
    const nameInput = page.getByPlaceholder('Your name');
    await nameInput.clear();
    await expect(page.getByRole('button', { name: 'Create Room' })).toBeDisabled();
  });

  test('join via link shows simplified view', async ({ page }) => {
    await page.goto(`${BASE_URL}#/join/ABCDEF`);
    await expect(page.getByText("You've been invited!")).toBeVisible();
    await expect(page.getByRole('button', { name: 'Join Game' })).toBeVisible();
    // "Create Room" should not be visible in invite view
    await expect(page.getByRole('button', { name: 'Create Room' })).not.toBeVisible();
  });
});
