import { type Browser, type BrowserContext, type Page } from '@playwright/test';

const BASE_URL = 'http://localhost:5173/story-wars/';

/**
 * Wraps a Playwright BrowserContext + Page representing one player.
 */
export class PlayerContext {
  constructor(
    public context: BrowserContext,
    public page: Page,
    public name: string,
  ) {}

  /** Wait for the URL hash to contain a fragment like /lobby, /setup, /writing, /play, /results */
  async waitForPhase(urlFragment: string, timeout = 30_000) {
    await this.page.waitForURL(`**/#${urlFragment}`, { timeout });
  }

  /** Create a new room — clicks "Create Room" and waits for lobby */
  async createRoom(): Promise<string> {
    await this.page.getByRole('button', { name: 'Create Room' }).click();
    await this.waitForPhase('/lobby');
    // Extract room code from the styled <span> with letter-spacing
    const codeEl = this.page.locator('span').filter({ hasText: /^[A-Z0-9]{6}$/ });
    const code = await codeEl.textContent({ timeout: 10_000 });
    if (!code) throw new Error('Could not extract room code');
    return code;
  }

  /** Join an existing room via code input */
  async joinRoom(code: string) {
    await this.page.getByPlaceholder('Room Code').fill(code);
    await this.page.getByRole('button', { name: 'Join' }).click();
    await this.waitForPhase('/lobby');
  }

  /** Join via invite link (navigates to #/join/{CODE}) */
  async joinViaLink(code: string) {
    await this.page.goto(`${BASE_URL}#/join/${code}`);
    await this.page.getByPlaceholder('Your name').fill(this.name);
    await this.page.getByRole('button', { name: 'Join Game' }).click();
    await this.waitForPhase('/lobby');
  }
}

/**
 * Create a PlayerContext: fresh browser context, navigate to app, disable TTS, enter name.
 */
export async function createPlayer(
  browser: Browser,
  name: string,
  opts?: { skipName?: boolean },
): Promise<PlayerContext> {
  const context = await browser.newContext();
  const page = await context.newPage();

  // Disable TTS via localStorage before navigating
  await context.addInitScript(() => {
    localStorage.setItem('storywars-tts-enabled', 'false');
  });

  await page.goto(BASE_URL);
  await page.waitForLoadState('networkidle');

  if (!opts?.skipName) {
    // Clear the name input (may have a saved name) and type the new one
    const nameInput = page.getByPlaceholder('Your name');
    await nameInput.clear();
    await nameInput.fill(name);
  }

  return new PlayerContext(context, page, name);
}
