import type { LearningEvidence, SkillId } from "../data/lessons";

export const learnerProfileKey = "skrivcoach-demo-learner-profile-v1";

export const interestOptions = [
  { value: "animals", label: "Djur och natur" },
  { value: "sports", label: "Idrott" },
  { value: "music", label: "Musik" },
  { value: "technology", label: "Teknik och spel" },
  { value: "community", label: "Vardagsliv och samhälle" },
] as const;

export type InterestId = (typeof interestOptions)[number]["value"];
export type DifficultyRating = "too_easy" | "about_right" | "too_hard";
export type SkillEvidenceRecord = {
  latest: LearningEvidence;
  observations: number;
  independent: number;
  supported: number;
  needsSupport: number;
};
export type EvidenceSummary = { skillId: SkillId } & SkillEvidenceRecord & { selfReport: DifficultyRating | null };

export type LearnerProfile = {
  version: 1;
  interest: InterestId | null;
  difficulty: Partial<Record<SkillId, DifficultyRating>>;
  evidence: Partial<Record<SkillId, SkillEvidenceRecord>>;
};

export const emptyLearnerProfile: LearnerProfile = {
  version: 1,
  interest: null,
  difficulty: {},
  evidence: {},
};

const skillIds: SkillId[] = ["structure", "reasoning", "cohesion", "sentence", "language"];
const statuses: LearningEvidence[] = ["independent", "supported", "needs_support"];
const interestIds = interestOptions.map((option) => option.value);
const difficultyRatings: DifficultyRating[] = ["too_easy", "about_right", "too_hard"];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isCount(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
}

export function parseLearnerProfile(value: unknown): LearnerProfile | null {
  if (!isRecord(value) || value.version !== 1 || !isRecord(value.evidence)) return null;

  if (
    value.interest !== undefined &&
    value.interest !== null &&
    !interestIds.includes(value.interest as InterestId)
  ) return null;
  if (value.difficulty !== undefined && !isRecord(value.difficulty)) return null;

  const interest = (value.interest ?? null) as InterestId | null;
  const evidence: LearnerProfile["evidence"] = {};
  const difficulty: LearnerProfile["difficulty"] = {};

  if (value.difficulty !== undefined) {
    for (const skillId of skillIds) {
      if (value.difficulty[skillId] !== undefined) {
        if (!difficultyRatings.includes(value.difficulty[skillId] as DifficultyRating)) return null;
        difficulty[skillId] = value.difficulty[skillId] as DifficultyRating;
      }
    }
  }

  for (const skillId of skillIds) {
    const item = value.evidence[skillId];
    if (item === undefined) continue;
    if (!isRecord(item)) return null;
    if (
      statuses.includes(item.latest as LearningEvidence) &&
      isCount(item.observations) &&
      isCount(item.independent) &&
      isCount(item.supported) &&
      isCount(item.needsSupport) &&
      item.observations === item.independent + item.supported + item.needsSupport
    ) {
      evidence[skillId] = {
        latest: item.latest as LearningEvidence,
        observations: item.observations,
        independent: item.independent,
        supported: item.supported,
        needsSupport: item.needsSupport,
      };
    } else return null;
  }

  return { version: 1, interest, difficulty, evidence };
}

export function recordEvidence(
  profile: LearnerProfile,
  skillIdsToUpdate: SkillId[],
  result: LearningEvidence,
): LearnerProfile {
  const evidence = { ...profile.evidence };
  for (const skillId of skillIdsToUpdate) {
    const previous = evidence[skillId] ?? {
      latest: result,
      observations: 0,
      independent: 0,
      supported: 0,
      needsSupport: 0,
    };
    const hasCapacity = previous.observations < 1_000;
    evidence[skillId] = {
      latest: result,
      observations: previous.observations + Number(hasCapacity),
      independent: previous.independent + Number(hasCapacity && result === "independent"),
      supported: previous.supported + Number(hasCapacity && result === "supported"),
      needsSupport: previous.needsSupport + Number(hasCapacity && result === "needs_support"),
    };
  }
  return { ...profile, evidence };
}

export function getLatestEvidence(profile: LearnerProfile): Partial<Record<SkillId, LearningEvidence>> {
  const result: Partial<Record<SkillId, LearningEvidence>> = {};
  for (const skillId of skillIds) {
    const record = profile.evidence[skillId];
    if (record) result[skillId] = record.latest;
  }
  return result;
}

export function getEvidenceSummaries(profile: LearnerProfile): EvidenceSummary[] {
  return skillIds.flatMap((skillId) => {
    const record = profile.evidence[skillId];
    return record ? [{ skillId, ...record, selfReport: profile.difficulty[skillId] ?? null }] : [];
  });
}

export function recordDifficulty(
  profile: LearnerProfile,
  skillIdsToUpdate: SkillId[],
  rating: DifficultyRating,
): LearnerProfile {
  const difficulty = { ...profile.difficulty };
  for (const skillId of skillIdsToUpdate) difficulty[skillId] = rating;
  return { ...profile, difficulty };
}

export function readLearnerProfile(storage: Pick<Storage, "getItem">): { profile: LearnerProfile; error: boolean } {
  try {
    const saved = storage.getItem(learnerProfileKey);
    if (!saved) return { profile: emptyLearnerProfile, error: false };
    const profile = parseLearnerProfile(JSON.parse(saved));
    return profile
      ? { profile, error: false }
      : { profile: emptyLearnerProfile, error: true };
  } catch {
    return { profile: emptyLearnerProfile, error: true };
  }
}

export function writeLearnerProfile(storage: Pick<Storage, "setItem">, profile: LearnerProfile): boolean {
  try {
    storage.setItem(learnerProfileKey, JSON.stringify(profile));
    return true;
  } catch {
    return false;
  }
}

export function clearLearnerProfile(storage: Pick<Storage, "removeItem">): boolean {
  try {
    storage.removeItem(learnerProfileKey);
    return true;
  } catch {
    return false;
  }
}
