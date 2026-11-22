import { useSyncExternalStore } from "react";

/**
 * Edda's voice. Her guidance on the whiteboard is read aloud, and the text is shown only when
 * she has finished speaking, so that the student listens or reads, never both at once.
 *
 * Only the lesson's own authored texts are spoken. Edda's answers to what the student writes
 * are not sent to the speech service.
 */

const audioUrls = new Map<string, Promise<string>>();
const listeners = new Set<() => void>();
let soundOn = true;
// After a failure the voice stays off for the rest of the visit, so the lesson never stalls.
let unavailable = false;
let current: HTMLAudioElement | null = null;

function notify() {
  for (const listener of listeners) listener();
}

/** The voice needs a browser that can play audio; without one the text is simply shown. */
function canPlayAudio(): boolean {
  return typeof window !== "undefined"
    && typeof window.matchMedia === "function"
    && typeof window.Audio === "function";
}

export function isVoiceActive(): boolean {
  return soundOn && !unavailable && canPlayAudio();
}

export function setSoundOn(value: boolean) {
  soundOn = value;
  if (!value) stopSpeaking();
  notify();
}

export function useSoundOn(): boolean {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => soundOn,
  );
}

export function stopSpeaking() {
  current?.pause();
  current = null;
}

async function loadSpeech(text: string): Promise<string> {
  const cached = audioUrls.get(text);
  if (cached) return cached;

  const pending = (async () => {
    const response = await fetch("/api/speech", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    if (!response.ok) throw new Error("speech_unavailable");
    return URL.createObjectURL(await response.blob());
  })();
  audioUrls.set(text, pending);
  pending.catch(() => audioUrls.delete(text));
  return pending;
}

/**
 * Reads the text aloud and resolves when Edda has finished (true when she was heard to the end). Resolves at once, without sound,
 * when the voice is off or cannot be used, so the caller can always show the text afterwards.
 * The returned `cancel` stops her if the text is no longer on the board.
 */
export function speak(text: string): { done: Promise<boolean>; cancel: () => void } {
  let cancelled = false;
  let audio: HTMLAudioElement | null = null;

  // Resolves to true only when Edda was heard to the end: then her words need not be shown again.
  const done = (async () => {
    if (!isVoiceActive()) return false;
    try {
      const url = await loadSpeech(text);
      if (cancelled || !isVoiceActive()) return false;
      stopSpeaking();
      audio = new Audio(url);
      current = audio;
      return await new Promise<boolean>((resolve, reject) => {
        audio!.addEventListener("ended", () => resolve(true));
        // Browsers also report a pause when the sound has reached its end; only a real interruption counts.
        audio!.addEventListener("pause", () => resolve(Boolean(audio!.ended)));
        audio!.addEventListener("error", () => reject(new Error("audio_error")));
        Promise.resolve(audio!.play()).catch(reject);
      });
    } catch (error) {
      // A browser that blocks sound before the first click is not a reason to turn the voice off.
      if (!(error instanceof Error && error.name === "NotAllowedError")) {
        unavailable = true;
        notify();
      }
      return false;
    } finally {
      if (current === audio) current = null;
    }
  })();

  return {
    done,
    cancel: () => {
      cancelled = true;
      audio?.pause();
    },
  };
}

/** Test helper: forget fetched audio and turn the voice back on. */
export function resetVoice() {
  audioUrls.clear();
  soundOn = true;
  unavailable = false;
  current = null;
}
