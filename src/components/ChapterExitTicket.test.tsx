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
    render(
      <ChapterExitTicket
        lesson={lessons[0]}
        exitTicket={lessons[0].exitTicket ?? []}
        priorEvidence={[]}
        onEvidence={vi.fn()}
      />,
    );

    expect(screen.getByRole("heading", { name: "Textens övergripande delar" })).toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();
    expect(screen.queryByText("Ditt svar skickas till OpenAI när du skickar in det.")).not.toBeInTheDocument();

    await user.type(screen.getByRole("textbox", { name: "Ditt svar" }), "Tes, argument och avslutning hjälper läsaren.");
    await user.click(screen.getByRole("button", { name: "Svara" }));

    expect(await screen.findByRole("status")).toHaveTextContent("Du kopplar svaret till kapitlets innehåll.");
    // An answer on the right track is rewarded with Edda's star.
    // Without a level the star is the small one: a big star has to be earned with a developed answer.
    expect(screen.getByRole("status").querySelector(".edda-star.is-earned.is-level-1")).toBeInTheDocument();
    const request = JSON.parse(String(vi.mocked(fetch).mock.calls[0][1]?.body)) as {
      question: string;
      answer: string;
      focus: string;
    };
    expect(request).toMatchObject({
      question: lessons[0].exitTicket?.[0].question,
      answer: "Tes, argument och avslutning hjälper läsaren.",
      focus: lessons[0].exitTicket?.[0].focus,
    });

    await user.click(screen.getByRole("button", { name: "Nästa fråga" }));
    expect(screen.getByRole("heading", { name: "Bedöm din inledning" })).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Ditt svar" })).toHaveValue("");
  });

  it("ends by showing what the student can do now and how the first answer compares with the latest", async () => {
    const user = userEvent.setup();
    const lesson = lessons[0];
    render(
      <ChapterExitTicket
        lesson={lesson}
        exitTicket={(lesson.exitTicket ?? []).slice(0, 1)}
        priorEvidence={[]}
        onEvidence={vi.fn()}
        achievements={[lesson.canDo[0], lesson.canDo[2]]}
        firstAnswer="En text med åsikter."
      />,
    );

    await user.type(screen.getByRole("textbox", { name: "Ditt svar" }), "Tes, argument, motargument och avslutning.");
    await user.click(screen.getByRole("button", { name: "Svara" }));
    await user.click(await screen.findByRole("button", { name: "Avsluta exit ticket" }));

    const done = screen.getByRole("region", { name: "Exit ticket klar" });
    expect(done).toHaveTextContent("Det här kan du nu");
    expect(done).toHaveTextContent(lesson.learnerGoal);
    expect(screen.getAllByRole("listitem").map((item) => item.textContent)).toEqual([lesson.canDo[0], lesson.canDo[2]]);
    expect(done.querySelectorAll(".can-do-list .edda-star")).toHaveLength(2);
    const growth = screen.getByRole("group", { name: "Din utveckling under lektionen" });
    expect(growth).toHaveTextContent("När du började");
    expect(growth).toHaveTextContent("En text med åsikter.");
    expect(growth).toHaveTextContent("Tes, argument, motargument och avslutning.");
  });
});
