import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { observer } from 'mobx-react-lite'
import styled from '@emotion/styled'
import { theme } from '../styles/theme'
import { Button, PageWrap, Subtitle } from '../components/Button'
import { StoryCard } from '../components/StoryCard'
import { VotePanel } from '../components/VotePanel'
import { Timer } from '../components/Timer'
import { gameStore } from '../stores/GameStore'
import { hostAction } from '../engine/HostEngine'
import { sendAction } from '../engine/ClientEngine'
import { TOPICS } from '../data/topics'
import { speak, stopSpeaking, isTtsEnabled, setTtsEnabled } from '../utils/tts'
import { getAvatarDataUri } from '../utils/avatar'
import { connectionStore } from '../stores/ConnectionStore'

const RevealBox = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${theme.space.sm};
  padding: ${theme.space.lg};
  background: ${theme.colors.bgCard};
  border-radius: ${theme.radii.md};
  width: 100%;
`

const RevealAvatar = styled.img`
  width: 56px;
  height: 56px;
  border-radius: ${theme.radii.full};
`

const RevealName = styled.span`
  font-size: 1.2rem;
  font-weight: 700;
`

const ScoreChange = styled.span<{ positive: boolean }>`
  font-size: 0.9rem;
  color: ${(p) => (p.positive ? theme.colors.success : theme.colors.textMuted)};
`

const TopicProgress = styled.div`
  color: ${theme.colors.textMuted};
  font-size: 0.8rem;
  text-align: center;
`

const TopicTitle = styled.div`
  font-size: 1.1rem;
  font-weight: 700;
  text-align: center;
  color: ${theme.colors.primaryLight};
`

const TopBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
`

const MuteBtn = styled.button`
  background: ${theme.colors.bgCard};
  border-radius: ${theme.radii.sm};
  padding: ${theme.space.xs} ${theme.space.sm};
  font-size: 1.1rem;
  color: ${theme.colors.textMuted};
  &:hover {
    background: ${theme.colors.bgLight};
  }
`

const ScoreBoard = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.space.xs};
  width: 100%;
`

const ScoreRow = styled.div<{ highlighted?: boolean }>`
  display: flex;
  align-items: center;
  gap: ${theme.space.sm};
  padding: ${theme.space.sm} ${theme.space.md};
  background: ${(p) =>
    p.highlighted ? `${theme.colors.primary}22` : theme.colors.bgCard};
  border-radius: ${theme.radii.sm};
  ${(p) => p.highlighted && `border: 1px solid ${theme.colors.primary}44;`}
`

const ScoreAvatar = styled.img`
  width: 28px;
  height: 28px;
  border-radius: ${theme.radii.full};
`

const ScorePlayerName = styled.span`
  flex: 1;
  font-size: 0.9rem;
  font-weight: 600;
`

const ScoreDelta = styled.span`
  font-size: 0.85rem;
  font-weight: 700;
  color: ${theme.colors.success};
  min-width: 28px;
  text-align: right;
`

const ScoreValues = styled.span`
  font-size: 0.85rem;
  color: ${theme.colors.textMuted};
  min-width: 60px;
  text-align: right;
`

export const PlayPage = observer(function PlayPage() {
  const navigate = useNavigate()
  const {
    phase,
    playState,
    isLeader,
    isHost,
    players,
    currentStory,
    config,
    myPlayerId,
    storiesForCurrentTopic,
    votesForCurrentStory,
  } = gameStore

  const [muted, setMuted] = useState(() => !isTtsEnabled())
  const [typewriterDone, setTypewriterDone] = useState(false)
  // Reveal position — driven by TTS boundaries or fallback timer
  const [revealUpTo, setRevealUpTo] = useState(0)
  const revealRef = useRef(0)
  // Vote timer delay: show "Time to vote!" for 2s before countdown
  const [voteTimerReady, setVoteTimerReady] = useState(false)
  // Stable key for the current story so we know when it changes
  const storyKey = `${playState.currentTopicIndex}-${playState.currentStoryIndex}`
  const prevStoryKey = useRef(storyKey)
  const prevSubPhase = useRef(playState.subPhase)

  // Reset state when story changes
  useEffect(() => {
    if (prevStoryKey.current !== storyKey) {
      prevStoryKey.current = storyKey
      setTypewriterDone(false)
      setRevealUpTo(0)
      revealRef.current = 0
    }
  }, [storyKey])

  // Delay vote timer display by 2s after entering VOTING from READING
  useEffect(() => {
    const wasReading = prevSubPhase.current === 'READING'
    prevSubPhase.current = playState.subPhase

    if (playState.subPhase === 'VOTING') {
      if (wasReading) {
        // Normal transition: show "Time to vote!" for 2s before countdown
        setVoteTimerReady(false)
        const timer = setTimeout(() => setVoteTimerReady(true), 2000)
        return () => clearTimeout(timer)
      } else {
        // Reconnection or already in VOTING: show timer immediately
        setVoteTimerReady(true)
      }
    } else {
      setVoteTimerReady(false)
    }
  }, [playState.subPhase])

  useEffect(() => {
    if (phase === 'RESULTS') navigate('/results')
  }, [phase, navigate])

  // TTS & typewriter reveal — reads the topic first, pauses 1s, then reveals the story
  useEffect(() => {
    if (playState.subPhase !== 'READING' || !currentStory) return

    let cancelled = false
    let pauseTimer: ReturnType<typeof setTimeout> | null = null
    let fallbackInterval: ReturnType<typeof setInterval> | null = null
    let safetyTimeout: ReturnType<typeof setTimeout> | null = null

    const topicId = config.topicIds[playState.currentTopicIndex]
    const topicMeta = TOPICS.find((t) => t.id === topicId)
    const topicText = topicMeta
      ? `Topic ${playState.currentTopicIndex + 1}: ${topicMeta.text}`
      : ''

    const ttsOn = isTtsEnabled() && revealRef.current === 0

    if (ttsOn) {
      // Safety: force-complete reveal if TTS gets stuck (known browser bug)
      // Generous estimate: ~3 chars/sec speech + topic time + pauses + 10s buffer
      const safetyMs = Math.min(
        (topicText.length + currentStory.text.length) * 100 + 5000,
        30000
      )
      safetyTimeout = setTimeout(() => {
        if (!cancelled && currentStory) {
          setRevealUpTo(currentStory.text.length)
        }
      }, safetyMs)

      // TTS enabled: speak topic → pause → speak story with boundary-driven reveal
      speak(topicText, {
        onEnd: () => {
          if (cancelled) return
          pauseTimer = setTimeout(() => {
            if (cancelled || !currentStory) return
            speak(currentStory.text, {
              onBoundary: (charIndex, charLength) => {
                const pos = charIndex + charLength
                if (pos > revealRef.current) {
                  revealRef.current = pos
                  setRevealUpTo(pos)
                }
              },
              onEnd: () => {
                if (currentStory) {
                  revealRef.current = currentStory.text.length
                  setRevealUpTo(currentStory.text.length)
                }
              },
            })
          }, 1000)
        },
      })
    } else {
      // TTS muted: reveal story text with a local timer
      const CHARS_PER_SECOND = 30
      let revealed = revealRef.current
      fallbackInterval = setInterval(() => {
        if (cancelled) return
        revealed += 1
        revealRef.current = revealed
        setRevealUpTo(revealed)
        if (currentStory && revealed >= currentStory.text.length) {
          if (fallbackInterval) {
            clearInterval(fallbackInterval)
            fallbackInterval = null
          }
        }
      }, 1000 / CHARS_PER_SECOND)
    }

    return () => {
      cancelled = true
      if (pauseTimer) clearTimeout(pauseTimer)
      if (fallbackInterval) clearInterval(fallbackInterval)
      if (safetyTimeout) clearTimeout(safetyTimeout)
      stopSpeaking()
    }
  }, [storyKey, muted]) // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-advance from READING → VOTING once typewriter finishes (host only)
  useEffect(() => {
    if (playState.subPhase === 'READING' && typewriterDone && isHost) {
      const timer = setTimeout(() => {
        hostAction({ type: 'NEXT' })
      }, 1500)
      return () => clearTimeout(timer)
    }
  }, [playState.subPhase, typewriterDone, isHost])

  function toggleMute() {
    const newMuted = !muted
    setMuted(newMuted)
    setTtsEnabled(!newMuted)
    if (newMuted) stopSpeaking()
  }

  function dispatch(msg: Parameters<typeof hostAction>[0]) {
    if (isHost) hostAction(msg)
    else sendAction(msg)
  }

  function handleNext() {
    dispatch({ type: 'NEXT' })
  }

  function handleVote(targetPlayerId: string) {
    dispatch({ type: 'CAST_VOTE', targetPlayerId })
  }

  function handleFinalize() {
    dispatch({ type: 'FINALIZE_VOTE' })
  }

  const currentTopicId = config.topicIds[playState.currentTopicIndex]
  const topic = TOPICS.find((t) => t.id === currentTopicId)

  const myVote = currentStory
    ? votesForCurrentStory.find((v) => v.voterId === myPlayerId)
    : undefined

  const myFinalized = playState.finalizedVoters.includes(myPlayerId)

  const timerPaused =
    connectionStore.status !== 'connected' || gameStore.hasUnresolvedDisconnects

  const revealedAuthor = playState.revealedAuthorId
    ? players.find((p) => p.id === playState.revealedAuthorId)
    : undefined

  const nobodyGuessedRight =
    playState.subPhase === 'REVEAL' && currentStory
      ? !votesForCurrentStory.some(
          (v) =>
            v.voterId !== currentStory.authorId &&
            v.targetPlayerId === currentStory.authorId,
        )
      : false

  // Compute score delta for each player based on this story's votes
  function getScoreDelta(playerId: string): number {
    if (!currentStory) return 0
    if (nobodyGuessedRight && playerId === currentStory.authorId) return 3
    if (playerId === currentStory.authorId) return 0
    const vote = votesForCurrentStory.find((v) => v.voterId === playerId)
    if (vote && vote.targetPlayerId === currentStory.authorId) return 2
    return 0
  }

  return (
    <PageWrap>
      <TopBar>
        <TopicProgress>
          Topic {playState.currentTopicIndex + 1} of {config.topicIds.length}
          {' — '}Story {playState.currentStoryIndex + 1}/
          {storiesForCurrentTopic.length}
        </TopicProgress>
        <MuteBtn onClick={toggleMute} title={muted ? 'Unmute' : 'Mute'}>
          {muted ? '\uD83D\uDD07' : '\uD83D\uDD0A'}
        </MuteBtn>
      </TopBar>

      {topic && (
        <TopicTitle>
          {topic.emoji} {topic.text}
        </TopicTitle>
      )}

      {currentStory && (
        <StoryCard
          topicId={currentStory.topicId}
          text={currentStory.text}
          typewriter={playState.subPhase === 'READING'}
          revealUpTo={revealUpTo}
          onTypewriterDone={() => setTypewriterDone(true)}
        />
      )}

      {/* READING — typewriter plays, then auto-advances to VOTING */}
      {playState.subPhase === 'READING' && (
        <>
          {typewriterDone ? (
            <Subtitle>Get ready to vote...</Subtitle>
          ) : (
            <Subtitle>Listen carefully...</Subtitle>
          )}
        </>
      )}

      {/* VOTING */}
      {playState.subPhase === 'VOTING' && (
        <>
          {voteTimerReady ? (
            <Timer
              seconds={
                playState.voteTimerSecondsLeft > 0
                  ? playState.voteTimerSecondsLeft
                  : config.voteTimerSeconds
              }
              running={!timerPaused}
            />
          ) : (
            <Subtitle>Time to vote!</Subtitle>
          )}
          <VotePanel
            players={players}
            myVoteTargetId={myVote?.targetPlayerId ?? null}
            finalized={myFinalized}
            onVote={handleVote}
            onFinalize={handleFinalize}
          />
          {isLeader && (
            <Button onClick={handleNext} variant="ghost">
              Skip to Reveal
            </Button>
          )}
        </>
      )}

      {/* REVEAL */}
      {playState.subPhase === 'REVEAL' && revealedAuthor && (
        <>
          <RevealBox>
            <RevealAvatar
              src={getAvatarDataUri(revealedAuthor.avatarSeed)}
              alt={revealedAuthor.name}
            />
            <RevealName>Written by {revealedAuthor.name}</RevealName>
            {nobodyGuessedRight ? (
              <ScoreChange positive={true}>
                Nobody guessed! {revealedAuthor.name} gets +3
              </ScoreChange>
            ) : (
              <ScoreChange positive={false}>
                {
                  votesForCurrentStory.filter(
                    (v) =>
                      v.voterId !== currentStory?.authorId &&
                      v.targetPlayerId === currentStory?.authorId,
                  ).length
                }{' '}
                correct guess(es) — +2 each
              </ScoreChange>
            )}
          </RevealBox>

          <ScoreBoard>
            {[...players]
              .sort((a, b) => b.score - a.score)
              .map((p) => {
                const delta = getScoreDelta(p.id)
                const prevScore = p.score - delta
                return (
                  <ScoreRow key={p.id} highlighted={delta > 0}>
                    <ScoreAvatar
                      src={getAvatarDataUri(p.avatarSeed)}
                      alt={p.name}
                    />
                    <ScorePlayerName>{p.name}</ScorePlayerName>
                    {delta > 0 && <ScoreDelta>+{delta}</ScoreDelta>}
                    <ScoreValues>
                      {delta > 0 ? `${prevScore} → ${p.score}` : `${p.score}`}
                    </ScoreValues>
                  </ScoreRow>
                )
              })}
          </ScoreBoard>

          {isLeader && <Button onClick={handleNext}>Next</Button>}
        </>
      )}
    </PageWrap>
  )
})
