import type { Express } from "express";

export function createApiApp(options?: {
  client?: unknown;
  /** Creates read-aloud audio for a fixed exemplar text. `null` disables read-aloud. */
  speech?: ((text: string) => Promise<Buffer>) | null;
}): Express;
