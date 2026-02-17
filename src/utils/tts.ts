const TTS_KEY = 'storywars-tts-enabled';

export function isTtsEnabled(): boolean {
  return localStorage.getItem(TTS_KEY) !== 'false';
}

export function setTtsEnabled(enabled: boolean): void {
  localStorage.setItem(TTS_KEY, String(enabled));
}

export interface TtsCallbacks {
  onBoundary?: (charIndex: number, charLength: number) => void;
  onEnd?: () => void;
}

export function speak(text: string, callbacks?: TtsCallbacks): void {
  if (!window.speechSynthesis) {
    callbacks?.onEnd?.();
    return;
  }
  window.speechSynthesis.cancel();

  if (!isTtsEnabled()) {
    callbacks?.onEnd?.();
    return;
  }

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.95;
  utterance.pitch = 1;

  if (callbacks?.onBoundary) {
    utterance.addEventListener('boundary', (e) => {
      callbacks.onBoundary!(e.charIndex, e.charLength);
    });
  }

  if (callbacks?.onEnd) {
    utterance.addEventListener('end', callbacks.onEnd);
    utterance.addEventListener('error', callbacks.onEnd);
  }

  window.speechSynthesis.speak(utterance);
}

export function stopSpeaking(): void {
  window.speechSynthesis?.cancel();
}
