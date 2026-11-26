const audioUrls = new Map<string, Promise<string>>();

/**
 * Fetches the read-aloud audio for an exemplar text. Only the id of the exemplar set is sent;
 * the server reads the fixed course text aloud. The result is reused within the session.
 */
export function loadExemplarAudio(exemplarId: string): Promise<string> {
  const cached = audioUrls.get(exemplarId);
  if (cached) return cached;

  const pending = (async () => {
    const response = await fetch("/api/exemplar-audio", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ exemplarId }),
    });

    if (!response.ok) {
      const body = await response.json().catch(() => null) as { error?: unknown } | null;
      throw new Error(typeof body?.error === "string" ? body.error : "Uppläsningen kunde inte hämtas. Försök igen.");
    }

    return URL.createObjectURL(await response.blob());
  })();

  audioUrls.set(exemplarId, pending);
  pending.catch(() => audioUrls.delete(exemplarId));
  return pending;
}

/** Test helper: forget audio that was fetched earlier. */
export function clearExemplarAudioCache() {
  audioUrls.clear();
}
