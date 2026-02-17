<p align="center">
  <img src="public/logo.svg" alt="Story Wars" width="480" />
</p>

<p align="center">
  <a href="https://github.com/Ricardo-Marques/story-wars/actions/workflows/deploy.yml"><img src="https://github.com/Ricardo-Marques/story-wars/actions/workflows/deploy.yml/badge.svg" alt="Deploy" /></a>
  <a href="https://github.com/Ricardo-Marques/story-wars/actions/workflows/deploy.yml"><img src="https://img.shields.io/badge/tests-10%20passed-brightgreen?logo=playwright&logoColor=white" alt="Playwright Tests" /></a>
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-5.5-3178c6?logo=typescript&logoColor=white" alt="TypeScript" /></a>
  <a href="https://react.dev/"><img src="https://img.shields.io/badge/React-18-61dafb?logo=react&logoColor=white" alt="React" /></a>
  <a href="https://vite.dev/"><img src="https://img.shields.io/badge/Vite-5-646cff?logo=vite&logoColor=white" alt="Vite" /></a>
  <a href="https://peerjs.com/"><img src="https://img.shields.io/badge/PeerJS-WebRTC-ff6600?logo=webrtc&logoColor=white" alt="PeerJS" /></a>
</p>

A multiplayer browser party game where players write short stories around fun topics, then try to guess who wrote each one. No server required — the room creator's browser acts as the game host using peer-to-peer WebRTC connections.

**[Play now](https://ricardo-marques.github.io/story-wars/)**

---

## How to Play

1. **Create a room** — One player creates a room and shares the invite link
2. **Friends join** — Others join using the link or 6-character room code (minimum 3 players)
3. **Pick topics** — The leader selects topics like *"Your most embarrassing moment"* or *"The biggest lie you ever told"*
4. **Write stories** — Everyone writes a short story for each topic — be creative and try to disguise your writing style!
5. **Guess the author** — Stories are read aloud one at a time with a typewriter effect, then everyone votes on who they think wrote it
6. **Score points** — Correct guess: **+2 pts** | Nobody guesses you: **+3 pts**

## Running Locally

```bash
git clone https://github.com/Ricardo-Marques/story-wars.git
cd story-wars
npm install
npm run dev
```

Open `http://localhost:5173/story-wars/` in your browser.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server |
| `npm run build` | TypeScript check + production build |
| `npm test` | Run Playwright E2E tests |
| `npm run test:ui` | Open Playwright visual test runner |

## Tech Stack

### Frontend

- **[React 18](https://react.dev/)** with **[TypeScript 5](https://www.typescriptlang.org/)** — UI framework with strict type checking
- **[MobX 6](https://mobx.js.org/)** + `mobx-react-lite` — Reactive state management via singleton stores and `observer()` components
- **[Emotion](https://emotion.sh/)** (`@emotion/styled` + `@emotion/react`) — CSS-in-JS with a dark theme defined in `src/styles/theme.ts`
- **[Vite 5](https://vite.dev/)** + `vite-plugin-pwa` — Fast dev server, production builds, and PWA support for installable offline play

### Networking

- **[PeerJS](https://peerjs.com/)** (WebRTC) — Peer-to-peer data channels between players. The host's browser runs the game engine and broadcasts full state to all clients on every change. No backend server, no database — just browsers talking directly to each other via WebRTC with PeerJS's free signaling server for connection setup.

### Game Architecture

The game follows a **host-authority model**:

- `src/engine/HostEngine.ts` — State machine running in the host's browser. Processes all actions, manages scoring, timers, and broadcasts state
- `src/engine/ClientEngine.ts` — Thin client that receives state updates and forwards player actions to the host
- `src/stores/GameStore.ts` — MobX observable store holding the full game state with computed derived values
- `src/stores/ConnectionStore.ts` — PeerJS peer lifecycle and connection management

State flows one way: **Player action -> Host engine -> Full state broadcast -> All clients update**. No diffs or patches — every update sends the complete game state object for simplicity and resilience.

### Other Libraries

- **[@dicebear](https://www.dicebear.com/)** — Procedurally generated player avatars (adventurer style)
- **Web Speech API** — Browser-native text-to-speech for reading stories aloud with synchronized typewriter reveal

### Testing

- **[Playwright](https://playwright.dev/)** — 10 end-to-end integration tests exercising real PeerJS WebRTC connections between multiple browser contexts. Tests cover the full game flow (room creation, joining, setup, writing, reading, voting, reveal, results), lobby interactions, home page UI, and reconnection after page refresh. Tests run in CI before every deploy.

## Project Structure

```
src/
├── engine/          # Game logic (host-authority model)
│   ├── hostCore.ts      # Shared infra: mutate, broadcast, state access
│   ├── hostTimers.ts    # Timer management: heartbeat, reading, vote
│   ├── HostEngine.ts    # Handlers, init, public API
│   └── ClientEngine.ts  # Receives state, sends actions to host
├── stores/          # MobX singleton stores
│   ├── GameStore.ts     # Observable game state + computed values
│   ├── connectionSetup.ts  # Host/client peer creation
│   ├── connectionUtils.ts  # Auto-reconnect loop helpers
│   └── ConnectionStore.ts  # PeerJS peer lifecycle (lean store)
├── pages/           # Route components (one per game phase)
│   ├── HomePage.tsx     # Create/join room
│   ├── HomePage.styles.ts  # Styled components for HomePage
│   ├── LobbyPage.tsx    # Waiting room + invite sharing
│   ├── SetupPage.tsx    # Topic selection + config
│   ├── WritingPage.tsx  # Story input
│   ├── PlayPage.tsx     # Reading, voting, reveal cycle
│   ├── PlayPage.styles.ts  # Styled components for PlayPage
│   └── ResultsPage.tsx  # Final scoreboard
├── hooks/           # React hooks
│   └── useStoryReveal.ts   # TTS + typewriter reveal logic
├── components/      # Reusable UI (Button, StoryCard, VotePanel, RulesModal, etc.)
├── types/           # TypeScript types (game state, protocol messages)
├── styles/          # Theme tokens + CSS reset
├── data/            # 50 built-in story topics
└── utils/           # Helpers (avatar, room codes, TTS, localStorage)
tests/
├── helpers.ts           # PlayerContext utility for multi-browser tests
├── game-flow.spec.ts    # Full 3-player game E2E
├── home-page.spec.ts    # Home page UI tests
├── lobby.spec.ts        # Lobby join/display tests
└── reconnection.spec.ts # Refresh/rejoin tests
```

## Game State Machine

```
LOBBY -> SETUP -> WRITING -> PLAYING -> RESULTS
                               |
                    READING -> VOTING -> REVEAL  (per story)
```

Phase transitions are controlled by the host engine. Navigation is handled automatically by a `PhaseRouter` component that syncs the URL to the current game phase.

## License

MIT
