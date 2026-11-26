import { describe, expect, it } from "vitest";
import { exemplarSets, markExemplar, type ExemplarId, type ExemplarSet } from "./exemplars";
import { food } from "./exemplarSets/food";

function count(text: string, quote: string) {
  return text.split(quote).length - 1;
}

function whole(set: ExemplarSet, id: ExemplarId) {
  return [set.texts[id].title, ...set.texts[id].paragraphs].join("\n");
}

const skills = ["structure", "reasoning", "cohesion", "sentence", "language"] as const;

/**
 * Every exemplar set must be built exactly like the first one, part for part: the lesson, the
 * writing map and Edda's way back to a gap all point at parts by their position.
 */
describe.each(exemplarSets.map((set) => [set.id, set] as const))("exemplar set %s", (id, set) => {
  it("is named after its file and keeps away from the questions the students write about", () => {
    expect(["food", "school", "screens", "leisure"]).toContain(id);
    const text = `${whole(set, "strong")} ${whole(set, "basic")}`.toLowerCase();
    // The students' own questions: a later school start, a ban on phones in school, a free leisure activity.
    for (const taken of ["börja senare", "sovmorgon", "mobilförbud", "gratis fritidsaktivitet"]) {
      expect(text, taken).not.toContain(taken);
    }
  });

  it("has two texts with a headline and five paragraphs: introduction, two arguments, counter-argument and conclusion", () => {
    for (const id of ["strong", "basic"] as const) {
      expect(set.texts[id].title.trim()).not.toBe("");
      expect(set.texts[id].paragraphs).toHaveLength(5);
    }
    const words = whole(set, "strong").split(/\s+/).length;
    // About the same length as the first exemplar, so it fits the screen and takes as long to read.
    expect(words).toBeGreaterThan(190);
    expect(words).toBeLessThan(260);
  });

  it("anchors every highlight to exactly one place in its text, without overlaps", () => {
    for (const skill of skills) {
      for (const id of ["strong", "basic"] as const) {
        const highlights = set.focus[skill].highlights[id];
        for (const highlight of highlights) {
          expect(count(whole(set, id), highlight.quote), `${skill}/${id}: ${highlight.quote}`).toBe(1);
        }
        expect(markExemplar(set.texts[id], highlights).legend, `${skill}/${id} overlaps`).toHaveLength(highlights.length);
      }
    }
  });

  it("asks before it shows, and explains afterwards, without giving the answer away", () => {
    for (const skill of skills) {
      for (const part of set.focus[skill].highlights.strong) {
        expect(part.ask?.trim(), `${skill}: ${part.quote}`).toBeTruthy();
        expect(part.ask, `${skill}: ${part.quote}`).toMatch(/[.?]$/);
        expect(part.ask, `${skill}: ${part.quote}`).not.toContain(part.quote);
        expect(part.explain?.trim(), `${skill}: ${part.quote}`).toBeTruthy();
      }
    }
  });

  it("is built like the first set, part for part", () => {
    for (const skill of skills) {
      const mine = set.focus[skill];
      const first = food.focus[skill];
      expect(mine.highlights.strong.map((part) => part.label), skill).toEqual(first.highlights.strong.map((part) => part.label));
      expect(mine.highlights.basic.length, skill).toBe(first.highlights.basic.length);
      expect(mine.flow, skill).toEqual(first.flow);
      expect(mine.boardKeys, skill).toEqual(first.boardKeys);
      expect(mine.boardNote, skill).toBe(first.boardNote);
      expect((mine.comparisons ?? []).map((item) => [item.title, item.simpleLabel, item.developedLabel, item.simpleTag, item.developedTag, item.pairs.length]), skill)
        .toEqual((first.comparisons ?? []).map((item) => [item.title, item.simpleLabel, item.developedLabel, item.simpleTag, item.developedTag, item.pairs.length]));
      expect(mine.highlights.strong.map((part) => part.related?.label ?? null), skill)
        .toEqual(first.highlights.strong.map((part) => part.related?.label ?? null));
    }
    expect(set.models).toHaveLength(5);
  });

  it("compares two examples with parts taken word for word from each", () => {
    const reasoning = set.focus.reasoning.comparisons![0];
    expect(reasoning.developed).toBe(set.texts.strong.paragraphs[0]);
    expect(reasoning.simple).toBe(set.texts.basic.paragraphs[0]);
    for (const skill of skills) {
      for (const comparison of set.focus[skill].comparisons ?? []) {
        for (const pair of comparison.pairs) {
          expect(count(comparison.simple, pair.simple), `${comparison.title}: ${pair.simple}`).toBe(1);
          expect(count(comparison.developed, pair.developed), `${comparison.title}: ${pair.developed}`).toBe(1);
          expect(pair.explain.trim(), pair.label).not.toBe("");
        }
      }
    }
  });

  it("shows the same three sentences before and after linking words are added", () => {
    const comparison = set.focus.cohesion.comparisons![0];
    const words = (line: string) => line.toLowerCase().replace(/[.]/g, "").split(" ").sort().join(" ");
    const before = comparison.simple.split("\n");
    const after = comparison.developed.split("\n").map((line) => line.replace(/^(För det första|För det andra|Dessutom) /, ""));
    expect(before).toHaveLength(3);
    expect(after.map(words)).toEqual(before.map(words));
  });

  it("starts every sentence the same way before the sentence openings are varied", () => {
    const openings = set.focus.sentence.comparisons![1];
    expect(openings.simple.split("\n")).toHaveLength(4);
    expect(openings.simple.split("\n").every((line) => line.startsWith("Jag tycker"))).toBe(true);
    expect(new Set(openings.developed.split("\n").map((line) => line.split(" ")[0])).size).toBe(4);
  });

  it("has an error hunt whose questions point at real errors", () => {
    const hunt = set.focus.language.hunt!;
    const first = food.focus.language.hunt!;
    expect(hunt.segments.map((segment) => segment.label)).toEqual(first.segments.map((segment) => segment.label));
    expect(hunt.questions).toEqual(first.questions);
    expect(hunt.areas).toEqual(first.areas);
    expect(hunt.corrected.trim()).not.toBe("");
    for (const segment of hunt.segments) expect(segment.explain.trim(), segment.text).not.toBe("");
  });

  it("takes Edda's examples before the writing task word for word from the two texts in chapters 1–4", () => {
    for (const [index, pair] of set.models.slice(0, 4).entries()) {
      for (const sentence of pair.strong.match(/[^.!?]+[.!?]/g) ?? []) {
        expect(whole(set, "strong"), `chapter ${index + 1}`).toContain(sentence.trim());
      }
      for (const sentence of pair.needsWork.match(/[^.!?]+[.!?]/g) ?? []) {
        expect(whole(set, "basic"), `chapter ${index + 1}`).toContain(sentence.trim());
      }
    }
    // Chapter 5: the same sentence twice, once with errors in the writing rules.
    expect(set.models[4].needsWork).not.toBe(set.models[4].strong);
  });
});
