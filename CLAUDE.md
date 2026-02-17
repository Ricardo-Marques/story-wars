# Story Wars

Multiplayer browser party game — players write short stories around topics, then guess who wrote each. Uses PeerJS (WebRTC) so the room creator's browser acts as the game server with no backend.

## Tech Stack

- **UI**: React 18, React Router 6, TypeScript 5
- **State**: MobX 6 + mobx-react-lite (singleton stores, `observer()` components)
- **Styling**: Emotion (`@emotion/styled` + `@emotion/react`), dark theme via `src/styles/theme.ts`
- **Networking**: PeerJS (WebRTC P2P) — host peer ID is `storywars-{ROOMCODE}`
- **Avatars**: @dicebear/core + @dicebear/collection (adventurer style)
- **TTS**: Web Speech API (browser native)
- **Build**: Vite 5 + vite-plugin-pwa
- **JSX**: `@emotion/react` jsxImportSource (configured in `tsconfig.json:12`)

## Commands

```bash
npm run dev      # Start dev server
npm run build    # TypeScript check + Vite production build (outputs dist/)
npx tsc --noEmit # Type-check only
```

No test framework is configured yet.

## Project Structure

```
src/
├── engine/          # Game logic (host-authority model)
│   ├── HostEngine.ts    # State machine, scoring, timers, broadcasts state
│   └── ClientEngine.ts  # Receives state updates, sends actions to host
├── stores/          # MobX singleton stores
│   ├── GameStore.ts     # Observable game state + computed derived values
│   └── ConnectionStore.ts # PeerJS peer lifecycle, connection maps
├── types/           # TypeScript types
│   ├── game.ts          # Player, GameState, GameConfig, GamePhase, etc.
│   └── protocol.ts      # ClientMessage / HostMessage discriminated unions
├── pages/           # Route components (one per game phase)
│   ├── HomePage.tsx     # Create/join room
│   ├── LobbyPage.tsx    # Waiting room
│   ├── SetupPage.tsx    # Topic selection + config (leader only)
│   ├── WritingPage.tsx  # Story input
│   ├── PlayPage.tsx     # Reading → Voting → Reveal cycle
│   └── ResultsPage.tsx  # Final scoreboard
├── components/      # Reusable UI
│   ├── Button.tsx       # Shared primitives: Button, Input, TextArea, Card, PageWrap, Subtitle
│   ├── PhaseRouter.tsx  # Auto-navigates based on gameStore.phase
│   └── ...              # AvatarPicker, TopicSelector, StoryCard, VotePanel, etc.
├── styles/
│   ├── theme.ts         # Color palette, spacing, radii tokens
│   └── GlobalStyles.tsx # CSS reset via Emotion Global
├── data/
│   └── topics.ts        # 50 static story topics
└── utils/               # Pure helpers (avatar, roomCode, tts, localStorage)
```

## Game State Machine

```
LOBBY → SETUP → WRITING → PLAYING → RESULTS
                            ↓
                   READING → VOTING → REVEAL  (per story, per topic)
```

Phases defined at `src/types/game.ts:1-3`. Transitions controlled by HostEngine. Navigation handled automatically by `PhaseRouter` (`src/components/PhaseRouter.tsx`).

## Key Concepts

- **Host = server**: The host browser runs HostEngine, processes all actions, and broadcasts full GameState to clients on every change
- **Dual dispatch**: Pages call `hostAction(msg)` if host, `sendAction(msg)` if client — same message type either way
- **Full state sync**: No diffs — every STATE_UPDATE sends the complete GameState object
- **Leader guards**: Config changes and phase advances require `player.isLeader` (first player to join)
- **Scoring**: +2 for correct guess, +3 for author when nobody guesses right (`src/engine/HostEngine.ts:134`)

## Additional Documentation

Check these files for deeper context when working in specific areas:

| File | When to check |
|------|---------------|
| `.claude/docs/architectural_patterns.md` | Modifying engine logic, state flow, store patterns, component conventions, or phase transitions |
