import { useRef } from 'react'
import { useLocalObservable, useReaction } from '../utils/mobx'
import { speak, stopSpeaking, isTtsEnabled, setTtsEnabled } from '../utils/tts'
import { TOPICS } from '../data/topics'
import { hostAction } from '../engine/HostEngine'
import { gameStore } from '../stores/GameStore'

export function useStoryReveal() {
  const local = useLocalObservable(() => ({
    muted: !isTtsEnabled(),
    typewriterDone: false,
    revealUpTo: 0,
  }))

  const revealRef = useRef(0)
  const storyKey = `${gameStore.playState.currentTopicIndex}-${gameStore.playState.currentStoryIndex}`
  const prevStoryKey = useRef(storyKey)

  // Reset on story change
  useReaction(
    () => storyKey,
    (key) => {
      if (prevStoryKey.current !== key) {
        prevStoryKey.current = key
        local.typewriterDone = false
        local.revealUpTo = 0
        revealRef.current = 0
      }
    },
  )

  // TTS & typewriter reveal — reads the topic first, pauses 1s, then reveals the story
  useReaction(
    () => ({
      subPhase: gameStore.playState.subPhase,
      story: gameStore.currentStory,
      muted: local.muted,
      storyKey,
    }),
    ({ subPhase, story }) => {
      if (subPhase !== 'READING' || !story) return

      let cancelled = false
      let pauseTimer: ReturnType<typeof setTimeout> | null = null
      let fallbackInterval: ReturnType<typeof setInterval> | null = null
      let safetyTimeout: ReturnType<typeof setTimeout> | null = null

      const topicIndex = gameStore.playState.currentTopicIndex
      const topicId = gameStore.config.topicIds[topicIndex]
      const topicMeta = TOPICS.find((t) => t.id === topicId)
      const topicText = topicMeta
        ? `Topic ${topicIndex + 1}: ${topicMeta.text}`
        : ''

      const ttsOn = isTtsEnabled() && revealRef.current === 0

      if (ttsOn) {
        // Safety: force-complete reveal if TTS gets stuck (known browser bug)
        // Estimate: ~3 chars/sec speech + topic time + pauses + buffer, capped at 15s
        const safetyMs = Math.min(
          (topicText.length + story.text.length) * 100 + 5000,
          15000
        )
        safetyTimeout = setTimeout(() => {
          if (!cancelled && story) {
            revealRef.current = story.text.length
            local.revealUpTo = story.text.length
          }
        }, safetyMs)

        // TTS enabled: speak topic → pause → speak story with boundary-driven reveal
        speak(topicText, {
          onEnd: () => {
            if (cancelled) return
            pauseTimer = setTimeout(() => {
              if (cancelled || !story) return
              speak(story.text, {
                onBoundary: (charIndex, charLength) => {
                  const pos = charIndex + charLength
                  if (pos > revealRef.current) {
                    revealRef.current = pos
                    local.revealUpTo = pos
                  }
                },
                onEnd: () => {
                  if (story) {
                    revealRef.current = story.text.length
                    local.revealUpTo = story.text.length
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
          local.revealUpTo = revealed
          if (story && revealed >= story.text.length) {
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
    },
  )

  // Safety net: if revealUpTo reached the end but typewriterDone wasn't set
  // (e.g., StoryCard callback didn't fire), force it after a short delay
  useReaction(
    () => ({
      subPhase: gameStore.playState.subPhase,
      done: local.typewriterDone,
      revealed: local.revealUpTo,
      storyLen: gameStore.currentStory?.text.length ?? 0,
    }),
    ({ subPhase, done, revealed, storyLen }) => {
      if (subPhase === 'READING' && !done && revealed >= storyLen && storyLen > 0) {
        const timer = setTimeout(() => {
          local.typewriterDone = true
        }, 500)
        return () => clearTimeout(timer)
      }
    },
  )

  // Auto-advance from READING → VOTING once typewriter finishes (host only)
  useReaction(
    () => ({
      subPhase: gameStore.playState.subPhase,
      done: local.typewriterDone,
      isHost: gameStore.isHost,
    }),
    ({ subPhase, done, isHost }) => {
      if (subPhase === 'READING' && done && isHost) {
        const timer = setTimeout(() => {
          hostAction({ type: 'NEXT' })
        }, 1500)
        return () => clearTimeout(timer)
      }
    },
  )

  function toggleMute() {
    local.muted = !local.muted
    setTtsEnabled(!local.muted)
    if (local.muted) stopSpeaking()
  }

  return {
    muted: local.muted,
    toggleMute,
    typewriterDone: local.typewriterDone,
    setTypewriterDone: (v: boolean) => {
      local.typewriterDone = v
    },
    revealUpTo: local.revealUpTo,
  }
}
