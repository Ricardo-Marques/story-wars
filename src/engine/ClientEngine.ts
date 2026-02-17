import { connectionStore } from '../stores/ConnectionStore';
import { gameStore } from '../stores/GameStore';
import type { HostMessage, ClientMessage } from '../types/protocol';
import { saveSession, saveGameState, clearGameState } from '../utils/storage';

export function initClient() {
  connectionStore.onHostMessage = handleHostMessage;
  connectionStore.onReconnected = handleReconnected;
  connectionStore.startHeartbeatMonitor();
}

function handleHostMessage(msg: HostMessage) {
  switch (msg.type) {
    case 'WELCOME':
      gameStore.setMyPlayerId(msg.playerId);
      gameStore.setState(msg.state);
      saveSession({ roomCode: msg.state.roomCode, playerId: msg.playerId, isHost: false });
      saveGameState(msg.state);
      break;
    case 'STATE_UPDATE':
      gameStore.setState(msg.state);
      saveGameState(msg.state);
      break;
    case 'PLAYER_JOINED':
      // STATE_UPDATE will cover this, but we could show a toast
      break;
    case 'PLAYER_LEFT':
      // STATE_UPDATE will cover this
      break;
    case 'ERROR':
      console.error('[StoryWars] Server error:', msg.message);
      break;
    case 'PING':
      connectionStore.handlePing();
      break;
    case 'GAME_ENDED':
      clearGameState();
      connectionStore.disconnect();
      gameStore.setGameEndedReason(msg.reason);
      gameStore.reset();
      // PhaseRouter will redirect to / since roomCode is now empty
      break;
  }
}

function handleReconnected() {
  // Re-identify ourselves to the host after auto-reconnect
  connectionStore.handlePing(); // Reset heartbeat timer
  if (gameStore.myPlayerId) {
    connectionStore.sendToHost({ type: 'REJOIN', playerId: gameStore.myPlayerId });
  }
}

export function sendAction(msg: ClientMessage) {
  connectionStore.sendToHost(msg);
}
