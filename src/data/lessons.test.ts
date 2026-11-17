import { describe, expect, it } from "vitest";
import { lessons, phases } from "./lessons";

describe("lesson progression", () => {
  it("defines the five required learning phases in order", () => {
    expect(phases).toEqual([
      "Modellering",
      "Träna själv",
      "Återkalla utan stöd",
      "Självkontroll",
      "Slutbedömning",
    ]);
  });

  it("provides the learning material needed at every phase for all six lessons", () => {
    expect(lessons).toHaveLength(6);

    for (const lesson of lessons) {
      expect(lesson.model.strong.trim()).not.toBe("");
      expect(lesson.model.needsWork.trim()).not.toBe("");
      expect(lesson.model.question.trim()).not.toBe("");
      expect(lesson.practice.trim()).not.toBe("");
      expect(lesson.recall.trim()).not.toBe("");
      expect(lesson.checklist.length).toBeGreaterThan(0);
      expect(lesson.criteria.length).toBeGreaterThan(0);
      expect(lesson.checkIns).toHaveLength(phases.length);
      expect(lesson.checkIns.map((checkIn) => checkIn.mode)).toEqual([
        "choice",
        "choice",
        "text",
        "choice",
        "choice",
      ]);

      for (const checkIn of lesson.checkIns) {
        expect(checkIn.question.trim()).not.toBe("");
        if (checkIn.mode === "choice") {
          expect(checkIn.options).toHaveLength(2);
          expect(checkIn.options.filter((option) => option.correct)).toHaveLength(1);
        } else {
          expect(checkIn).not.toHaveProperty("options");
        }
      }
    }
  });
});
