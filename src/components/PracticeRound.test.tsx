import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { lessons } from "../data/lessons";
import PracticeRound from "./PracticeRound";

const lesson = lessons[2];

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn(async () => new Response(
    JSON.stringify({ kind: "on_track", feedback: "Du visar hur orden binder ihop tankarna.", level: 2 }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  )));
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function renderRound(level: number, props: Partial<Parameters<typeof PracticeRound>[0]> = {}) {
  const handlers = { onEvidence: vi.fn(), onReadAgain: vi.fn(), onBack: vi.fn() };
  render(
    <PracticeRound
      lesson={lesson}
      label="Textbindning"
      level={level}
      hint="Vilket ord kan visa en orsak?"
      priorEvidence={[]}
      hasRevised={false}
      loading={false}
      {...handlers}
      {...props}
    />,
  );
  return handlers;
}

describe("more practice on a part chosen in the writing map", () => {
  it("starts with an example and repetition when the part is not in the student's text yet", async () => {
    const user = userEvent.setup();
    renderRound(0);

    expect(screen.getByText("TRÄNA MER · TEXTBINDNING · 1 AV 3")).toBeVisible();
    expect(screen.getByText(/Vi börjar med ett exempel, och sedan prövar du själv/)).toBeVisible();
    // The example comes first: the student picks the better one.
    expect(screen.getByText(lesson.model.question)).toBeVisible();
    expect(screen.queryByRole("button", { name: "Fortsätt" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: new RegExp(lesson.model.strong.slice(0, 25)) }));
    await user.click(await screen.findByRole("button", { name: "Fortsätt" }));

    // Then the core idea is recalled in the student's own words.
    expect(screen.getByText("TRÄNA MER · TEXTBINDNING · 2 AV 3")).toBeVisible();
    await user.type(screen.getByRole("textbox", { name: "Ditt svar" }), "Orsak och kontrast.");
    await user.click(screen.getByRole("button", { name: "Svara" }));
    await user.click(await screen.findByRole("button", { name: "Fortsätt" }));

    // Last, the student tries it in the own text.
    expect(screen.getByText("Pröva i din egen text")).toBeVisible();
    expect(screen.getByText("Vilket ord kan visa en orsak?")).toBeVisible();
  });

  it("goes straight to the student's own text when the basics are there", async () => {
    const user = userEvent.setup();
    const { onReadAgain, onBack } = renderRound(2, { hasRevised: true });

    expect(screen.getByText("TRÄNA MER · TEXTBINDNING")).toBeVisible();
    expect(screen.getByText("Du har grunden. Pröva direkt i din egen text.")).toBeVisible();
    expect(screen.queryByText(lesson.model.question)).not.toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Jag har prövat – låt Edda titta igen" }));
    expect(onReadAgain).toHaveBeenCalledTimes(1);
    await user.click(screen.getByRole("button", { name: "Tillbaka till skrivkartan" }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it("repeats the core idea first when the part is only begun, and waits for the student to revise", () => {
    renderRound(1);

    expect(screen.getByText("TRÄNA MER · TEXTBINDNING · 1 AV 2")).toBeVisible();
    expect(screen.getByRole("textbox", { name: "Ditt svar" })).toBeVisible();
    cleanup();
    renderRound(3);
    // Edda reads again only when the student has changed the text.
    expect(screen.getByRole("button", { name: "Jag har prövat – låt Edda titta igen" })).toBeDisabled();
  });
});
