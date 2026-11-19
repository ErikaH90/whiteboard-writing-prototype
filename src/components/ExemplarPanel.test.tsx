import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import ExemplarPanel from "./ExemplarPanel";

afterEach(() => {
  cleanup();
});

describe("exemplar panel", () => {
  it("shows only the text while the student listens", () => {
    render(<ExemplarPanel skillId="structure" mode="listen" />);

    expect(screen.getByRole("heading", { name: /Tallrikens tysta offer/ })).toBeInTheDocument();
    expect(document.querySelector("mark")).not.toBeInTheDocument();
    // The listen button lives on the whiteboard, not on the writing surface.
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("lights up one part at a time in step with the whiteboard and blurs the rest", () => {
    const view = render(<ExemplarPanel skillId="cohesion" mode="focus" focusIndex={2} />);

    let marks = [...document.querySelectorAll("mark")];
    expect(marks).toHaveLength(1);
    expect(marks[0].firstChild?.textContent).toBe("vilket i sin tur");
    expect(marks[0]).toHaveClass("is-focus");
    expect(screen.getByRole("article")).toHaveClass("is-focusing");
    // The lesson is silent and has no list of all marks.
    expect(screen.queryByRole("button", { name: /Lyssna/ })).not.toBeInTheDocument();
    expect(screen.queryByText("Det gulmarkerade visar")).not.toBeInTheDocument();

    view.rerender(<ExemplarPanel skillId="cohesion" mode="focus" focusIndex={5} />);
    marks = [...document.querySelectorAll("mark")];
    expect(marks.map((mark) => mark.firstChild?.textContent)).toEqual(["Sammanfattningsvis"]);
  });

  it("shows all marks with numbered explanations in the recap", () => {
    render(<ExemplarPanel skillId="cohesion" mode="recap" />);

    const marks = [...document.querySelectorAll("mark")];
    expect(marks.map((mark) => mark.firstChild?.textContent)).toContain("Sammanfattningsvis");
    expect(screen.getByText("Det gulmarkerade visar")).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(marks.length);
    expect(screen.getByRole("button", { name: "Okej text" })).toBeInTheDocument();
  });
});
