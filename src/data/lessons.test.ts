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
      expect(lesson.checkIns).toHaveLength(phases.length - 1);
      expect(lesson.checkIns.map((checkIn) => checkIn.mode)).toEqual([
        "choice",
        "choice",
        "text",
        "choice",
      ]);
      expect(lesson.exitTicket).toHaveLength(5);
      expect(lesson.exitTicket.map((step) => step.learningProcess)).toEqual([
        "Återkallning · Retrieval practice",
        "Tillämpning · Interleaving",
        "Självförklaring · Self-explanation",
        "Metakognition och självbedömning",
        expect.stringMatching(/^Framåtkoppling · /),
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

      for (const step of lesson.exitTicket) {
        expect(step.title.trim()).not.toBe("");
        expect(step.question.trim()).not.toBe("");
        expect(step.placeholder.trim()).not.toBe("");
        expect(step.focus.trim()).not.toBe("");
      }
    }
  });
});
