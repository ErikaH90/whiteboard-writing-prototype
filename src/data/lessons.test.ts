import { describe, expect, it } from "vitest";
import { defaultExemplarSet, lessonModel } from "./exemplars";
import { finalRecallQuestions, lessons, phases } from "./lessons";

const exemplarTexts = defaultExemplarSet.texts;

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

    for (const [index, lesson] of lessons.entries()) {
      const model = lessonModel(lesson, index, defaultExemplarSet);
      expect(model.strong.trim()).not.toBe("");
      expect(model.needsWork.trim()).not.toBe("");
      expect(lesson.model.question.trim()).not.toBe("");
      expect(lesson.hook.trim()).not.toBe("");
      expect(lesson.canDo).toHaveLength(4);
      expect(lesson.canDo.every((skill) => skill.trim() !== "")).toBe(true);
      expect(lesson.learnerGoal).toMatch(/^När du är klar /);
      expect(lesson.skillIds.length).toBeGreaterThan(0);
      expect(lesson.entryCheck.skillIds.length).toBeGreaterThan(0);
      expect(lesson.entryCheck.bridge.trim()).not.toBe("");
      expect(lesson.entryCheck.question.trim()).not.toBe("");
      expect(lesson.entryCheck.supportQuestion?.trim()).not.toBe("");
      expect(lesson.entryCheck.extensionQuestion?.trim()).not.toBe("");
      expect(lesson.foundationSupport.trim()).not.toBe("");
      expect(lesson.foundationExample.trim()).not.toBe("");
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
      if (index < 5) {
        // A short exit ticket: one question on what was learned and one on the student's own text.
        expect(lesson.exitTicket).toHaveLength(2);
        expect(lesson.exitTicket?.map((step) => step.learningProcess)).toEqual([
          "Återkallning · Retrieval practice",
          "Metakognition och självbedömning",
        ]);
      } else {
        expect(lesson.exitTicket).toBeNull();
      }

      for (const checkIn of lesson.checkIns) {
        expect(checkIn.question.trim()).not.toBe("");
        if (checkIn.mode === "choice") {
          expect(checkIn.options).toHaveLength(2);
          expect(checkIn.options.filter((option) => option.correct)).toHaveLength(1);
        } else {
          expect(checkIn).not.toHaveProperty("options");
        }
      }

      for (const step of lesson.exitTicket ?? []) {
        expect(step.title.trim()).not.toBe("");
        expect(step.question.trim()).not.toBe("");
        expect(step.placeholder.trim()).not.toBe("");
        expect(step.focus.trim()).not.toBe("");
      }
    }

    expect(finalRecallQuestions.map((question) => question.skillId)).toEqual([
      "structure",
      "reasoning",
      "cohesion",
      "sentence",
      "language",
    ]);
    expect(finalRecallQuestions.every((question) => question.question.trim() && question.placeholder.trim())).toBe(true);
  });

  it("keeps the first chapter's self-check to what the student has written so far: the introduction", () => {
    const checklist = lessons[0].checklist.join(" ");
    expect(checklist).toMatch(/inledning/);
    expect(checklist).toMatch(/tes/);
    // The conclusion and the paragraphs come in later chapters.
    expect(checklist).not.toMatch(/avslut|stycken/);
  });

  it("asks about each chapter's own writing task in its self-check", () => {
    expect(lessons[1].checklist.join(" ")).toMatch(/argument/);
    expect(lessons[2].checklist.join(" ")).toMatch(/motargument/);
    expect(lessons[2].checklist.join(" ")).toMatch(/sambandsord/);
    expect(lessons[3].checklist.join(" ")).toMatch(/avslutning/);
    expect(lessons[4].checklist.join(" ")).toMatch(/stavning/);
  });

  it("takes Edda's two examples before the writing task word for word from the two exemplar texts", () => {
    const strongText = [exemplarTexts.strong.title, ...exemplarTexts.strong.paragraphs].join(" ");
    const basicText = [exemplarTexts.basic.title, ...exemplarTexts.basic.paragraphs].join(" ");
    // Chapters 1–4: the better example comes from the utmärkt text, the weaker from the okej text.
    for (const [index, lesson] of lessons.slice(0, 4).entries()) {
      const model = lessonModel(lesson, index, defaultExemplarSet);
      for (const sentence of model.strong.match(/[^.!?]+[.!?]/g) ?? []) {
        expect(strongText, lesson.shortTitle).toContain(sentence.trim());
      }
      for (const sentence of model.needsWork.match(/[^.!?]+[.!?]/g) ?? []) {
        expect(basicText, lesson.shortTitle).toContain(sentence.trim());
      }
      expect(lesson.model.question).toMatch(/Klicka på/);
    }
  });
});
