import { useCallback, useEffect, useRef, useState } from "react";
import { loadExemplarAudio } from "./exemplarAudio";

export type ExemplarAudioState = "idle" | "loading" | "playing" | "paused";

/**
 * Read-aloud of the exemplar text. The audio is fetched only when the student asks for it,
 * and `onListened` is called when the whole text has been played.
 */
export function useExemplarAudio(exemplarSetId: string, onListened: () => void) {
  const [state, setState] = useState<ExemplarAudioState>("idle");
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const stateRef = useRef(state);
  stateRef.current = state;
  const activeRef = useRef(true);
  const onListenedRef = useRef(onListened);
  onListenedRef.current = onListened;

  const stop = useCallback(() => {
    audioRef.current?.pause();
    audioRef.current = null;
    setState("idle");
  }, []);

  useEffect(() => {
    activeRef.current = true;
    return () => {
      activeRef.current = false;
      audioRef.current?.pause();
      audioRef.current = null;
    };
  }, []);

  const toggle = useCallback(async () => {
    const current = audioRef.current;
    if (current && stateRef.current === "playing") {
      current.pause();
      setState("paused");
      return;
    }

    setError(null);
    try {
      if (current && stateRef.current === "paused") {
        await current.play();
        setState("playing");
        return;
      }

      setState("loading");
      const url = await loadExemplarAudio(exemplarSetId);
      if (!activeRef.current) return;
      const audio = new Audio(url);
      audio.addEventListener("ended", () => {
        if (audioRef.current !== audio) return;
        audioRef.current = null;
        setState("idle");
        onListenedRef.current();
      });
      audioRef.current = audio;
      await audio.play();
      if (activeRef.current && audioRef.current === audio) setState("playing");
    } catch (failure) {
      if (!activeRef.current) return;
      audioRef.current = null;
      setState("idle");
      setError(failure instanceof Error && failure.name !== "NotAllowedError" && failure.name !== "NotSupportedError"
        ? failure.message
        : "Uppläsningen kunde inte spelas upp. Försök igen.");
    }
  }, []);

  return { state, error, toggle, stop };
}
