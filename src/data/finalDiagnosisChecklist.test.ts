import { describe, expect, it } from "vitest";
import { finalDiagnosisChecklist } from "./finalDiagnosisChecklist";

describe("final diagnosis self-checklist", () => {
  it("keeps all requested sections and checklist items as separate statements", () => {
    expect(finalDiagnosisChecklist.map((section) => section.title)).toEqual([
      "1. Struktur & Innehåll",
      "2. Utveckla resonemang & Argumentation",
      "3. Språk, Stil & Textbindning",
      "4. Språkriktighet & Korrektur",
    ]);
    expect(finalDiagnosisChecklist.map((section) => section.items.length)).toEqual([7, 8, 7, 6]);
    expect(finalDiagnosisChecklist.flatMap((section) => section.items).every((item) => item.startsWith("Jag "))).toBe(true);
  });
});
