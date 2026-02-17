import { connectionStore } from '../stores/ConnectionStore';
import { gameStore } from '../stores/GameStore';
import { createInitialState, INITIAL_PLAY_STATE } from '../types/game';
import type { GameState, Player, Story } from '../types/game';
import type { ClientMessage } from '../types/protocol';
import { saveSession, clearGameState } from '../utils/storage';
import { genId, getState, mutate, hasUnresolvedDisconnects, shuffle } from './hostCore';
import {
  startHeartbeat,
  stopHeartbeat,
  startReadingTimeout,
  clearReadingTimeout,
  startVoteTimer,
  pauseVoteTimer,
  resumeVoteTimer,
  clearVoteTimer,
  setVoteTimerPendingDelay,
  setVoteTimerDelayTimeout,
  getStateWithTimerSync,
} from './hostTimers';

// --- Init ---

export function initHost(roomCode: string) {
  const state = createInitialState(roomCode);
  gameStore.setState(state);
  gameStore.setIsHost(true);

  connectionStore.onClientMessage = handleClientMessage;
  connectionStore.onClientDisconnect = handleDisconnect;
  startHeartbeat();
}

export function resumeHost(state: GameState, hostPlayerId: string) {
  // Mark all non-host players as disconnected since PeerJS connections were lost
  for (const p of state.players) {
    p.connected = p.id === hostPlayerId;
  }
  // Ensure excludedPlayers exists (backward compat with old saved states)
  if (!state.excludedPlayers) state.excludedPlayers = [];
  gameStore.setState(state);
  gameStore.setIsHost(true);
  gameStore.setMyPlayerId(hostPlayerId);
  connectionStore.onClientMessage = handleClientMessage;
  connectionStore.onClientDisconnect = handleDisconnect;
  startHeartbeat();
}

// --- Message routing ---

function handleClientMessage(playerId: string, msg: ClientMessage) {
  switch (msg.type) {
    case 'JOIN':
      handleJoin(playerId, msg.name, msg.avatarSeed);
      break;
    case 'REJOIN':
      handleRejoin(playerId, msg.playerId);
      break;
    case 'SET_CONFIG':
      handleSetConfig(playerId, msg.topicIds, msg.storiesPerPrompt, msg.voteTimerSeconds);
      break;
    case 'START_WRITING':
      handleStartWriting(playerId);
      break;
    case 'SUBMIT_STORY':
      handleSubmitStory(playerId, msg.topicId, msg.text);
      break;
    case 'DONE_WRITING':
      handleDoneWriting(playerId);
      break;
    case 'START_GAME':
      handleStartGame(playerId);
      break;
    case 'CAST_VOTE':
      handleCastVote(playerId, msg.targetPlayerId);
      break;
    case 'FINALIZE_VOTE':
      handleFinalizeVote(playerId);
      break;
    case 'NEXT':
      handleNext(playerId);
      break;
    case 'CONTINUE_WITHOUT':
      handleContinueWithout(playerId, msg.targetPlayerId);
      break;
    case 'LEAVE':
      handleLeave(playerId);
      break;
  }
}

// --- Join / Rejoin ---

function handleJoin(playerId: string, name: string, avatarSeed: string) {
  const state = getState();
  if (state.phase !== 'LOBBY') {
    connectionStore.sendToClient(playerId, {
      type: 'ERROR',
      message: 'Game already in progress',
    });
    return;
  }

  if (state.players.some((p) => p.id === playerId)) return;

  const isLeader = state.players.length === 0;
  const player: Player = {
    id: playerId,
    name,
    avatarSeed,
    score: 0,
    isLeader,
    connected: true,
  };

  mutate((s) => {
    s.players.push(player);
  });

  connectionStore.sendToClient(playerId, {
    type: 'WELCOME',
    playerId,
    state: getState(),
  });

  connectionStore.broadcast({ type: 'PLAYER_JOINED', player });
}

function handleRejoin(connectionId: string, originalPlayerId: string) {
  const state = getState();
  const player = state.players.find((p) => p.id === originalPlayerId);
  if (!player) {
    connectionStore.sendToClient(connectionId, {
      type: 'ERROR',
      message: 'Player not found in this game',
    });
    return;
  }

  // Remap the connection to the original player ID
  const conn = connectionStore.clientConnections.get(connectionId);
  if (conn) {
    connectionStore.clientConnections.delete(connectionId);
    connectionStore.connToPlayer.delete(conn);
    connectionStore.clientConnections.set(originalPlayerId, conn);
    connectionStore.connToPlayer.set(conn, originalPlayerId);
  }

  mutate((s) => {
    const p = s.players.find((pl) => pl.id === originalPlayerId);
    if (p) p.connected = true;
    // Remove from excluded if they were excluded
    s.excludedPlayers = (s.excludedPlayers || []).filter((id) => id !== originalPlayerId);
  });

  connectionStore.sendToClient(originalPlayerId, {
    type: 'WELCOME',
    playerId: originalPlayerId,
    state: getStateWithTimerSync(),
  });

  // Player reconnected — check if all disconnects are now resolved
  checkAfterReconnect();
}

// --- Config ---

function handleSetConfig(
  playerId: string,
  topicIds: string[],
  storiesPerPrompt: number,
  voteTimerSeconds: number,
) {
  const state = getState();
  const player = state.players.find((p) => p.id === playerId);
  if (!player?.isLeader) return;

  mutate((s) => {
    s.config.topicIds = topicIds;
    s.config.storiesPerPrompt = storiesPerPrompt;
    s.config.voteTimerSeconds = voteTimerSeconds;
  });
}

// --- Writing phase ---

function handleStartWriting(playerId: string) {
  const state = getState();
  const player = state.players.find((p) => p.id === playerId);
  if (!player?.isLeader) return;
  if (state.phase !== 'SETUP') return;
  if (state.config.topicIds.length === 0) return;

  mutate((s) => {
    s.phase = 'WRITING';
    s.writingDone = [];
    s.stories = [];
    s.excludedPlayers = [];
  });
}

function handleSubmitStory(playerId: string, topicId: string, text: string) {
  if (getState().phase !== 'WRITING') return;
  if (!text.trim()) return;

  const story: Story = {
    id: genId(),
    topicId,
    authorId: playerId,
    text: text.trim(),
  };

  mutate((s) => {
    const idx = s.stories.findIndex(
      (st) => st.authorId === playerId && st.topicId === topicId,
    );
    if (idx >= 0) {
      s.stories[idx] = story;
    } else {
      s.stories.push(story);
    }
  });
}

function handleDoneWriting(playerId: string) {
  if (getState().phase !== 'WRITING') return;

  mutate((s) => {
    if (!s.writingDone.includes(playerId)) {
      s.writingDone.push(playerId);
    }
  });

  // Auto-start game when all players are done (and no unresolved disconnects)
  checkAutoStartGame();
}

function checkAutoStartGame() {
  const state = getState();
  if (state.phase !== 'WRITING') return;
  // Don't auto-start if there are unresolved disconnects — wait for leader to decide
  if (hasUnresolvedDisconnects()) return;
  const connectedPlayers = state.players.filter((p) => p.connected);
  if (connectedPlayers.length > 0 && state.writingDone.length >= connectedPlayers.length) {
    startGame();
  }
}

function startGame() {
  mutate((s) => {
    s.phase = 'PLAYING';
    s.playState = {
      ...INITIAL_PLAY_STATE,
      subPhase: 'READING',
    };
    // For each topic, shuffle stories and keep only storiesPerPrompt
    const limit = s.config.storiesPerPrompt;
    const kept: Story[] = [];
    for (const topicId of s.config.topicIds) {
      const topicStories = s.stories.filter((st) => st.topicId === topicId);
      shuffle(topicStories);
      kept.push(...topicStories.slice(0, limit));
    }
    s.stories = kept;
  });
  startReadingTimeout(readingExpired);
}

function handleStartGame(playerId: string) {
  const state = getState();
  const player = state.players.find((p) => p.id === playerId);
  if (!player?.isLeader) return;
  if (state.phase !== 'WRITING') return;
  startGame();
}

// --- Voting ---

function handleCastVote(playerId: string, targetPlayerId: string) {
  const state = getState();
  if (state.phase !== 'PLAYING' || state.playState.subPhase !== 'VOTING') return;

  const story = gameStore.currentStory;
  if (!story) return;

  // Don't allow voting after finalizing
  if (state.playState.finalizedVoters.includes(playerId)) return;

  mutate((s) => {
    // Remove any existing vote by this player for this story (allows changing)
    s.playState.votes = s.playState.votes.filter(
      (v) => !(v.storyId === story.id && v.voterId === playerId),
    );
    // Add the new vote
    s.playState.votes.push({
      voterId: playerId,
      storyId: story.id,
      targetPlayerId,
    });
  });
}

function handleFinalizeVote(playerId: string) {
  const state = getState();
  if (state.phase !== 'PLAYING' || state.playState.subPhase !== 'VOTING') return;

  const story = gameStore.currentStory;
  if (!story) return;

  // Must have voted first
  const hasVoted = state.playState.votes.some(
    (v) => v.storyId === story.id && v.voterId === playerId,
  );
  if (!hasVoted) return;

  if (state.playState.finalizedVoters.includes(playerId)) return;

  mutate((s) => {
    s.playState.finalizedVoters.push(playerId);
  });

  // Check if all connected players finalized
  checkAllFinalized();
}

function checkAllFinalized() {
  const state = getState();
  // Don't auto-reveal if there are unresolved disconnects
  if (hasUnresolvedDisconnects()) return;
  const connectedPlayers = state.players.filter((p) => p.connected);
  if (
    connectedPlayers.length > 0 &&
    state.playState.finalizedVoters.length >= connectedPlayers.length
  ) {
    clearVoteTimer();
    revealAndScore();
  }
}

// --- Callbacks for timer expiry ---

function readingExpired() {
  // Auto-advance to VOTING — same as handleNext when subPhase is READING
  mutate((s) => {
    s.playState.subPhase = 'VOTING';
    s.playState.finalizedVoters = [];
    s.playState.voteTimerSecondsLeft = s.config.voteTimerSeconds;
  });
  startVoteTimerWithDelay();
}

function startVoteTimerWithDelay() {
  setVoteTimerPendingDelay(true);
  setVoteTimerDelayTimeout(setTimeout(() => {
    setVoteTimerDelayTimeout(null);
    setVoteTimerPendingDelay(false);
    startVoteTimer(() => revealAndScore());
  }, 2000));
}

// --- Next / Reveal / Advance ---

function handleNext(playerId: string) {
  const state = getState();
  const player = state.players.find((p) => p.id === playerId);
  if (!player?.isLeader) return;
  if (state.phase !== 'PLAYING') return;

  clearVoteTimer();

  const { subPhase } = state.playState;

  if (subPhase === 'READING') {
    clearReadingTimeout();
    mutate((s) => {
      s.playState.subPhase = 'VOTING';
      s.playState.finalizedVoters = [];
      s.playState.voteTimerSecondsLeft = s.config.voteTimerSeconds;
    });
    // Delay timer start by 2s to give players time to see the full story
    startVoteTimerWithDelay();
  } else if (subPhase === 'VOTING') {
    revealAndScore();
  } else if (subPhase === 'REVEAL') {
    advanceToNextStory();
  }
}

function revealAndScore() {
  const state = getState();
  const topicId = state.config.topicIds[state.playState.currentTopicIndex];
  const topicStories = state.stories.filter((s) => s.topicId === topicId);
  const story = topicStories[state.playState.currentStoryIndex];
  if (!story) return;

  const storyVotes = state.playState.votes.filter((v) => v.storyId === story.id);

  mutate((s) => {
    let anyoneGuessedRight = false;
    for (const vote of storyVotes) {
      // Skip author's own vote for scoring purposes
      if (vote.voterId === story.authorId) continue;

      if (vote.targetPlayerId === story.authorId) {
        anyoneGuessedRight = true;
        const guesser = s.players.find((p) => p.id === vote.voterId);
        if (guesser) guesser.score += 2;
      }
    }

    if (!anyoneGuessedRight) {
      const author = s.players.find((p) => p.id === story.authorId);
      if (author) author.score += 3;
    }

    s.playState.subPhase = 'REVEAL';
    s.playState.revealedAuthorId = story.authorId;
  });
}

function advanceToNextStory() {
  const state = getState();
  const topicId = state.config.topicIds[state.playState.currentTopicIndex];
  const topicStories = state.stories.filter((s) => s.topicId === topicId);
  const nextStoryIndex = state.playState.currentStoryIndex + 1;

  if (nextStoryIndex < topicStories.length) {
    mutate((s) => {
      s.playState.currentStoryIndex = nextStoryIndex;
      s.playState.subPhase = 'READING';
      s.playState.revealedAuthorId = null;
      s.playState.finalizedVoters = [];
    });
    startReadingTimeout(readingExpired);
  } else {
    const nextTopicIndex = state.playState.currentTopicIndex + 1;
    if (nextTopicIndex < state.config.topicIds.length) {
      mutate((s) => {
        s.playState.currentTopicIndex = nextTopicIndex;
        s.playState.currentStoryIndex = 0;
        s.playState.subPhase = 'READING';
        s.playState.revealedAuthorId = null;
        s.playState.finalizedVoters = [];
      });
      startReadingTimeout(readingExpired);
    } else {
      mutate((s) => {
        s.phase = 'RESULTS';
      });
      clearGameState();
    }
  }
}

// --- Continue Without (leader dismisses a disconnected player) ---

function handleContinueWithout(playerId: string, targetPlayerId: string) {
  const state = getState();
  const player = state.players.find((p) => p.id === playerId);
  if (!player?.isLeader) return;

  mutate((s) => {
    if (!s.excludedPlayers) s.excludedPlayers = [];
    if (!s.excludedPlayers.includes(targetPlayerId)) {
      s.excludedPlayers.push(targetPlayerId);
    }
  });

  // Check if all disconnects are now resolved and we can proceed
  if (!hasUnresolvedDisconnects()) {
    const state = getState();
    if (state.phase === 'WRITING') {
      checkAutoStartGame();
    }
    if (state.phase === 'PLAYING' && state.playState.subPhase === 'VOTING') {
      resumeVoteTimer(() => revealAndScore());
      checkAllFinalized();
    }
  }
}

// --- Leave (voluntary) ---

function handleLeave(playerId: string) {
  const state = getState();
  const player = state.players.find((p) => p.id === playerId);
  if (!player) return;

  // Mark them disconnected + excluded so the game can proceed
  mutate((s) => {
    const p = s.players.find((pl) => pl.id === playerId);
    if (p) p.connected = false;
    if (!s.excludedPlayers) s.excludedPlayers = [];
    if (!s.excludedPlayers.includes(playerId)) {
      s.excludedPlayers.push(playerId);
    }

    // If the leader left, promote the next connected player
    if (p?.isLeader) {
      p.isLeader = false;
      const next = s.players.find((pl) => pl.connected && pl.id !== playerId);
      if (next) next.isLeader = true;
    }
  });

  connectionStore.broadcast({ type: 'PLAYER_LEFT', playerId });

  // Close their connection
  const conn = connectionStore.clientConnections.get(playerId);
  if (conn) {
    conn.close();
    connectionStore.clientConnections.delete(playerId);
    connectionStore.connToPlayer.delete(conn);
  }

  // Check if game can proceed now
  const updated = getState();
  if (updated.phase === 'WRITING') {
    checkAutoStartGame();
  }
  if (updated.phase === 'PLAYING' && updated.playState.subPhase === 'VOTING') {
    checkAllFinalized();
  }

  // If no connected players remain besides host, end the game
  const connectedNonHost = updated.players.filter(
    (p) => p.connected && p.id !== gameStore.myPlayerId,
  );
  if (
    updated.phase !== 'LOBBY' &&
    updated.phase !== 'RESULTS' &&
    connectedNonHost.length === 0 &&
    updated.players.filter((p) => p.connected).length <= 1
  ) {
    // Only host remains — go to results
    mutate((s) => {
      s.phase = 'RESULTS';
    });
    clearGameState();
  }
}

// --- Stuck-state safety: auto-resolve when too few players remain ---

let stuckCheckTimeout: ReturnType<typeof setTimeout> | null = null;

function clearStuckCheck() {
  if (stuckCheckTimeout) {
    clearTimeout(stuckCheckTimeout);
    stuckCheckTimeout = null;
  }
}

function scheduleStuckCheck() {
  clearStuckCheck();
  // Give 30 seconds for players to reconnect before auto-resolving
  stuckCheckTimeout = setTimeout(() => {
    stuckCheckTimeout = null;
    resolveStuckState();
  }, 30000);
}

function resolveStuckState() {
  const state = getState();
  if (state.phase === 'LOBBY' || state.phase === 'RESULTS') return;

  const connected = state.players.filter((p) => p.connected);
  const excluded = state.excludedPlayers || [];
  const disconnectedUnresolved = state.players.filter(
    (p) => !p.connected && !excluded.includes(p.id),
  );

  // If no unresolved disconnects, nothing to do
  if (disconnectedUnresolved.length === 0) return;

  // If fewer than 2 connected players remain (including host), end the game
  if (connected.length < 2) {
    mutate((s) => {
      s.phase = 'RESULTS';
    });
    clearVoteTimer();
    clearGameState();
    return;
  }

  // Auto-exclude all disconnected players and try to proceed
  mutate((s) => {
    if (!s.excludedPlayers) s.excludedPlayers = [];
    for (const p of disconnectedUnresolved) {
      if (!s.excludedPlayers.includes(p.id)) {
        s.excludedPlayers.push(p.id);
      }
    }
    // Promote a new leader if the leader disconnected
    const hasLeader = s.players.some((p) => p.isLeader && p.connected);
    if (!hasLeader) {
      const next = s.players.find((p) => p.connected);
      if (next) next.isLeader = true;
    }
  });

  // Now try to proceed with the game
  const updated = getState();
  if (updated.phase === 'WRITING') {
    checkAutoStartGame();
  }
  if (updated.phase === 'PLAYING' && updated.playState.subPhase === 'VOTING') {
    resumeVoteTimer(() => revealAndScore());
    checkAllFinalized();
  }
}

// --- Disconnect / Reconnect ---

function handleDisconnect(playerId: string) {
  mutate((s) => {
    const player = s.players.find((p) => p.id === playerId);
    if (player) {
      player.connected = false;
      // If the leader disconnected, promote the next connected player
      if (player.isLeader) {
        player.isLeader = false;
        const next = s.players.find((p) => p.connected && p.id !== playerId);
        if (next) next.isLeader = true;
      }
    }
  });
  connectionStore.broadcast({ type: 'PLAYER_LEFT', playerId });

  // Pause vote timer if someone disconnected during voting
  const state = getState();
  if (state.phase === 'PLAYING' && state.playState.subPhase === 'VOTING') {
    pauseVoteTimer();
  }

  // Schedule a stuck-state check as a safety net
  scheduleStuckCheck();
}

function checkAfterReconnect() {
  if (!hasUnresolvedDisconnects()) {
    clearStuckCheck();
    const state = getState();
    if (state.phase === 'WRITING') {
      checkAutoStartGame();
    }
    if (state.phase === 'PLAYING' && state.playState.subPhase === 'VOTING') {
      resumeVoteTimer(() => revealAndScore());
      checkAllFinalized();
    }
  }
}

// --- Host as local player ---

export function hostJoin(name: string, avatarSeed: string) {
  const playerId = `host-${genId()}`;
  gameStore.setMyPlayerId(playerId);

  const player: Player = {
    id: playerId,
    name,
    avatarSeed,
    score: 0,
    isLeader: true,
    connected: true,
  };

  mutate((s) => {
    s.players.push(player);
  });
}

// Host dispatches a local action (same as client message but without network)
export function hostAction(msg: ClientMessage) {
  handleClientMessage(gameStore.myPlayerId, msg);
}

// Direct host phase transitions
export function hostAdvanceToSetup() {
  mutate((s) => {
    s.phase = 'SETUP';
  });
}

// Reset game for a new round with same players
export function hostPlayAgain() {
  mutate((s) => {
    s.phase = 'SETUP';
    s.stories = [];
    s.writingDone = [];
    s.excludedPlayers = [];
    s.playState = { ...INITIAL_PLAY_STATE };
    for (const p of s.players) {
      p.score = 0;
    }
  });
  // Re-save session (cleared when entering RESULTS)
  saveSession({
    roomCode: gameStore.state.roomCode,
    playerId: gameStore.myPlayerId,
    isHost: true,
  });
}

// Host intentionally ends the game — notifies all clients
export function hostEndGame() {
  connectionStore.broadcast({ type: 'GAME_ENDED', reason: 'The host ended the game.' });
  stopHeartbeat();
  clearVoteTimer();
  clearStuckCheck();
  clearGameState();
  // Brief delay so the broadcast has time to send before destroying peer
  setTimeout(() => {
    connectionStore.disconnect();
    gameStore.reset();
  }, 300);
}
