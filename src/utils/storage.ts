import type { GameState } from '../types/game';

const STATE_KEY = 'storywars-state';
const NAME_KEY = 'storywars-name';
const AVATAR_KEY = 'storywars-avatar';
const SESSION_KEY = 'storywars-session';

export interface SessionInfo {
  roomCode: string;
  playerId: string;
  isHost: boolean;
}

export function saveGameState(state: GameState): void {
  try {
    localStorage.setItem(STATE_KEY, JSON.stringify(state));
  } catch {
    // localStorage full or unavailable
  }
}

export function loadGameState(): GameState | null {
  try {
    const raw = localStorage.getItem(STATE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearGameState(): void {
  localStorage.removeItem(STATE_KEY);
  localStorage.removeItem(SESSION_KEY);
}

export function saveSession(info: SessionInfo): void {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(info));
  } catch {}
}

export function loadSession(): SessionInfo | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function savePlayerName(name: string): void {
  localStorage.setItem(NAME_KEY, name);
}

export function loadPlayerName(): string {
  return localStorage.getItem(NAME_KEY) ?? '';
}

export function saveAvatarSeed(seed: string): void {
  localStorage.setItem(AVATAR_KEY, seed);
}

export function loadAvatarSeed(): string {
  return localStorage.getItem(AVATAR_KEY) ?? '';
}
