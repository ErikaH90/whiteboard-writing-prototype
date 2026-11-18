import { describe, expect, it } from "vitest";
import {
  emptyLearnerProfile,
  parseLearnerProfile,
  recordEvidence,
  recordDifficulty,
  readLearnerProfile,
  writeLearnerProfile,
} from "./learnerProfile";

describe("learner profile", () => {
  it("keeps a cumulative per-skill summary without storing prior answers", () => {
    const profile = recordEvidence(
      recordEvidence(emptyLearnerProfile, ["reasoning"], "needs_support"),
      ["reasoning"],
      "independent",
    );

    expect(profile.evidence.reasoning).toEqual({
      latest: "independent",
      observations: 2,
      independent: 1,
      supported: 0,
      needsSupport: 1,
    });
    expect(JSON.stringify(profile)).not.toContain("answer");
  });

  it("rejects malformed or unsupported profile data", () => {
    expect(parseLearnerProfile({ version: 2, interest: null, evidence: {} })).toBeNull();
    expect(parseLearnerProfile({
      version: 1,
      interest: "unknown",
      evidence: {
        structure: {
          latest: "independent",
          observations: 3,
          independent: 1,
          supported: 1,
          needsSupport: 0,
        },
      },
    })).toBeNull();
  });

  it("keeps a voluntary task-difficulty self-report separate from knowledge evidence", () => {
    const profile = recordDifficulty(emptyLearnerProfile, ["structure"], "too_hard");
    expect(profile.evidence).toEqual({});
    expect(profile.difficulty).toEqual({ structure: "too_hard" });
  });

  it("surfaces storage failures instead of pretending the profile was saved", () => {
    expect(readLearnerProfile({ getItem: () => { throw new Error("blocked"); } }).error).toBe(true);
    expect(writeLearnerProfile({ setItem: () => { throw new Error("blocked"); } }, emptyLearnerProfile)).toBe(false);
  });
});
