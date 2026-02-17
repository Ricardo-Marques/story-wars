import { useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { observer } from 'mobx-react-lite'
import { useLocalObservable, useReaction } from '../utils/mobx'
import { Button, PageWrap, Subtitle } from '../components/Button'
import { StoryCard } from '../components/StoryCard'
import { VotePanel } from '../components/VotePanel'
import { Timer } from '../components/Timer'
import { gameStore } from '../stores/GameStore'
import { hostAction } from '../engine/HostEngine'
import { sendAction } from '../engine/ClientEngine'
import { TOPICS } from '../data/topics'
import { getAvatarDataUri } from '../utils/avatar'
import { connectionStore } from '../stores/ConnectionStore'
import { useStoryReveal } from '../hooks/useStoryReveal'
import { LeaveGameButton } from '../components/LeaveGameButton'
import {
  RevealBox,
  RevealAvatar,
  RevealName,
  ScoreChange,
  TopicProgress,
  TopicTitle,
  TopBar,
  MuteBtn,
  ScoreBoard,
  ScoreRow,
  ScoreAvatar,
  ScorePlayerName,
  ScoreDelta,
  ScoreValues,
} from './PlayPage.styles'

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

  const { muted, toggleMute, typewriterDone, setTypewriterDone, revealUpTo } =
    useStoryReveal()

  // Vote timer delay: show "Time to vote!" for 2s before countdown
  const local = useLocalObservable(() => ({
    voteTimerReady: false,
  }))

  const prevSubPhase = useRef(playState.subPhase)

  // Delay vote timer display by 2s after entering VOTING from READING
  useReaction(
    () => playState.subPhase,
    (subPhase) => {
      const wasReading = prevSubPhase.current === 'READING'
      prevSubPhase.current = subPhase

      if (subPhase === 'VOTING') {
        if (wasReading) {
          // Normal transition: show "Time to vote!" for 2s before countdown
          local.voteTimerReady = false
          const timer = setTimeout(() => {
            local.voteTimerReady = true
          }, 2000)
          return () => clearTimeout(timer)
        } else {
          // Reconnection or already in VOTING: show timer immediately
          local.voteTimerReady = true
        }
      } else {
        local.voteTimerReady = false
      }
    },
  )

  useReaction(
    () => phase,
    (p) => {
      if (p === 'RESULTS') navigate('/results')
    },
  )

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
          {local.voteTimerReady ? (
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
          {!isLeader && (
            <Subtitle style={{ fontSize: '0.85rem', opacity: 0.7 }}>
              Waiting for the leader to continue...
            </Subtitle>
          )}
        </>
      )}

      <LeaveGameButton />
    </PageWrap>
  )
})
