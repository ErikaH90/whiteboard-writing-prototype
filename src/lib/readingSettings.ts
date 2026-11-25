import { useSyncExternalStore, type CSSProperties } from "react";

/**
 * The student's own reading settings for the writing surface: text size, spacing, paper colour
 * and a reading ruler. They only change how the text looks, never the text itself, and are
 * remembered in this browser.
 */

export type ReadingSettings = {
  size: 0 | 1 | 2;
  lineSpacing: 0 | 1 | 2;
  letterSpacing: 0 | 1;
  paper: "white" | "cream" | "blue" | "green";
  ruler: boolean;
};

export const defaultReadingSettings: ReadingSettings = {
  size: 0,
  lineSpacing: 0,
  letterSpacing: 0,
  paper: "white",
  ruler: false,
};

/** The yellow marks must stay clear on every paper, so there is no yellow paper. */
export const papers: { id: ReadingSettings["paper"]; label: string; color: string }[] = [
  { id: "white", label: "Vit", color: "#ffffff" },
  { id: "cream", label: "Gräddvit", color: "#fbf5e6" },
  { id: "blue", label: "Ljusblå", color: "#eaf2fb" },
  { id: "green", label: "Ljusgrön", color: "#ebf5ea" },
];

const sizeScale = [1, 1.2, 1.4];
const lineAdd = [0, 0.35, 0.7];

const storageKey = "skrivcoach.readingSettings";
const listeners = new Set<() => void>();
let settings: ReadingSettings = load();

function load(): ReadingSettings {
  try {
    const stored: unknown = JSON.parse(window.localStorage.getItem(storageKey) ?? "null");
    if (!stored || typeof stored !== "object") return defaultReadingSettings;
    const value = stored as Record<string, unknown>;
    return {
      size: value.size === 1 || value.size === 2 ? value.size : 0,
      lineSpacing: value.lineSpacing === 1 || value.lineSpacing === 2 ? value.lineSpacing : 0,
      letterSpacing: value.letterSpacing === 1 ? 1 : 0,
      paper: papers.some((paper) => paper.id === value.paper) ? value.paper as ReadingSettings["paper"] : "white",
      ruler: value.ruler === true,
    };
  } catch {
    return defaultReadingSettings;
  }
}

export function setReadingSettings(change: Partial<ReadingSettings>) {
  settings = { ...settings, ...change };
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(settings));
  } catch {
    // Without storage the settings still apply for this visit.
  }
  for (const listener of listeners) listener();
}

export function resetReadingSettings() {
  setReadingSettings(defaultReadingSettings);
}

export function useReadingSettings(): ReadingSettings {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => settings,
  );
}

/** True when the text takes more room than the lesson's own layout was made for. */
export function takesMoreRoom(value: ReadingSettings): boolean {
  return value.size > 0 || value.lineSpacing > 0 || value.letterSpacing > 0;
}

export function isChanged(value: ReadingSettings): boolean {
  return takesMoreRoom(value) || value.paper !== "white" || value.ruler;
}

/** The height of the reading ruler: a little more than one line of the student's text. */
export function rulerHeight(value: ReadingSettings): number {
  return Math.round(18 * sizeScale[value.size] * (1.7 + lineAdd[value.lineSpacing]) * 1.25);
}

/** CSS variables read by the stylesheet (see "Reading settings" in styles.css). */
export function readingStyle(value: ReadingSettings): CSSProperties {
  const style: Record<string, string> = {};
  if (value.size > 0) style["--read-size"] = String(sizeScale[value.size]);
  if (value.lineSpacing > 0) style["--read-line-add"] = String(lineAdd[value.lineSpacing]);
  if (value.letterSpacing > 0) {
    style["--read-letter"] = "0.06em";
    style["--read-word"] = "0.2em";
  }
  if (value.paper !== "white") style["--read-paper"] = papers.find((paper) => paper.id === value.paper)!.color;
  return style as CSSProperties;
}

/** Test helper. */
export function forgetReadingSettings() {
  settings = defaultReadingSettings;
  try {
    window.localStorage.removeItem(storageKey);
  } catch {
    // Nothing to forget.
  }
  for (const listener of listeners) listener();
}
