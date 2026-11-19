import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { lessons } from "../data/lessons";
import LessonEntryCheck from "./LessonEntryCheck";

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({
    kind: "on_track",
    feedback: "Du kopplar tesen till läsaren. Kan du ge ett exempel?",
  }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  })));
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

// Each lesson opens with an attention line and the goal before the entry question is asked.
async function openEntryQuestion(user: ReturnType<typeof userEvent.setup>) {
  while (!screen.queryByRole("textbox", { name: "Ditt svar, utan ledtråd" })) {
    await user.click(screen.getByRole("button", { name: "Fortsätt" }));
  }
}

describe("lesson entry check", () => {
  it("adapts the retrieval question to session evidence and sends only after submission", async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();
    const onEvidence = vi.fn();
    render(
      <LessonEntryCheck
        lesson={lessons[1]}
        learningEvidence={{ structure: "independent" }}
        priorEvidence={[{
          skillId: "structure",
          evidence: "independent",
          observations: 1,
          independent: 1,
          supported: 0,
          needsSupport: 0,
        }]}
        onEvidence={onEvidence}
        onComplete={onComplete}
      />,
    );

    // The lesson opens with an attention line, then the goal, and only then the retrieval question.
    expect(screen.getByText(lessons[1].hook)).toBeVisible();
    expect(screen.queryByText(lessons[1].learnerGoal)).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Fortsätt" }));
    expect(screen.getByText(lessons[1].learnerGoal)).toBeVisible();
    expect(screen.getByText(lessons[1].goal)).toBeVisible();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Fortsätt" }));
    expect(screen.getByText(lessons[1].entryCheck.extensionQuestion)).toBeVisible();
    expect(fetch).not.toHaveBeenCalled();
    await openEntryQuestion(user);
    await user.type(screen.getByRole("textbox", { name: "Ditt svar, utan ledtråd" }), "Tesen visar ståndpunkten.");
    await user.click(screen.getByRole("button", { name: "Svara" }));

    expect(await screen.findByRole("status")).toHaveTextContent("Du kopplar tesen");
    const request = JSON.parse(String(vi.mocked(fetch).mock.calls[0][1]?.body)) as {
      question: string;
      learningContext: {
        priorEvidence: {
          skillId: string;
          evidence: string;
          observations: number;
          independent: number;
          supported: number;
          needsSupport: number;
        }[];
      };
    };
    expect(request.question).toBe(lessons[1].entryCheck.extensionQuestion);
    expect(request.learningContext.priorEvidence).toEqual([{
      skillId: "structure",
      evidence: "independent",
      observations: 1,
      independent: 1,
      supported: 0,
      needsSupport: 0,
    }]);
    expect(onEvidence).toHaveBeenCalledWith(["structure"], "independent");
    expect(screen.queryByText(/Koppling till momentet/)).not.toBeInTheDocument();
    expect(screen.queryByRole("group", { name: "Hur kändes frågan?" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Börja momentet" }));
    expect(onComplete).toHaveBeenCalledOnce();
  });

  it("offers a small reviewed example after an unsuccessful attempt", async () => {
    const user = userEvent.setup();
    vi.stubGlobal("fetch", vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ kind: "retry", feedback: "Vad visar en tes?" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ kind: "retry", feedback: "Vilket skäl stöder tesen?" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })));
    render(
      <LessonEntryCheck
        lesson={lessons[0]}
        learningEvidence={{}}
        priorEvidence={[]}
        onEvidence={vi.fn()}
        onComplete={vi.fn()}
      />,
    );

    await openEntryQuestion(user);

    await user.type(screen.getByRole("textbox", { name: "Ditt svar, utan ledtråd" }), "En berättelse.");
    await user.click(screen.getByRole("button", { name: "Svara" }));
    expect(await screen.findByText(lessons[0].foundationSupport)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Försök igen" }));
    await openEntryQuestion(user);
    await user.type(screen.getByRole("textbox", { name: "Ditt svar, utan ledtråd" }), "En ståndpunkt med skäl.");
    await user.click(screen.getByRole("button", { name: "Svara igen" }));
    await user.click(await screen.findByRole("button", { name: "Visa ett exempel" }));
    expect(screen.getByText(lessons[0].foundationExample)).toBeInTheDocument();
  });

  it("allows an explicit move to modeling when the AI service fails without recording evidence", async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();
    const onEvidence = vi.fn();
    vi.stubGlobal("fetch", vi.fn(async () => new Response(
      JSON.stringify({ error: "AI-tjänsten är inte tillgänglig." }),
      { status: 503, headers: { "Content-Type": "application/json" } },
    )));
    render(
      <LessonEntryCheck
        lesson={lessons[0]}
        learningEvidence={{}}
        priorEvidence={[]}
        onEvidence={onEvidence}
        onComplete={onComplete}
      />,
    );

    await openEntryQuestion(user);

    await user.type(screen.getByRole("textbox", { name: "Ditt svar, utan ledtråd" }), "En ståndpunkt.");
    await user.click(screen.getByRole("button", { name: "Svara" }));
    expect(await screen.findByRole("alert")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Fortsätt utan AI-återkoppling" }));

    expect(onComplete).toHaveBeenCalledOnce();
    expect(onEvidence).not.toHaveBeenCalled();
  });
});
