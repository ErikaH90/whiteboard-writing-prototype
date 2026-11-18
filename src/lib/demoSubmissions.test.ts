import { describe, expect, it } from "vitest";
import { clearDemoSubmissions, demoSubmissionsKey, readDemoSubmissions, saveDemoSubmission } from "./demoSubmissions";

function memoryStorage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value); },
    removeItem: (key: string) => { values.delete(key); },
  };
}

describe("local demo diagnosis handoff", () => {
  it("stores only an explicitly submitted diagnosis and reads it for the local teacher view", () => {
    const storage = memoryStorage();
    const result = saveDemoSubmission(
      storage,
      "Syntetisk diagnosetext.",
      "En övningsfråga",
      null,
      "demo-1",
      "2026-01-01T10:00:00.000Z",
    );

    expect(result.error).toBe(false);
    expect(readDemoSubmissions(storage).submissions).toEqual([result.submission]);
  });

  it("reports invalid stored data and can clear the demo inbox", () => {
    const storage = memoryStorage();
    storage.setItem(demoSubmissionsKey, "not-json");
    expect(readDemoSubmissions(storage).error).toBe(true);
    expect(clearDemoSubmissions(storage)).toBe(true);
    expect(readDemoSubmissions(storage).submissions).toEqual([]);
  });
});
