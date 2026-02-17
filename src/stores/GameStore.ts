import { makeAutoObservable, runInAction } from 'mobx';
import type { GameState, Player, Story, GameConfig, PlayState } from '../types/game';
import { createInitialState } from '../types/game';

class GameStoreClass {
  state: GameState = createInitialState('');
  myPlayerId: string = '';
  isHost: boolean = false;
  gameEndedReason: string = '';

  constructor() {
    makeAutoObservable(this);
  }

  get phase() {
    return this.state.phase;
  }

  get players(): Player[] {
    return this.state.players;
  }

  get myPlayer(): Player | undefined {
    return this.state.players.find((p) => p.id === this.myPlayerId);
  }

  get isLeader(): boolean {
    return this.myPlayer?.isLeader ?? false;
  }

  get config(): GameConfig {
    return this.state.config;
  }

  get stories(): Story[] {
    return this.state.stories;
  }

  get playState(): PlayState {
    return this.state.playState;
  }

  get roomCode(): string {
    return this.state.roomCode;
  }

  get currentTopicId(): string | undefined {
    const idx = this.state.playState.currentTopicIndex;
    return this.state.config.topicIds[idx];
  }

  get currentStory(): Story | undefined {
    const topicId = this.currentTopicId;
    if (!topicId) return undefined;
    const topicStories = this.state.stories.filter((s) => s.topicId === topicId);
    return topicStories[this.state.playState.currentStoryIndex];
  }

  get storiesForCurrentTopic(): Story[] {
    const topicId = this.currentTopicId;
    if (!topicId) return [];
    return this.state.stories.filter((s) => s.topicId === topicId);
  }

  get allWritingDone(): boolean {
    const excluded = this.state.excludedPlayers || [];
    const activePlayers = this.state.players.filter(
      (p) => p.connected && !excluded.includes(p.id),
    );
    return (
      activePlayers.length > 0 &&
      activePlayers.every((p) => this.state.writingDone.includes(p.id))
    );
  }

  get hasUnresolvedDisconnects(): boolean {
    const excluded = this.state.excludedPlayers || [];
    return this.state.players.some(
      (p) => !p.connected && !excluded.includes(p.id),
    );
  }

  get votesForCurrentStory(): { targetPlayerId: string; voterId: string }[] {
    const story = this.currentStory;
    if (!story) return [];
    return this.state.playState.votes.filter((v) => v.storyId === story.id);
  }

  setState(state: GameState) {
    runInAction(() => {
      this.state = state;
    });
  }

  setMyPlayerId(id: string) {
    runInAction(() => {
      this.myPlayerId = id;
    });
  }

  setIsHost(isHost: boolean) {
    runInAction(() => {
      this.isHost = isHost;
    });
  }

  setGameEndedReason(reason: string) {
    runInAction(() => {
      this.gameEndedReason = reason;
    });
  }

  reset() {
    runInAction(() => {
      this.state = createInitialState('');
      this.myPlayerId = '';
      this.isHost = false;
      // Don't clear gameEndedReason — it persists until shown on home page
    });
  }
}

export const gameStore = new GameStoreClass();
