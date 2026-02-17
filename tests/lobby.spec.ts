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

  test('client can leave room from lobby', async ({ browser }) => {
    host = await createPlayer(browser, 'HostPlayer');
    const code = await host.createRoom();

    client = await createPlayer(browser, 'ClientPlayer');
    await client.joinRoom(code);

    // Client should see leave button
    const leaveBtn = client.page.getByRole('button', { name: 'Leave Room' });
    await expect(leaveBtn).toBeVisible({ timeout: 5_000 });
    await leaveBtn.click();

    // Client should be back at home page
    await client.waitForPhase('/', 5_000);
    await expect(client.page.getByPlaceholder('Your name')).toBeVisible({ timeout: 5_000 });
  });

  test('host ending game returns all players home', async ({ browser }) => {
    host = await createPlayer(browser, 'HostPlayer');
    const code = await host.createRoom();

    client = await createPlayer(browser, 'ClientPlayer');
    await client.joinRoom(code);

    // Host clicks Leave Room
    const leaveBtn = host.page.getByRole('button', { name: 'Leave Room' });
    await expect(leaveBtn).toBeVisible({ timeout: 5_000 });
    await leaveBtn.click();

    // Host goes home
    await host.waitForPhase('/', 5_000);

    // Client should also be sent home (GAME_ENDED broadcast)
    await client.waitForPhase('/', 10_000);
  });
});
