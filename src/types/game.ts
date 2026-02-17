export type GamePhase = 'LOBBY' | 'SETUP' | 'WRITING' | 'PLAYING' | 'RESULTS';

export type PlaySubPhase = 'READING' | 'VOTING' | 'REVEAL';

export interface Player {
  id: string;
  name: string;
  avatarSeed: string;
  score: number;
  isLeader: boolean;
  connected: boolean;
}

export interface GameConfig {
  topicIds: string[];
  storiesPerPrompt: number;
  voteTimerSeconds: number;
}

export interface Story {
  id: string;
  topicId: string;
  authorId: string;
  text: string;
}

export interface Vote {
  voterId: string;
  storyId: string;
  targetPlayerId: string;
}

export interface PlayState {
  subPhase: PlaySubPhase;
  currentTopicIndex: number;
  currentStoryIndex: number;
  votes: Vote[];
  finalizedVoters: string[]; // playerIds who locked in their vote
  revealedAuthorId: string | null;
  voteTimerSecondsLeft: number; // synced to clients so reconnectors see correct time
}

export interface GameState {
  phase: GamePhase;
  roomCode: string;
  players: Player[];
  config: GameConfig;
  stories: Story[];
  playState: PlayState;
  writingDone: string[]; // playerIds who finished writing
  excludedPlayers: string[]; // playerIds the leader chose to continue without
}

export const DEFAULT_CONFIG: GameConfig = {
  topicIds: [],
  storiesPerPrompt: 1,
  voteTimerSeconds: 60,
};

export const INITIAL_PLAY_STATE: PlayState = {
  subPhase: 'READING',
  currentTopicIndex: 0,
  currentStoryIndex: 0,
  votes: [],
  finalizedVoters: [],
  revealedAuthorId: null,
  voteTimerSecondsLeft: 0,
};

export function createInitialState(roomCode: string): GameState {
  return {
    phase: 'LOBBY',
    roomCode,
    players: [],
    config: { ...DEFAULT_CONFIG },
    stories: [],
    playState: { ...INITIAL_PLAY_STATE },
    writingDone: [],
    excludedPlayers: [],
  };
}
