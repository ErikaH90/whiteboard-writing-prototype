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

  it("points every text check at parts the whiteboard has walked through", () => {
    for (const [skillId, focus] of Object.entries(exemplarFocus)) {
      // A chapter checks understanding either in the exemplar text or with an error hunt on the board.
      expect(focus.checks.length + (focus.hunt ? 1 : 0), skillId).toBeGreaterThan(0);
      for (const check of focus.checks) {
        expect(check.prompt.trim(), skillId).not.toBe("");
        expect(check.targets.length, check.prompt).toBeGreaterThan(0);
        expect(new Set(check.targets).size, check.prompt).toBe(check.targets.length);
        for (const target of check.targets) {
          expect(focus.highlights.strong[target], check.prompt).toBeDefined();
        }
      }
    }
  });

  it("has an error hunt in the language chapter whose questions point at real errors", () => {
    const hunt = exemplarFocus.language.hunt!;
    expect(hunt.segments.map((segment) => segment.text).join(" ")).toBe(
      "vi måste äta mera grönt för dom sa att kött industri förstör våran miljöö. eftersom köttet skadar klimatet. och dessutom så blir man piggare.",
    );
    expect(hunt.corrected).toMatch(/^Vi måste äta mer grönt, eftersom köttet skadar klimatet\./);
    for (const question of hunt.questions) {
      expect(question.targets.length, question.prompt).toBeGreaterThan(0);
      for (const target of question.targets) {
        expect(hunt.segments[target].label, question.prompt).not.toBe("Inget fel");
      }
    }
    // The parts without errors are clickable too, so the markings do not give the answers away.
    expect(hunt.segments.some((segment) => segment.label === "Inget fel")).toBe(true);
  });

  it("asks the first chapter for thesis, arguments, counter-argument and conclusion", () => {
    const parts = exemplarFocus.structure.highlights.strong;
    expect(exemplarFocus.structure.checks.map((check) => check.targets.map((target) => parts[target].label))).toEqual([
      ["Tes: skribentens ståndpunkt"],
      ["Första argumentet", "Andra argumentet"],
      ["Motargument som skribenten bemöter"],
      ["Avslutning som knyter tillbaka till tesen"],
    ]);
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

  it("compares two examples with parts taken word for word from each", () => {
    const reasoning = exemplarFocus.reasoning.comparisons?.[0];
    // The developed example is the exemplar's own introduction, so the board and the text agree.
    expect(reasoning?.developed).toBe(exemplarTexts.strong.paragraphs[0]);
    expect(reasoning?.simple).toBe(exemplarTexts.basic.paragraphs[0]);

    const all = Object.values(exemplarFocus).flatMap((focus) => focus.comparisons ?? []);
    expect(all.length).toBeGreaterThanOrEqual(5);
    for (const comparison of all) {
      expect(comparison.pairs.length, comparison.title).toBeGreaterThan(0);
      for (const pair of comparison.pairs) {
        expect(countOccurrences(comparison.simple, pair.simple), pair.label).toBe(1);
        expect(countOccurrences(comparison.developed, pair.developed), pair.label).toBe(1);
        expect(pair.explain.trim(), pair.label).not.toBe("");
      }
    }
  });

  it("shows three ways to vary the language in the fourth chapter", () => {
    expect(exemplarFocus.sentence.comparisons?.map((comparison) => comparison.title)).toEqual([
      "Variera ordvalet",
      "Variera meningsstarterna",
      "Blanda korta och långa meningar",
    ]);
    // In the "before" example for sentence openings every sentence starts the same way.
    const openings = exemplarFocus.sentence.comparisons![1];
    expect(openings.simple.split("\n").every((line) => line.startsWith("Jag tycker"))).toBe(true);
    expect(new Set(openings.developed.split("\n").map((line) => line.split(" ")[0])).size).toBe(4);
  });

  it("shows the same three sentences before and after linking words are added", () => {
    const comparison = exemplarFocus.cohesion.comparisons![0];
    const words = (line: string) => line.toLowerCase().replace(/[.]/g, "").split(" ").sort().join(" ");
    const before = comparison.simple.split("\n");
    const after = comparison.developed.split("\n").map((line) => line.replace(/^(För det första|För det andra|Dessutom) /, ""));
    expect(before).toHaveLength(3);
    // Only the linking words and the word order differ.
    expect(after.map(words)).toEqual(before.map(words));
  });

  it("covers the five kinds of linking words with more examples of each", () => {
    const parts = exemplarFocus.cohesion.highlights.strong;
    const labels = parts.map((part) => part.label).join(" | ");
    for (const kind of ["Tillägg", "Orsak", "Konsekvens", "Kontrast", "Struktur"]) {
      expect(labels).toContain(kind);
    }
    const related = parts.flatMap((part) => part.related?.words ?? []);
    for (const word of ["dessutom", "eftersom", "därför", "däremot", "exempelvis"]) {
      expect(related).toContain(word);
    }
  });

  it("names the terms for developed arguments in the second chapter", () => {
    const labels = exemplarFocus.reasoning.highlights.strong.map((part) => part.label).join(" | ");
    for (const term of ["Argument", "Sakargument", "Motargument", "Bemötande", "Pathos", "Triad"]) {
      expect(labels).toContain(term);
    }
  });
});
