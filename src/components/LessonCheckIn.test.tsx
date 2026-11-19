import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { lessons } from "../data/lessons";
import LessonCheckIn from "./LessonCheckIn";

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
    const request = JSON.parse(String(init?.body)) as { mode: string; isCorrect?: boolean };
    const kind = request.mode === "text" || request.isCorrect ? "on_track" : "retry";
    return new Response(JSON.stringify({
      kind,
      feedback: request.mode === "text" ? "Du är inne på rätt spår." : "Precis.",
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }));
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("lesson check-in", () => {
  it("accepts a selected answer and gives feedback", async () => {
    const user = userEvent.setup();
    const lesson = lessons[0];
    render(<LessonCheckIn lesson={lesson} phaseIndex={0} priorEvidence={[]} onEvidence={vi.fn()} />);

    expect(screen.queryByText("Ditt svar skickas till OpenAI när du skickar in det.")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Skoldagen borde börja senare." }));
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Svara" }));

    expect(screen.getByRole("status")).toHaveTextContent("Precis.");
    expect(screen.getByRole("status")).toHaveTextContent("Edda");
    expect(screen.getByRole("status").querySelector(".edda-star")).toBeInTheDocument();
    // A correct answer needs no further button press here.
    expect(screen.queryByRole("button", { name: "Försök igen" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Svara" })).not.toBeInTheDocument();
  });

  it("shows a text field without choices when the student should answer in writing", async () => {
    const user = userEvent.setup();
    const lesson = lessons[0];
    render(<LessonCheckIn lesson={lesson} phaseIndex={2} priorEvidence={[]} onEvidence={vi.fn()} />);

    expect(screen.queryByRole("group", { name: "Välj ett svar" })).not.toBeInTheDocument();
    await user.type(screen.getByLabelText("Ditt svar"), "Tesen visar skribentens ståndpunkt.");
    await user.click(screen.getByRole("button", { name: "Svara" }));
    expect(screen.getByRole("status")).toHaveTextContent("inne på rätt spår");
  });

  it("offers a hint when the student is allowed to use support", async () => {
    const user = userEvent.setup();
    const lesson = lessons[0];
    render(<LessonCheckIn lesson={lesson} phaseIndex={0} priorEvidence={[]} onEvidence={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "Jag behöver en ledtråd" }));
    expect(screen.getByText(lesson.hint)).toBeInTheDocument();
  });

  it("does not offer hints during recall without support", () => {
    render(<LessonCheckIn lesson={lessons[0]} phaseIndex={2} priorEvidence={[]} onEvidence={vi.fn()} />);

    expect(screen.queryByRole("button", { name: "Jag behöver en ledtråd" })).not.toBeInTheDocument();
  });
});
