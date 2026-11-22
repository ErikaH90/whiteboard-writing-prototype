import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import EddaFeedback from "./EddaFeedback";

afterEach(cleanup);

describe("Edda's feedback", () => {
  it("marks how developed the answer was in the same three steps as the writing map", () => {
    const { rerender } = render(<EddaFeedback feedback={{ kind: "on_track", level: 1, feedback: "Det stämmer. Vad mer?" }} />);
    expect(screen.getByRole("status").querySelector(".edda-mark")).toHaveClass("is-level-1");
    expect(screen.getByRole("img", { name: "Grundläggande svar" }).querySelectorAll(".is-filled")).toHaveLength(1);
    expect(screen.getByRole("status")).toHaveTextContent("grundläggande");

    rerender(<EddaFeedback feedback={{ kind: "on_track", level: 3, feedback: "Du förklarar och ger skäl. Vad mer?" }} />);
    expect(screen.getByRole("status").querySelector(".edda-mark")).toHaveClass("is-level-3");
    expect(screen.getByRole("img", { name: "Välutvecklat svar" }).querySelectorAll(".is-filled")).toHaveLength(3);
  });

  it("shows no mark when the student needs another try", () => {
    render(<EddaFeedback feedback={{ kind: "retry", feedback: "Vad vill skribenten?" }} />);

    expect(screen.getByRole("status")).toHaveTextContent("Edda");
    expect(screen.getByRole("status").querySelector(".edda-mark")).not.toBeInTheDocument();
  });
});
