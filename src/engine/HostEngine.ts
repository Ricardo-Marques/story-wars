import { connectionStore } from '../stores/ConnectionStore';
import { gameStore } from '../stores/GameStore';
import { createInitialState, INITIAL_PLAY_STATE } from '../types/game';
import type { GameState, Player, Story } from '../types/game';
import type { ClientMessage } from '../types/protocol';
import { saveGameState, saveSession, clearGameState } from '../utils/storage';

let voteTimer: ReturnType<typeof setTimeout> | null = null;
let voteTimerStartedAt: number | null = null;
let voteTimerDuration: number = 0; // seconds remaining for current timer
let heartbeatInterval: ReturnType<typeof setInterval> | null = null;

function genId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

function broadcastState(state: GameState) {
  connectionStore.broadcast({ type: 'STATE_UPDATE', state });
  gameStore.setState(state);
  saveGameState(state);
}

function getState(): GameState {
  return gameStore.state;
}

function mutate(fn: (s: GameState) => void) {
  const state = JSON.parse(JSON.stringify(getState())) as GameState;
  fn(state);
  broadcastState(state);
}

function hasUnresolvedDisconnects(): boolean {
  const state = getState();
  const excluded = state.excludedPlayers || [];
  return state.players.some((p) => !p.connected && !excluded.includes(p.id));
}

// Compute current vote timer remaining and inject into a state clone (for WELCOME)
function getStateWithTimerSync(): GameState {
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

// --- Heartbeat ---

function startHeartbeat() {
  stopHeartbeat();
  heartbeatInterval = setInterval(() => {
    connectionStore.broadcast({ type: 'PING' });
  }, 3000);
}

function stopHeartbeat() {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }
}

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

// --- Vote timer with pause/resume ---

function startVoteTimer() {
  const seconds = getState().config.voteTimerSeconds;
  voteTimerDuration = seconds;
  voteTimerStartedAt = Date.now();
  voteTimer = setTimeout(() => {
    voteTimer = null;
    voteTimerStartedAt = null;
    if (getState().playState.subPhase === 'VOTING') {
      revealAndScore();
    }
  }, seconds * 1000);
}

function pauseVoteTimer() {
  if (voteTimer && voteTimerStartedAt) {
    clearTimeout(voteTimer);
    voteTimer = null;
    const elapsed = (Date.now() - voteTimerStartedAt) / 1000;
    voteTimerDuration = Math.max(0, voteTimerDuration - elapsed);
    voteTimerStartedAt = null;
  }
}

function resumeVoteTimer() {
  if (voteTimerDuration > 0 && !voteTimer) {
    voteTimerStartedAt = Date.now();
    voteTimer = setTimeout(() => {
      voteTimer = null;
      voteTimerStartedAt = null;
      if (getState().playState.subPhase === 'VOTING') {
        revealAndScore();
      }
    }, voteTimerDuration * 1000);
  }
}

function clearVoteTimer() {
  if (voteTimer) {
    clearTimeout(voteTimer);
    voteTimer = null;
  }
  voteTimerStartedAt = null;
  voteTimerDuration = 0;
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
    mutate((s) => {
      s.playState.subPhase = 'VOTING';
      s.playState.finalizedVoters = [];
      s.playState.voteTimerSecondsLeft = s.config.voteTimerSeconds;
    });
    startVoteTimer();
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
      resumeVoteTimer();
      checkAllFinalized();
    }
  }
}

// --- Disconnect / Reconnect ---

function handleDisconnect(playerId: string) {
  mutate((s) => {
    const player = s.players.find((p) => p.id === playerId);
    if (player) {
      player.connected = false;
    }
  });
  connectionStore.broadcast({ type: 'PLAYER_LEFT', playerId });

  // Pause vote timer if someone disconnected during voting
  const state = getState();
  if (state.phase === 'PLAYING' && state.playState.subPhase === 'VOTING') {
    pauseVoteTimer();
  }

  // Don't auto-advance when there are unresolved disconnects
  // The leader must use "Continue Without" to proceed
}

function checkAfterReconnect() {
  if (!hasUnresolvedDisconnects()) {
    const state = getState();
    if (state.phase === 'WRITING') {
      checkAutoStartGame();
    }
    if (state.phase === 'PLAYING' && state.playState.subPhase === 'VOTING') {
      resumeVoteTimer();
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

function shuffle<T>(arr: T[]): void {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}
