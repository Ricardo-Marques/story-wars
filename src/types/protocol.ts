import type { GameState, Player } from './game';

// Client → Host messages
export type ClientMessage =
  | { type: 'JOIN'; name: string; avatarSeed: string }
  | { type: 'REJOIN'; playerId: string }
  | { type: 'SET_CONFIG'; topicIds: string[]; storiesPerPrompt: number; voteTimerSeconds: number }
  | { type: 'START_WRITING' }
  | { type: 'START_GAME' }
  | { type: 'SUBMIT_STORY'; topicId: string; text: string }
  | { type: 'DONE_WRITING' }
  | { type: 'CAST_VOTE'; targetPlayerId: string }
  | { type: 'FINALIZE_VOTE' }
  | { type: 'NEXT' }
  | { type: 'CONTINUE_WITHOUT'; targetPlayerId: string };

// Host → Client messages
export type HostMessage =
  | { type: 'WELCOME'; playerId: string; state: GameState }
  | { type: 'PLAYER_JOINED'; player: Player }
  | { type: 'PLAYER_LEFT'; playerId: string }
  | { type: 'STATE_UPDATE'; state: GameState }
  | { type: 'ERROR'; message: string }
  | { type: 'PING' };
