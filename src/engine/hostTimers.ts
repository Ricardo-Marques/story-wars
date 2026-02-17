import { connectionStore } from '../stores/ConnectionStore';
import { getState } from './hostCore';
import type { GameState } from '../types/game';

let voteTimer: ReturnType<typeof setTimeout> | null = null;
let voteTimerStartedAt: number | null = null;
let voteTimerDuration: number = 0; // seconds remaining for current timer
let voteTimerDelayTimeout: ReturnType<typeof setTimeout> | null = null;
let voteTimerPendingDelay = false; // true while in the pre-vote delay phase
let heartbeatInterval: ReturnType<typeof setInterval> | null = null;
let readingTimeout: ReturnType<typeof setTimeout> | null = null;

// --- Heartbeat ---

export function startHeartbeat() {
  stopHeartbeat();
  heartbeatInterval = setInterval(() => {
    connectionStore.broadcast({ type: 'PING' });
  }, 5000);
}

export function stopHeartbeat() {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }
}

// --- Reading timeout (host-side safety net) ---

export function startReadingTimeout(onExpire: () => void) {
  clearReadingTimeout();
  readingTimeout = setTimeout(() => {
    readingTimeout = null;
    const state = getState();
    if (state.phase === 'PLAYING' && state.playState.subPhase === 'READING') {
      onExpire();
    }
  }, 20000);
}

export function clearReadingTimeout() {
  if (readingTimeout) {
    clearTimeout(readingTimeout);
    readingTimeout = null;
  }
}

// --- Vote timer with pause/resume ---

export function startVoteTimer(onExpire: () => void) {
  const seconds = getState().config.voteTimerSeconds;
  voteTimerDuration = seconds;
  voteTimerStartedAt = Date.now();
  voteTimer = setTimeout(() => {
    voteTimer = null;
    voteTimerStartedAt = null;
    if (getState().playState.subPhase === 'VOTING') {
      onExpire();
    }
  }, seconds * 1000);
}

export function pauseVoteTimer() {
  // If still in the pre-vote delay, cancel it — timer hasn't started yet
  if (voteTimerDelayTimeout) {
    clearTimeout(voteTimerDelayTimeout);
    voteTimerDelayTimeout = null;
    // Keep voteTimerPendingDelay = true so resume knows to restart the delay
    voteTimerDuration = getState().config.voteTimerSeconds;
    return;
  }
  if (voteTimer && voteTimerStartedAt) {
    clearTimeout(voteTimer);
    voteTimer = null;
    const elapsed = (Date.now() - voteTimerStartedAt) / 1000;
    voteTimerDuration = Math.max(0, voteTimerDuration - elapsed);
    voteTimerStartedAt = null;
  }
}

export function resumeVoteTimer(onExpire: () => void) {
  // If paused during the pre-vote delay, restart the full timer (skip delay on resume)
  if (voteTimerPendingDelay) {
    voteTimerPendingDelay = false;
    startVoteTimer(onExpire);
    return;
  }
  if (voteTimerDuration > 0 && !voteTimer) {
    voteTimerStartedAt = Date.now();
    voteTimer = setTimeout(() => {
      voteTimer = null;
      voteTimerStartedAt = null;
      if (getState().playState.subPhase === 'VOTING') {
        onExpire();
      }
    }, voteTimerDuration * 1000);
  }
}

export function clearVoteTimer() {
  if (voteTimerDelayTimeout) {
    clearTimeout(voteTimerDelayTimeout);
    voteTimerDelayTimeout = null;
  }
  voteTimerPendingDelay = false;
  if (voteTimer) {
    clearTimeout(voteTimer);
    voteTimer = null;
  }
  voteTimerStartedAt = null;
  voteTimerDuration = 0;
  clearReadingTimeout();
}

export function setVoteTimerPendingDelay(delay: boolean) {
  voteTimerPendingDelay = delay;
}

export function setVoteTimerDelayTimeout(timeout: ReturnType<typeof setTimeout> | null) {
  voteTimerDelayTimeout = timeout;
}

// Compute current vote timer remaining and inject into a state clone (for WELCOME)
export function getStateWithTimerSync(): GameState {
  const state = JSON.parse(JSON.stringify(getState())) as GameState;
  if (state.phase === 'PLAYING' && state.playState.subPhase === 'VOTING') {
    if (voteTimerStartedAt) {
      const elapsed = (Date.now() - voteTimerStartedAt) / 1000;
      state.playState.voteTimerSecondsLeft = Math.max(1, Math.round(voteTimerDuration - elapsed));
    } else if (voteTimerDuration > 0) {
      state.playState.voteTimerSecondsLeft = Math.round(voteTimerDuration);
    }
  }
  return state;
}
