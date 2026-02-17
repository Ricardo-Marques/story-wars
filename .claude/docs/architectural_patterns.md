# Architectural Patterns

## Host-Authority P2P Model

The host browser runs all game logic. Clients are thin — they send actions and receive full state replacements. There is no optimistic UI; clients wait for the host's STATE_UPDATE.

**Event flow:**
```
User action (Page) → dispatch() → hostAction() or sendAction()
  → HostEngine.handleClientMessage() → mutate() → broadcastState()
    → gameStore.setState() on host + connectionStore.broadcast() to clients
      → each client's gameStore.setState() → observer() re-renders
```

Host and client actions use the same `ClientMessage` type (`src/types/protocol.ts:4`). The host processes its own actions by calling `handleClientMessage()` directly (`src/engine/HostEngine.ts:534`), bypassing the network.

## Deep-Clone-Mutate-Broadcast

State mutations in HostEngine follow a single pattern via `mutate()` (`src/engine/hostCore.ts:20`):

1. Deep clone current state with `JSON.parse(JSON.stringify(...))`
2. Apply mutation function to the clone
3. Broadcast the new state to all clients and update the local store

This avoids MobX proxy issues and ensures every peer gets an identical plain object.

## MobX Singleton Stores

Two stores, each a class instantiated once and exported as a module-level singleton:

- `gameStore` (`src/stores/GameStore.ts:60`) — observable game state, computed derived values (`myPlayer`, `currentStory`, `isLeader`, etc.)
- `connectionStore` (`src/stores/ConnectionStore.ts:191`) — PeerJS lifecycle, connection maps, nullable event callbacks

Non-reactive fields (peer objects, callbacks, Maps) are excluded from MobX tracking via the second argument to `makeAutoObservable()` (`src/stores/ConnectionStore.ts:36`).

## Callback-Based Event Wiring

ConnectionStore exposes nullable callbacks rather than an event emitter:
- `onClientMessage` — set by HostEngine at `src/engine/HostEngine.ts:29`
- `onHostMessage` — set by ClientEngine at `src/engine/ClientEngine.ts:7`
- `onClientDisconnect` — set by HostEngine at `src/engine/HostEngine.ts:30`

This keeps the wiring explicit and avoids listener leak issues.

## Dual-Dispatch Pattern in Pages

Pages that send actions define a local `dispatch()` wrapper that routes to host or client engine based on `gameStore.isHost`:

```
function dispatch(msg) {
  if (isHost) hostAction(msg);
  else sendAction(msg);
}
```

Used in: `WritingPage.tsx:79`, `PlayPage.tsx:87`, `SetupPage.tsx:78-94`.

## Phase-Driven Navigation

A single invisible `PhaseRouter` component (`src/components/PhaseRouter.tsx`) observes `gameStore.phase` and calls `navigate()` when it changes. Pages don't need to manage their own navigation — the PhaseRouter handles all transitions via a `GamePhase → route` map (`src/components/PhaseRouter.tsx:9-15`).

## Game State Machine

Phases defined in `src/types/game.ts:1`:
```
LOBBY → SETUP → WRITING → PLAYING → RESULTS
```

PLAYING has sub-phases (`src/types/game.ts:3`):
```
READING → VOTING → REVEAL  (repeats per story per topic)
```

Phase transitions are triggered by:
- Leader-only actions (checked via `player.isLeader` guard in HostEngine handlers)
- `hostAdvanceToSetup()` for LOBBY→SETUP (`src/engine/HostEngine.ts:539`)
- `handleStartWriting()` for SETUP→WRITING (`src/engine/HostEngine.ts:184`)
- `handleStartGame()` for WRITING→PLAYING (`src/engine/HostEngine.ts:266`)
- `handleNext()` cycles sub-phases, then advances to RESULTS when all stories/topics exhausted (`src/engine/HostEngine.ts:360`)

## Scoring Rules

Implemented in `revealAndScore()` (`src/engine/HostEngine.ts:386`):
- Correct guess: **+2** for guesser
- Nobody guesses right: **+3** for author

## Timer Callback Pattern

Timer functions in `src/engine/hostTimers.ts` accept expiry callbacks as parameters instead of importing handler functions from HostEngine. This breaks the circular dependency (timers → handlers → timers):

```
startVoteTimer(() => revealAndScore())
startReadingTimeout(readingExpired)
resumeVoteTimer(() => revealAndScore())
```

## Styled Component Extraction Pattern

Large page components extract their styled components into a companion `*.styles.ts` file:
- `src/pages/PlayPage.styles.ts` — 14 styled components used by PlayPage
- `src/pages/HomePage.styles.ts` — 12 styled components used by HomePage

Styled components only used by a single sub-component are co-located with that component (e.g. `RulesModal.tsx` contains its own `RulesOverlay`, `RulesPanel`, etc.).

## Styled Component Conventions

- Shared primitives (`Button`, `Input`, `TextArea`, `Card`, `PageWrap`, `Subtitle`) live in `src/components/Button.tsx` and are imported by pages
- Conditional styles use typed props: `styled.span<{ positive: boolean }>` with arrow function interpolation
- All spacing, colors, and radii reference theme tokens — no raw pixel values

## Component Export Patterns

- **Pages**: Named export wrapped with `observer()` — `export const XPage = observer(function XPage() { ... })`
- **Simple components**: Named function export — `export function StoryCard({ ... }) { ... }`
- **Stores**: Class instantiated, singleton exported — `export const gameStore = new GameStoreClass()`
- **Engine functions**: Named function exports — `export function hostAction(msg) { ... }`
- **Types**: Discriminated unions for messages, interfaces for data structures

## Full State Broadcast (No Diffs)

Every mutation broadcasts the entire `GameState` object (`src/engine/hostCore.ts:10`). This simplifies the protocol and gives clients free reconnection handling — any STATE_UPDATE fully restores client state.

## Leadership Model

The first player to join becomes the leader (`src/engine/HostEngine.ts:103`). Leader-only actions (config, phase transitions, advancing stories) are guarded by `player.isLeader` checks. Non-leader attempts are silently ignored.

## ConnectionStore Module Split

The connection store is split into three files:
- `src/stores/ConnectionStore.ts` — lean MobX store with observable state and thin public methods
- `src/stores/connectionSetup.ts` — host/client peer creation (`setupHostPeer`, `connectToHostPeer`)
- `src/stores/connectionUtils.ts` — auto-reconnect loop (`startAutoReconnectLoop`, `stopAutoReconnectLoop`, `createPeerForReconnect`)

Helper functions receive the store instance as a parameter rather than importing the singleton, keeping the dependency direction clear (helpers depend on the store type, store imports helpers).
