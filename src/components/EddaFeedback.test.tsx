import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import EddaFeedback from "./EddaFeedback";

afterEach(cleanup);

describe("Edda's feedback", () => {
  it("gives a star whose size follows how developed the answer was", () => {
    const { rerender } = render(<EddaFeedback feedback={{ kind: "on_track", level: 1, feedback: "Det stämmer. Vad mer?" }} />);
    expect(screen.getByRole("status").querySelector(".edda-star")).toHaveClass("is-level-1");

    rerender(<EddaFeedback feedback={{ kind: "on_track", level: 3, feedback: "Du förklarar och ger skäl. Vad mer?" }} />);
    expect(screen.getByRole("status").querySelector(".edda-star")).toHaveClass("is-level-3");
  });

  it("gives no star when the student needs another try", () => {
    render(<EddaFeedback feedback={{ kind: "retry", feedback: "Vad vill skribenten?" }} />);

    expect(screen.getByRole("status")).toHaveTextContent("Edda");
    expect(screen.getByRole("status").querySelector(".edda-star")).not.toBeInTheDocument();
  });
});
