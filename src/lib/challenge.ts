import type { LearningEvidence, SkillId } from "../data/lessons";

/**
 * How demanding the next task should be for this student in one part of the writing: 1 = a smaller
 * step with more to hold on to, 2 = the chapter's own task, 3 = a step further. It is a guess about
 * the next task, kept just above what the student manages alone. It is never a grade and never a
 * label on the student, and it is not shown.
 */
export type Challenge = 1 | 2 | 3;

/** How far the student seems to have come in each part, from 0 to 1. Starts in the middle. */
export type Mastery = Partial<Record<SkillId, number>>;

export const startMastery = 0.55;

/** What one observation says about how far the student has come. */
export const evidenceValue: Record<LearningEvidence, number> = {
  independent: 0.9,
  supported: 0.5,
  needs_support: 0.15,
};

function clamp(value: number) {
  return Math.min(1, Math.max(0, value));
}

/**
 * Moves the estimate a part of the way towards a new observation, so that one answer never decides
 * the level alone, and the latest answers count more than old ones.
 */
export function noteSignal(mastery: Mastery, skillIds: SkillId[], value: number, weight = 0.35): Mastery {
  const next = { ...mastery };
  for (const skillId of skillIds) {
    const before = next[skillId] ?? startMastery;
    next[skillId] = clamp(before + weight * (clamp(value) - before));
  }
  return next;
}

/** Edda's own judgement after an answer: should the next task be easier, as it is, or harder? */
export type NextTask = "easier" | "same" | "harder";

export function nudge(mastery: Mastery, skillIds: SkillId[], next: NextTask): Mastery {
  if (next === "same") return mastery;
  const result = { ...mastery };
  for (const skillId of skillIds) {
    result[skillId] = clamp((result[skillId] ?? startMastery) + (next === "harder" ? 0.12 : -0.12));
  }
  return result;
}

/** The level of the next task in these parts: just above what the student has shown. */
export function challengeFor(mastery: Mastery, skillIds: SkillId[]): Challenge {
  if (skillIds.length === 0) return 2;
  const mean = skillIds.reduce((sum, skillId) => sum + (mastery[skillId] ?? startMastery), 0) / skillIds.length;
  return mean < 0.4 ? 1 : mean < 0.72 ? 2 : 3;
}

/** Picks the task for a level: the chapter's own task when there is no other for that level. */
export function taskAt<T>(level: Challenge, core: T, levels?: { support: T; extension: T }): T {
  if (!levels) return core;
  return level === 1 ? levels.support : level === 3 ? levels.extension : core;
}
