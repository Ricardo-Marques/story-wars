import { test, expect } from '@playwright/test';
import { createPlayer, type PlayerContext } from './helpers';

test.describe('Full game flow', () => {
  let host: PlayerContext;
  let player2: PlayerContext;
  let player3: PlayerContext;

  test.afterEach(async () => {
    await host?.context.close();
    await player2?.context.close();
    await player3?.context.close();
  });

  test('3 players complete a full game', async ({ browser }) => {
    // ──── Room creation ────
    host = await createPlayer(browser, 'Alice');
    const code = await host.createRoom();
    expect(code).toMatch(/^[A-Z0-9]{6}$/);

    // ──── Joining ────
    player2 = await createPlayer(browser, 'Bob');
    await player2.joinRoom(code);

    player3 = await createPlayer(browser, 'Charlie');
    await player3.joinViaLink(code);

    // ──── Lobby assertions ────
    for (const name of ['Alice', 'Bob', 'Charlie']) {
      await expect(host.page.getByText(name)).toBeVisible({ timeout: 10_000 });
    }
    await expect(host.page.getByText('Leader')).toBeVisible();
    await expect(host.page.getByText('3 players in room')).toBeVisible();

    // ──── Setup: leader picks 1 topic ────
    await host.page.getByRole('button', { name: 'Next: Pick Topics' }).click();
    await host.waitForPhase('/setup');

    await expect(player2.page.getByText('Leader is picking topics...')).toBeVisible({ timeout: 15_000 });

    // Click first topic
    await host.page.locator('button').filter({ hasText: /A time you got completely lost/ }).click();

    // Start writing
    await host.page.getByRole('button', { name: 'Start Writing!' }).click();

    // ──── Writing: all 3 players write and submit ────
    const players = [host, player2, player3];
    const stories = [
      'Alice tells a story about getting lost in a corn maze during Halloween.',
      'Bob once wandered into the wrong neighborhood looking for tacos.',
      'Charlie got lost in IKEA for three hours and ended up buying a bookshelf.',
    ];

    for (let i = 0; i < 3; i++) {
      const player = players[i];
      await player.waitForPhase('/writing', 15_000);

      // Wait for textarea to be ready
      const textarea = player.page.locator('textarea');
      await expect(textarea).toBeVisible({ timeout: 10_000 });
      await textarea.fill(stories[i]);

      // Wait for submit button to be enabled, then click
      const submitBtn = player.page.locator('button', { hasText: /Submit/ });
      await expect(submitBtn).toBeEnabled({ timeout: 5_000 });
      await submitBtn.click();

      // After submitting, player should see "All stories submitted!" (their own stories done)
      // For the last player, the game may auto-start immediately, so also accept /play
      if (i < 2) {
        await expect(player.page.getByText('All stories submitted!')).toBeVisible({ timeout: 10_000 });
      }
    }

    // Game auto-starts when all are done — everyone transitions to /play
    for (const player of players) {
      await player.waitForPhase('/play', 15_000);
    }

    // ──── Play through all 3 stories (1 topic, storiesPerPrompt=3 by default → all 3 stories) ────
    // With storiesPerPrompt = slider min=1, but default is 1, we get min(1, 3)=1? No...
    // Actually storiesPerPrompt defaults to config.storiesPerPrompt which starts at some value.
    // With 3 players and 1 topic, there are 3 stories total. storiesPerPrompt limits how many play.
    // The slider defaults to config.storiesPerPrompt (initial value). Let me handle N stories.

    // We need to cycle through READING → VOTING → REVEAL for each story shown
    let reachedResults = false;

    for (let storyNum = 0; storyNum < 3 && !reachedResults; storyNum++) {
      // ──── READING subphase ────
      // Wait for either reading indicators or voting (in case reading is very fast)
      const readingIndicator = host.page.getByText('Listen carefully...');
      const voteReady = host.page.getByText('Get ready to vote...');
      const votingLabel = host.page.getByText('Who wrote this?');

      await expect(
        readingIndicator.or(voteReady).or(votingLabel)
      ).toBeVisible({ timeout: 30_000 });

      // If still in READING, wait for typewriter to finish
      if (await readingIndicator.isVisible().catch(() => false)) {
        await expect(voteReady.or(votingLabel)).toBeVisible({ timeout: 30_000 });
      }

      // ──── VOTING subphase ────
      await expect(votingLabel).toBeVisible({ timeout: 15_000 });

      // All players vote — pick first name that isn't themselves
      for (const player of players) {
        await expect(player.page.getByText('Who wrote this?')).toBeVisible({ timeout: 15_000 });

        // Vote buttons contain player names. Find one that isn't the current player.
        const voteButtons = player.page.locator('button').filter({ hasText: /(Alice|Bob|Charlie)/ });
        const count = await voteButtons.count();
        let voted = false;
        for (let j = 0; j < count; j++) {
          const btnText = await voteButtons.nth(j).textContent();
          if (btnText && !btnText.includes(player.name)) {
            await voteButtons.nth(j).click();
            voted = true;
            break;
          }
        }

        // Lock in the vote
        if (voted) {
          const lockBtn = player.page.getByRole('button', { name: 'Lock In' });
          await expect(lockBtn).toBeVisible({ timeout: 5_000 });
          await lockBtn.click();
          // When the last player locks in, all votes finalize and the phase
          // transitions to REVEAL immediately — "Vote locked in!" may not appear.
          // So we just wait briefly and move on.
          await player.page.waitForTimeout(500);
        }
      }

      // ──── REVEAL subphase ────
      await expect(host.page.getByText(/Written by (Alice|Bob|Charlie)/)).toBeVisible({ timeout: 15_000 });

      // Leader clicks "Next" to advance
      const nextBtn = host.page.getByRole('button', { name: 'Next' });
      await expect(nextBtn).toBeVisible({ timeout: 5_000 });
      await nextBtn.click();

      // Check if we reached results
      try {
        await host.waitForPhase('/results', 3_000);
        reachedResults = true;
      } catch {
        // Still more stories to play
      }
    }

    // ──── Results page ────
    if (!reachedResults) {
      await host.waitForPhase('/results', 15_000);
    }
    for (const player of [player2, player3]) {
      await player.waitForPhase('/results', 15_000);
    }

    // Headline: "{Name} wins!" or "It's a tie!"
    await expect(host.page.getByText(/wins!|tie!/)).toBeVisible({ timeout: 10_000 });

    // Scoreboard with pts
    await expect(host.page.getByText(/\d+ pts/).first()).toBeVisible();

    // "Exit Game" button visible
    await expect(host.page.getByRole('button', { name: 'Exit Game' })).toBeVisible();
  });
});
