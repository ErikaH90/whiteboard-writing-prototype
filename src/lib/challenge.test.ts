import { describe, expect, it } from "vitest";
import { challengeFor, evidenceValue, noteSignal, nudge, startMastery, taskAt, type Mastery } from "./challenge";
import { lessons } from "../data/lessons";
import { emptyLearnerProfile, parseLearnerProfile, recordEvidence, recordInterest, recordNextTask } from "./learnerProfile";

describe("the level of the next task", () => {
  it("starts at the chapter's own task", () => {
    expect(challengeFor({}, ["structure"])).toBe(2);
    expect(taskAt(2, "kärna", { support: "stöd", extension: "utmaning" })).toBe("kärna");
  });

  it("moves step by step, so that one answer never decides the level alone", () => {
    let mastery: Mastery = {};
    mastery = noteSignal(mastery, ["reasoning"], evidenceValue.needs_support);
    expect(challengeFor(mastery, ["reasoning"])).toBe(2);
    mastery = noteSignal(mastery, ["reasoning"], evidenceValue.needs_support);
    mastery = noteSignal(mastery, ["reasoning"], evidenceValue.needs_support);
    // Repeated need of support gives a smaller step, with more to hold on to.
    expect(challengeFor(mastery, ["reasoning"])).toBe(1);
    expect(taskAt(1, "kärna", { support: "stöd", extension: "utmaning" })).toBe("stöd");
    // Other parts of the writing are not touched.
    expect(mastery.structure).toBeUndefined();
  });

  it("stretches the student who manages alone, and comes back down when it gets too hard", () => {
    let mastery: Mastery = {};
    for (let answer = 0; answer < 3; answer += 1) mastery = noteSignal(mastery, ["cohesion"], evidenceValue.independent);
    expect(challengeFor(mastery, ["cohesion"])).toBe(3);
    for (let answer = 0; answer < 3; answer += 1) mastery = noteSignal(mastery, ["cohesion"], evidenceValue.needs_support);
    expect(challengeFor(mastery, ["cohesion"])).toBeLessThan(3);
  });

  it("follows Edda's own judgement of the next task", () => {
    const harder = nudge(nudge({}, ["sentence"], "harder"), ["sentence"], "harder");
    expect(harder.sentence).toBeGreaterThan(startMastery);
    expect(challengeFor(harder, ["sentence"])).toBe(3);
    expect(nudge({}, ["sentence"], "same")).toEqual({});
    const easier = nudge(nudge({}, ["sentence"], "easier"), ["sentence"], "easier");
    expect(challengeFor(easier, ["sentence"])).toBe(1);
  });

  it("uses the chapter's own task when a chapter has no other levels", () => {
    expect(taskAt(1, "kärna")).toBe("kärna");
    expect(taskAt(3, "kärna")).toBe("kärna");
  });
});

describe("the learner profile behind the levels", () => {
  it("keeps the estimate with the evidence, and the interest of the chosen topic", () => {
    let profile = recordEvidence(emptyLearnerProfile, ["structure"], "independent");
    profile = recordNextTask(profile, ["structure"], "harder");
    profile = recordInterest(profile, "technology");
    expect(profile.mastery?.structure).toBeGreaterThan(startMastery);
    expect(profile.interest).toBe("technology");

    const saved = parseLearnerProfile(JSON.parse(JSON.stringify(profile)));
    expect(saved).toEqual(profile);
  });

  it("starts the estimate over when a saved value cannot be used", () => {
    const saved = parseLearnerProfile({ version: 1, interest: null, difficulty: {}, evidence: {}, mastery: { structure: 7, cohesion: "hög" } });
    expect(saved?.mastery).toEqual({});
  });
});

describe("tasks in three levels", () => {
  it("gives every teaching chapter a smaller and a further step for the writing task and the recall question", () => {
    for (const lesson of lessons.slice(0, 5)) {
      const tasks = [lesson.practiceLevels!.support, lesson.practice, lesson.practiceLevels!.extension];
      expect(new Set(tasks).size, lesson.shortTitle).toBe(3);
      const questions = [lesson.recallLevels!.support.question, lesson.checkIns[2].question, lesson.recallLevels!.extension.question];
      expect(new Set(questions).size, lesson.shortTitle).toBe(3);
      // Recall without support is always in the student's own words, at every level.
      expect(lesson.recallLevels!.support.mode).toBe("text");
      expect(lesson.recallLevels!.extension.mode).toBe("text");
    }
  });
});
