import { useState, useEffect } from 'react'
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

  const [name, setName] = useState(() => loadPlayerName())
  const [avatarSeed, setAvatarSeed] = useState(
    () => loadAvatarSeed() || randomSeed(),
  )
  const [joinCode, setJoinCode] = useState(urlCode?.toUpperCase() ?? '')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [savedSession] = useState(() => loadSession())
  const [savedState] = useState(() => loadGameState())
  const [showRules, setShowRules] = useState(false)
  const gameEndedReason = gameStore.gameEndedReason

  // Clear the "game ended" notification after 5 seconds
  useEffect(() => {
    if (gameEndedReason) {
      const timer = setTimeout(() => gameStore.setGameEndedReason(''), 5000)
      return () => clearTimeout(timer)
    }
  }, [gameEndedReason])

  useEffect(() => {
    savePlayerName(name)
  }, [name])

  useEffect(() => {
    saveAvatarSeed(avatarSeed)
  }, [avatarSeed])

  const canProceed = name.trim().length >= 1
  const canResume = savedSession && savedState && savedState.phase !== 'RESULTS'

  async function handleResume() {
    if (!savedSession || !savedState) return
    setLoading(true)
    setError('')
    try {
      if (savedSession.isHost) {
        // Retry up to 3 times — PeerJS may need a moment to free the old ID
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
        // Load saved state immediately so PhaseRouter works and DisconnectOverlay can show
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
        // If not connected, auto-reconnect is running in background.
        // DisconnectOverlay will show "Trying to reconnect..."
      }
      navigate('/lobby')
    } catch {
      setError('Could not reconnect. Try again or start a new game.')
      setLoading(false)
    }
  }

  async function handleCreate() {
    if (!canProceed) return
    setLoading(true)
    setError('')
    try {
      // Clear any existing game before starting fresh
      connectionStore.disconnect()
      clearGameState()
      const code = generateRoomCode()
      await connectionStore.createHost(code)
      initHost(code)
      hostJoin(name.trim(), avatarSeed)
      saveSession({
        roomCode: code,
        playerId: gameStore.myPlayerId,
        isHost: true,
      })
      navigate('/lobby')
    } catch {
      setError('Failed to create room. Try again.')
      setLoading(false)
    }
  }

  async function handleJoin() {
    const code = isJoiningViaLink ? urlCode!.toUpperCase() : joinCode
    if (!canProceed || !isValidRoomCode(code)) return
    setLoading(true)
    setError('')
    try {
      // Clear any existing game before joining a new one
      connectionStore.disconnect()
      clearGameState()
      // Set fresh LOBBY state with room code so PhaseRouter doesn't
      // kick us while waiting for the WELCOME message from the host
      gameStore.setState(createInitialState(code))
      await connectionStore.connectToHost(code)
      initClient()
      gameStore.setIsHost(false)
      sendAction({ type: 'JOIN', name: name.trim(), avatarSeed })
      // Session is saved after WELCOME (when we know our playerId)
      navigate('/lobby')
    } catch {
      setError('Could not find room. Check the code and try again.')
      setLoading(false)
    }
  }

  // Simplified view when joining via a shared link
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
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={20}
            autoFocus
          />

          <AvatarPicker seed={avatarSeed} onChange={setAvatarSeed} />

          <Button onClick={handleJoin} disabled={!canProceed || loading}>
            {loading ? 'Joining...' : 'Join Game'}
          </Button>

          {error && <ErrorMsg>{error}</ErrorMsg>}
        </Form>
      </PageWrap>
    )
  }

  // Default view: create or join
  return (
    <PageWrap>
      {gameEndedReason && <NoticeMsg>{gameEndedReason}</NoticeMsg>}

      {canResume && (
        <ResumeBox>
          <ResumeLabel>
            You have a game in progress (room{' '}
            <ResumeCode>{savedSession.roomCode}</ResumeCode>)
          </ResumeLabel>
          <Button onClick={handleResume} disabled={loading}>
            {loading ? 'Reconnecting...' : 'Rejoin Game'}
          </Button>
        </ResumeBox>
      )}

      <Form>
        <Input
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={20}
        />

        <AvatarPicker seed={avatarSeed} onChange={setAvatarSeed} />

        <Button onClick={handleCreate} disabled={!canProceed || loading}>
          Create Room
        </Button>

        <Divider>- or join a room -</Divider>

        <Row>
          <Input
            placeholder="Room Code"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            maxLength={6}
            style={{ textTransform: 'uppercase', letterSpacing: '2px' }}
          />
          <Button
            onClick={handleJoin}
            disabled={!canProceed || !isValidRoomCode(joinCode) || loading}
            variant="secondary"
          >
            Join
          </Button>
        </Row>

        {error && <ErrorMsg>{error}</ErrorMsg>}
      </Form>

      <RulesLink onClick={() => setShowRules(true)}>How to Play</RulesLink>

      <HowToPlay open={showRules} onClose={() => setShowRules(false)} />
    </PageWrap>
  )
})
