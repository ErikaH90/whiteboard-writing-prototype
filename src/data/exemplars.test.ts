import { describe, expect, it } from "vitest";
import { exemplarFocus, exemplarTexts, markExemplar, type ExemplarId } from "./exemplars";

function countOccurrences(text: string, quote: string) {
  return text.split(quote).length - 1;
}

describe("exemplar highlights", () => {
  it("anchors every highlight to exactly one place in its exemplar", () => {
    for (const [skillId, focus] of Object.entries(exemplarFocus)) {
      for (const exemplarId of Object.keys(focus.highlights) as ExemplarId[]) {
        const text = exemplarTexts[exemplarId];
        const whole = [text.title, ...text.paragraphs].join("\n");
        const highlights = focus.highlights[exemplarId];
        expect(highlights.length, `${skillId}/${exemplarId}`).toBeGreaterThan(0);

        for (const highlight of highlights) {
          expect(countOccurrences(whole, highlight.quote), `${skillId}/${exemplarId}: ${highlight.quote}`).toBe(1);
        }

        if (exemplarId === "strong") {
          // Every part the whiteboard walks through needs a think-aloud explanation.
          for (const highlight of highlights) {
            expect(highlight.explain?.trim(), `${skillId}: ${highlight.quote}`).toBeTruthy();
          }
        }

        const marked = markExemplar(text, highlights);
        expect(marked.legend, `${skillId}/${exemplarId} overlaps`).toHaveLength(highlights.length);
      }
    }
  });

  it("points every text check at one of the parts the whiteboard has walked through", () => {
    for (const [skillId, focus] of Object.entries(exemplarFocus)) {
      expect(focus.check.prompt.trim(), skillId).not.toBe("");
      expect(focus.highlights.strong[focus.check.target], skillId).toBeDefined();
    }
  });

  it("keeps the exemplar wording unchanged when marks are added", () => {
    const text = exemplarTexts.strong;
    const marked = markExemplar(text, exemplarFocus.structure.highlights.strong);

    expect(marked.blocks.map((block) => block.segments.map((segment) => segment.text).join(""))).toEqual([
      text.title,
      ...text.paragraphs,
    ]);
    expect(marked.legend.map((item) => item.number)).toEqual([1, 2, 3, 4, 5, 6]);
  });
});
