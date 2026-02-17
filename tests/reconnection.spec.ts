import { test, expect } from '@playwright/test';
import { createPlayer, type PlayerContext } from './helpers';

test.describe('Reconnection', () => {
  let host: PlayerContext;
  let player2: PlayerContext;
  let player3: PlayerContext;

  test.afterEach(async () => {
    await host?.context.close();
    await player2?.context.close();
    await player3?.context.close();
  });

  /** Helper to get all 3 players into the writing phase */
  async function setupToWriting(browser: import('@playwright/test').Browser) {
    host = await createPlayer(browser, 'Alice');
    const code = await host.createRoom();

    player2 = await createPlayer(browser, 'Bob');
    await player2.joinRoom(code);

    player3 = await createPlayer(browser, 'Charlie');
    await player3.joinViaLink(code);

    // Wait for all 3 to be in lobby
    await expect(host.page.getByText('3 players in room')).toBeVisible({ timeout: 10_000 });

    // Advance to setup
    await host.page.getByRole('button', { name: 'Next: Pick Topics' }).click();
    await host.waitForPhase('/setup');

    // Pick a topic and start writing
    await host.page.locator('button').filter({ hasText: /A time you got completely lost/ }).click();
    await host.page.getByRole('button', { name: 'Start Writing!' }).click();

    // Wait for all 3 to reach writing
    for (const player of [host, player2, player3]) {
      await player.waitForPhase('/writing', 15_000);
    }

    return code;
  }

  test('host can refresh and resume game', async ({ browser }) => {
    await setupToWriting(browser);

    // Host refreshes the page
    await host.page.reload();
    await host.page.waitForLoadState('networkidle');

    // Should see the "Rejoin Game" button (session was saved)
    const rejoinBtn = host.page.getByRole('button', { name: 'Rejoin Game' });
    await expect(rejoinBtn).toBeVisible({ timeout: 10_000 });
    await rejoinBtn.click();

    // Host should return to the writing phase
    await host.waitForPhase('/writing', 15_000);

    // Writing page content should still be present
    await expect(host.page.getByPlaceholder('Write your story...')).toBeVisible({ timeout: 10_000 });
  });

  test('client can refresh and rejoin', async ({ browser }) => {
    await setupToWriting(browser);

    // Client refreshes the page
    await player2.page.reload();
    await player2.page.waitForLoadState('networkidle');

    // Should see the "Rejoin Game" button
    const rejoinBtn = player2.page.getByRole('button', { name: 'Rejoin Game' });
    await expect(rejoinBtn).toBeVisible({ timeout: 10_000 });
    await rejoinBtn.click();

    // Client should return to the writing phase
    await player2.waitForPhase('/writing', 15_000);

    // Writing page content should be present
    await expect(player2.page.getByPlaceholder('Write your story...')).toBeVisible({ timeout: 10_000 });
  });
});
