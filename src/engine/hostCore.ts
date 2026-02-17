import { connectionStore } from '../stores/ConnectionStore';
import { gameStore } from '../stores/GameStore';
import { saveGameState } from '../utils/storage';
import type { GameState } from '../types/game';

export function genId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

export function broadcastState(state: GameState) {
  connectionStore.broadcast({ type: 'STATE_UPDATE', state });
  gameStore.setState(state);
  saveGameState(state);
}

export function getState(): GameState {
  return gameStore.state;
}

export function mutate(fn: (s: GameState) => void) {
  const state = JSON.parse(JSON.stringify(getState())) as GameState;
  fn(state);
  broadcastState(state);
}

export function hasUnresolvedDisconnects(): boolean {
  const state = getState();
  const excluded = state.excludedPlayers || [];
  return state.players.some((p) => !p.connected && !excluded.includes(p.id));
}

export function shuffle<T>(arr: T[]): void {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}
