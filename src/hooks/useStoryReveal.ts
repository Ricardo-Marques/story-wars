import { useState, useEffect, useRef } from 'react'
import { speak, stopSpeaking, isTtsEnabled, setTtsEnabled } from '../utils/tts'
import { TOPICS } from '../data/topics'
import { hostAction } from '../engine/HostEngine'
import type { Story, GameConfig, PlaySubPhase } from '../types/game'

interface UseStoryRevealArgs {
  subPhase: PlaySubPhase
  currentStory: Story | undefined
  storyKey: string
  topicIndex: number
  config: GameConfig
  isHost: boolean
}

export function useStoryReveal({
  subPhase,
  currentStory,
  storyKey,
  topicIndex,
  config,
  isHost,
}: UseStoryRevealArgs) {
  const [muted, setMuted] = useState(() => !isTtsEnabled())
  const [typewriterDone, setTypewriterDone] = useState(false)
  // Reveal position — driven by TTS boundaries or fallback timer
  const [revealUpTo, setRevealUpTo] = useState(0)
  const revealRef = useRef(0)
  const prevStoryKey = useRef(storyKey)

  // Reset state when story changes
  useEffect(() => {
    if (prevStoryKey.current !== storyKey) {
      prevStoryKey.current = storyKey
      setTypewriterDone(false)
      setRevealUpTo(0)
      revealRef.current = 0
    }
  }, [storyKey])

  // TTS & typewriter reveal — reads the topic first, pauses 1s, then reveals the story
  useEffect(() => {
    if (subPhase !== 'READING' || !currentStory) return

    let cancelled = false
    let pauseTimer: ReturnType<typeof setTimeout> | null = null
    let fallbackInterval: ReturnType<typeof setInterval> | null = null
    let safetyTimeout: ReturnType<typeof setTimeout> | null = null

    const topicId = config.topicIds[topicIndex]
    const topicMeta = TOPICS.find((t) => t.id === topicId)
    const topicText = topicMeta
      ? `Topic ${topicIndex + 1}: ${topicMeta.text}`
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
    if (subPhase === 'READING' && typewriterDone && isHost) {
      const timer = setTimeout(() => {
        hostAction({ type: 'NEXT' })
      }, 1500)
      return () => clearTimeout(timer)
    }
  }, [subPhase, typewriterDone, isHost])

  function toggleMute() {
    const newMuted = !muted
    setMuted(newMuted)
    setTtsEnabled(!newMuted)
    if (newMuted) stopSpeaking()
  }

  return {
    muted,
    toggleMute,
    typewriterDone,
    setTypewriterDone,
    revealUpTo,
  }
}
