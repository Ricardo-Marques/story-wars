import { test, expect } from '@playwright/test';
import { createPlayer, type PlayerContext } from './helpers';

test.describe('Lobby', () => {
  let host: PlayerContext;
  let client: PlayerContext;

  test.afterEach(async () => {
    await host?.context.close();
    await client?.context.close();
  });

  test('player list updates when someone joins', async ({ browser }) => {
    host = await createPlayer(browser, 'HostPlayer');
    const code = await host.createRoom();

    client = await createPlayer(browser, 'ClientPlayer');
    await client.joinRoom(code);

    // Both names should appear on both pages
    await expect(host.page.getByText('HostPlayer')).toBeVisible({ timeout: 10_000 });
    await expect(host.page.getByText('ClientPlayer')).toBeVisible({ timeout: 10_000 });
    await expect(client.page.getByText('HostPlayer')).toBeVisible({ timeout: 10_000 });
    await expect(client.page.getByText('ClientPlayer')).toBeVisible({ timeout: 10_000 });
  });

  test('start button disabled with fewer than 3 players', async ({ browser }) => {
    host = await createPlayer(browser, 'HostPlayer');
    await host.createRoom();

    // Leader sees disabled button
    const startBtn = host.page.getByRole('button', { name: /Need at least 3 players/ });
    await expect(startBtn).toBeVisible();
    await expect(startBtn).toBeDisabled();
  });

  test('non-leader sees waiting message', async ({ browser }) => {
    host = await createPlayer(browser, 'HostPlayer');
    const code = await host.createRoom();

    client = await createPlayer(browser, 'ClientPlayer');
    await client.joinRoom(code);

    await expect(client.page.getByText('Waiting for the leader to start...')).toBeVisible({ timeout: 10_000 });
  });
});
