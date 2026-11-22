export type MapPlace = { start: number; end: number };

export type BuiltMapPart = {
  skill: string;
  level: 0 | 1 | 2 | 3;
  start?: number;
  end?: number;
  quote?: string;
  strength: string;
  next: string;
  found: { id: string; quote: string }[];
};

export const mapSkillIds: string[];
export const mapFeatures: Record<string, { id: string; by: "rule" | "model" | "issue"; praise: string; hint: string }[]>;
export function readText(draft: string): unknown;
export function readByRule(draft: string, skill: string, text?: unknown): Record<string, MapPlace | null>;
export function modelFeatures(skill: string): { id: string; look: string; pair: boolean }[];
export function buildPart(draft: string, skill: string, places: Record<string, MapPlace | null>, text?: unknown): BuiltMapPart;
