import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { defaultExemplarSet } from "../data/exemplars";
import { lessons } from "../data/lessons";
import ErrorHunt from "./ErrorHunt";

const exemplarFocus = defaultExemplarSet.focus;

const hunt = exemplarFocus.language.hunt!;
const lesson = lessons[4];

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
    const request = JSON.parse(String(init?.body)) as { isCorrect?: boolean };
    return new Response(JSON.stringify(request.isCorrect
      ? { kind: "on_track", level: 2, feedback: "Du hittade felet. Hur vet du det?" }
      : { kind: "retry", feedback: "Inte riktigt. Titta en gång till." }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }));
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("error hunt on the whiteboard", () => {
  it("lets the student click the errors one kind at a time and then shows the corrected text", async () => {
    const user = userEvent.setup();
    const onDone = vi.fn();
    const onEvidence = vi.fn();
    render(<ErrorHunt lesson={lesson} hunt={hunt} priorEvidence={[]} onEvidence={onEvidence} onDone={onDone} />);
    const text = screen.getByRole("group", { name: "Elevens text" });
    const parts = () => within(text).getAllByRole("button");

    // Every part of the text can be clicked, also the ones without errors.
    expect(parts().map((part) => part.textContent)).toEqual(hunt.segments.map((segment) => segment.text));
    expect(parts().every((part) => !(part as HTMLButtonElement).disabled)).toBe(true);
    expect(screen.getByText(hunt.questions[0].prompt)).toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();

    // A wrong part gives a nudge, no star and no explanation.
    await user.click(parts()[1]);
    expect(await screen.findByRole("status")).toHaveTextContent("Inte riktigt.");
    expect(screen.queryByRole("button", { name: "Nästa fel" })).not.toBeInTheDocument();

    await user.click(parts()[0]);
    expect((await screen.findByRole("status")).querySelector(".edda-mark")).toBeInTheDocument();
    expect(parts()[0]).toHaveClass("is-found");
    expect(screen.getByText(hunt.segments[0].explain)).toBeInTheDocument();
    expect(onEvidence).toHaveBeenLastCalledWith(lesson.skillIds, "supported");

    // Two places are spoken language: both have to be found before Edda answers.
    await user.click(screen.getByRole("button", { name: "Nästa fel" }));
    expect(screen.getByText(hunt.questions[1].prompt)).toBeInTheDocument();
    const requests = vi.mocked(fetch).mock.calls.length;
    await user.click(parts()[hunt.questions[1].targets[0]]);
    expect(fetch).toHaveBeenCalledTimes(requests);
    expect(screen.getByRole("status")).toHaveTextContent("1 av 2 hittade.");
    await user.click(parts()[hunt.questions[1].targets[1]]);
    expect(fetch).toHaveBeenCalledTimes(requests + 1);
    await screen.findByText("Du hittade felet. Hur vet du det?");

    for (let index = 2; index < hunt.questions.length; index += 1) {
      await user.click(screen.getByRole("button", { name: "Nästa fel" }));
      await user.click(parts()[hunt.questions[index].targets[0]]);
      await screen.findByText("Du hittade felet. Hur vet du det?");
    }
    expect(onDone).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Visa rättad text" }));
    expect(onDone).toHaveBeenCalledOnce();
    expect(screen.getByText(hunt.corrected)).toBeInTheDocument();
    expect(screen.getByText(hunt.areas[0].fix)).toBeInTheDocument();
    expect(parts().every((part) => (part as HTMLButtonElement).disabled)).toBe(true);
    expect(text.querySelectorAll(".is-found")).toHaveLength(new Set(hunt.questions.flatMap((question) => question.targets)).size);
  });

  it("lets the student move on after two tries or when the service fails", async () => {
    const user = userEvent.setup();
    render(<ErrorHunt lesson={lesson} hunt={hunt} priorEvidence={[]} onEvidence={vi.fn()} />);
    const parts = () => within(screen.getByRole("group", { name: "Elevens text" })).getAllByRole("button");

    await user.click(parts()[1]);
    await screen.findByText("Inte riktigt. Titta en gång till.");
    expect(screen.queryByRole("button", { name: "Nästa fel" })).not.toBeInTheDocument();
    await user.click(parts()[8]);
    expect(await screen.findByRole("button", { name: "Nästa fel" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Nästa fel" }));
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ error: "AI-tjänsten är inte tillgänglig." }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    })));
    await user.click(parts()[1]);
    expect(await screen.findByRole("alert")).toHaveTextContent("AI-tjänsten är inte tillgänglig.");
    expect(screen.getByRole("button", { name: "Nästa fel" })).toBeInTheDocument();
  });
});
