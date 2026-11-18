import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { lessons } from "../data/lessons";
import ChapterExitTicket from "./ChapterExitTicket";

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({
    kind: "on_track",
    feedback: "Du kopplar svaret till kapitlets innehåll.",
  }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  })));
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("chapter exit ticket", () => {
  it("sends a written answer only after the student chooses Svara and advances after feedback", async () => {
    const user = userEvent.setup();
    render(<ChapterExitTicket lesson={lessons[0]} />);

    expect(screen.getByRole("heading", { name: "Textens övergripande delar" })).toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();

    await user.type(screen.getByRole("textbox", { name: "Ditt svar" }), "Tes, argument och avslutning hjälper läsaren.");
    await user.click(screen.getByRole("button", { name: "Svara" }));

    expect(await screen.findByRole("status")).toHaveTextContent("Du kopplar svaret till kapitlets innehåll.");
    const request = JSON.parse(String(vi.mocked(fetch).mock.calls[0][1]?.body)) as {
      question: string;
      answer: string;
      focus: string;
    };
    expect(request).toMatchObject({
      question: lessons[0].exitTicket[0].question,
      answer: "Tes, argument och avslutning hjälper läsaren.",
      focus: lessons[0].exitTicket[0].focus,
    });

    await user.click(screen.getByRole("button", { name: "Nästa fråga" }));
    expect(screen.getByRole("heading", { name: "Kännetecken och struktur" })).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Ditt svar" })).toHaveValue("");
  });
});
