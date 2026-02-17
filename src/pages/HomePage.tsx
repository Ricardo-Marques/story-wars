import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { observer } from 'mobx-react-lite'
import { Button, Input, PageWrap, Subtitle } from '../components/Button'
import { AvatarPicker } from '../components/AvatarPicker'
import { HowToPlay } from '../components/HowToPlay'
import { connectionStore } from '../stores/ConnectionStore'
import { gameStore } from '../stores/GameStore'
import { initHost, resumeHost, hostJoin } from '../engine/HostEngine'
import { initClient, sendAction } from '../engine/ClientEngine'
import { generateRoomCode, isValidRoomCode } from '../utils/roomCode'
import { createInitialState } from '../types/game'
import { randomSeed } from '../utils/avatar'
import { useReaction, useLocalObservable } from '../utils/mobx'
import {
  loadPlayerName,
  savePlayerName,
  loadAvatarSeed,
  saveAvatarSeed,
  saveSession,
  loadSession,
  loadGameState,
  clearGameState,
} from '../utils/storage'
import {
  Form,
  Row,
  Divider,
  ErrorMsg,
  NoticeMsg,
  RoomBadge,
  RoomCodeLabel,
  RoomCodeValue,
  ResumeBox,
  ResumeLabel,
  ResumeCode,
  RulesLink,
} from './HomePage.styles'

export const HomePage = observer(function HomePage() {
  const navigate = useNavigate()
  const { roomCode: urlCode } = useParams<{ roomCode: string }>()
  const [searchParams] = useSearchParams()
  const hostName = searchParams.get('host')
  const isJoiningViaLink = !!urlCode && isValidRoomCode(urlCode.toUpperCase())

  const local = useLocalObservable(() => ({
    name: loadPlayerName(),
    avatarSeed: loadAvatarSeed() || randomSeed(),
    joinCode: urlCode?.toUpperCase() ?? '',
    error: '',
    loading: false,
    showRules: false,
    savedSession: loadSession(),
    savedState: loadGameState(),
  }))

  // Clear the "game ended" notification after 5 seconds
  useReaction(
    () => gameStore.gameEndedReason,
    (reason) => {
      if (reason) {
        const timer = setTimeout(() => gameStore.setGameEndedReason(''), 5000)
        return () => clearTimeout(timer)
      }
    },
  )

  // Persist name and avatar to localStorage when they change
  useReaction(
    () => local.name,
    (n) => savePlayerName(n),
  )
  useReaction(
    () => local.avatarSeed,
    (s) => saveAvatarSeed(s),
  )

  const gameEndedReason = gameStore.gameEndedReason
  const canProceed = local.name.trim().length >= 1
  const canResume =
    local.savedSession &&
    local.savedState &&
    local.savedState.phase !== 'RESULTS'

  async function handleResume() {
    const { savedSession, savedState } = local
    if (!savedSession || !savedState) return
    local.loading = true
    local.error = ''
    try {
      if (savedSession.isHost) {
        let lastErr: unknown
        for (let attempt = 0; attempt < 3; attempt++) {
          try {
            await connectionStore.createHost(savedSession.roomCode)
            lastErr = null
            break
          } catch (e) {
            lastErr = e
            if (attempt < 2) await new Promise((r) => setTimeout(r, 1500))
          }
        }
        if (lastErr) throw lastErr
        resumeHost(savedState, savedSession.playerId)
        saveSession(savedSession)
      } else {
        gameStore.setState(savedState)
        gameStore.setMyPlayerId(savedSession.playerId)
        gameStore.setIsHost(false)
        initClient()

        const connected = await connectionStore.connectOrReconnect(
          savedSession.roomCode,
        )
        if (connected) {
          sendAction({ type: 'REJOIN', playerId: savedSession.playerId })
        }
      }
      navigate('/lobby')
    } catch {
      local.error = 'Could not reconnect. Try again or start a new game.'
      local.loading = false
    }
  }

  async function handleCreate() {
    if (!canProceed) return
    local.loading = true
    local.error = ''
    try {
      connectionStore.disconnect()
      clearGameState()
      const code = generateRoomCode()
      await connectionStore.createHost(code)
      initHost(code)
      hostJoin(local.name.trim(), local.avatarSeed)
      saveSession({
        roomCode: code,
        playerId: gameStore.myPlayerId,
        isHost: true,
      })
      navigate('/lobby')
    } catch {
      local.error = 'Failed to create room. Try again.'
      local.loading = false
    }
  }

  async function handleJoin() {
    const code = isJoiningViaLink ? urlCode!.toUpperCase() : local.joinCode
    if (!canProceed || !isValidRoomCode(code)) return
    local.loading = true
    local.error = ''
    try {
      connectionStore.disconnect()
      clearGameState()
      gameStore.setState(createInitialState(code))
      await connectionStore.connectToHost(code)
      initClient()
      gameStore.setIsHost(false)
      sendAction({ type: 'JOIN', name: local.name.trim(), avatarSeed: local.avatarSeed })
      navigate('/lobby')
    } catch {
      local.error = 'Could not find room. Check the code and try again.'
      local.loading = false
    }
  }

  if (isJoiningViaLink) {
    return (
      <PageWrap>
        <Subtitle>You've been invited!</Subtitle>

        {gameEndedReason && <NoticeMsg>{gameEndedReason}</NoticeMsg>}

        <RoomBadge>
          <RoomCodeLabel>
            {hostName ? `Joining ${hostName}'s room` : 'Joining room'}
          </RoomCodeLabel>
          <RoomCodeValue>{urlCode!.toUpperCase()}</RoomCodeValue>
        </RoomBadge>

        <Form>
          <Input
            placeholder="Your name"
            value={local.name}
            onChange={(e) => (local.name = e.target.value)}
            maxLength={20}
            autoFocus
          />

          <AvatarPicker
            seed={local.avatarSeed}
            onChange={(s) => (local.avatarSeed = s)}
          />

          <Button onClick={handleJoin} disabled={!canProceed || local.loading}>
            {local.loading ? 'Joining...' : 'Join Game'}
          </Button>

          {local.error && <ErrorMsg>{local.error}</ErrorMsg>}
        </Form>
      </PageWrap>
    )
  }

  return (
    <PageWrap>
      {gameEndedReason && <NoticeMsg>{gameEndedReason}</NoticeMsg>}

      {canResume && (
        <ResumeBox>
          <ResumeLabel>
            You have a game in progress (room{' '}
            <ResumeCode>{local.savedSession!.roomCode}</ResumeCode>)
          </ResumeLabel>
          <Button onClick={handleResume} disabled={local.loading}>
            {local.loading ? 'Reconnecting...' : 'Rejoin Game'}
          </Button>
        </ResumeBox>
      )}

      <Form>
        <Input
          placeholder="Your name"
          value={local.name}
          onChange={(e) => (local.name = e.target.value)}
          maxLength={20}
        />

        <AvatarPicker
          seed={local.avatarSeed}
          onChange={(s) => (local.avatarSeed = s)}
        />

        <Button onClick={handleCreate} disabled={!canProceed || local.loading}>
          Create Room
        </Button>

        <Divider>- or join a room -</Divider>

        <Row>
          <Input
            placeholder="Room Code"
            value={local.joinCode}
            onChange={(e) => (local.joinCode = e.target.value.toUpperCase())}
            maxLength={6}
            style={{ textTransform: 'uppercase', letterSpacing: '2px' }}
          />
          <Button
            onClick={handleJoin}
            disabled={
              !canProceed || !isValidRoomCode(local.joinCode) || local.loading
            }
            variant="secondary"
          >
            Join
          </Button>
        </Row>

        {local.error && <ErrorMsg>{local.error}</ErrorMsg>}
      </Form>

      <RulesLink onClick={() => (local.showRules = true)}>
        How to Play
      </RulesLink>

      <HowToPlay
        open={local.showRules}
        onClose={() => (local.showRules = false)}
      />
    </PageWrap>
  )
})
