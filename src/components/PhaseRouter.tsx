import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import { gameStore } from '../stores/GameStore';
import type { GamePhase } from '../types/game';

const PHASE_ROUTES: Record<GamePhase, string> = {
  LOBBY: '/lobby',
  SETUP: '/setup',
  WRITING: '/writing',
  PLAYING: '/play',
  RESULTS: '/results',
};

const GAME_PAGES = new Set(Object.values(PHASE_ROUTES));

export const PhaseRouter = observer(function PhaseRouter() {
  const navigate = useNavigate();
  const location = useLocation();
  const { phase, roomCode } = gameStore;

  useEffect(() => {
    const onGamePage = GAME_PAGES.has(location.pathname);

    // If on a game page but no active game, redirect to home for resume flow
    if (!roomCode && onGamePage) {
      navigate('/');
      return;
    }

    // If in active game, navigate to correct phase
    if (!roomCode) return;

    const target = PHASE_ROUTES[phase];
    if (target && location.pathname !== target) {
      navigate(target);
    }
  }, [phase, roomCode, navigate, location.pathname]);

  return null;
});
