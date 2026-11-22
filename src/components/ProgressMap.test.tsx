import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { MapPart, MapSkill } from "../lib/coachApi";
import ProgressMap from "./ProgressMap";

afterEach(cleanup);

const all: MapSkill[] = ["structure", "reasoning", "cohesion", "sentence", "language"];

function part(skill: MapSkill, level: MapPart["level"]): MapPart {
  return level === 0
    ? { skill, level, strength: "", next: "Vad kan du börja med?" }
    : { skill, level, start: 0, end: 9, quote: "Skoldagen", strength: "Du visar vad du tycker.", next: level === 3 ? "" : "Vad leder det till?" };
}

function renderMap(props: Partial<Parameters<typeof ProgressMap>[0]> = {}) {
  const handlers = { onSelect: vi.fn(), onAssess: vi.fn() };
  render(
    <ProgressMap
      taught={["structure", "reasoning"]}
      parts={null}
      selected={null}
      loading={false}
      error={null}
      isEmpty={false}
      isOutdated={false}
      {...handlers}
      {...props}
    />,
  );
  return handlers;
}

describe("the student's writing map", () => {
  it("is drawn only when the student asks Edda to read the text", async () => {
    const user = userEvent.setup();
    const { onAssess } = renderMap();

    expect(screen.queryByRole("group", { name: "Din skrivkarta" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Visa min skrivkarta" }));
    expect(onAssess).toHaveBeenCalledTimes(1);
  });

  it("asks the student to write first when there is no text to read", () => {
    renderMap({ isEmpty: true });

    expect(screen.getByRole("button", { name: "Visa min skrivkarta" })).toBeDisabled();
    expect(screen.getByRole("status")).toHaveTextContent("Skriv i din text till höger först.");
  });

  it("shows each part's level, lets the student choose a part and shows Edda's evidence for it", async () => {
    const user = userEvent.setup();
    const { onSelect } = renderMap({
      parts: [part("structure", 3), part("reasoning", 1)],
      selected: "reasoning",
    });

    const wheel = screen.getByRole("group", { name: "Din skrivkarta" });
    expect(within(wheel).getByRole("button", { name: "Struktur: välutvecklad" })).toHaveClass("is-ready");
    const reasoning = within(wheel).getByRole("button", { name: "Resonemang: grundläggande" });
    expect(reasoning).toHaveAttribute("aria-pressed", "true");
    expect(reasoning).not.toHaveClass("is-ready");
    expect(reasoning.querySelectorAll(".map-ring.is-filled")).toHaveLength(1);
    // Parts Edda has not gone through yet are not judged and cannot be chosen.
    expect(within(wheel).getByRole("button", { name: "Språk: kommer senare" })).toHaveAttribute("aria-disabled", "true");
    expect(within(wheel).getByRole("img", { name: "Redo för slutdiagnos: inte än" })).toBeInTheDocument();

    const detail = screen.getByText("Edda · Resonemang: grundläggande").closest(".map-detail") as HTMLElement;
    expect(detail).toHaveTextContent("Du visar vad du tycker.");
    expect(detail).toHaveTextContent("Skoldagen");
    expect(detail).toHaveTextContent("Att pröva för nästa steg");
    expect(detail).toHaveTextContent("Vad leder det till?");
    expect(screen.getByText(/inte ett betyg/)).toBeInTheDocument();

    await user.click(within(wheel).getByRole("button", { name: "Struktur: välutvecklad" }));
    expect(onSelect).toHaveBeenCalledWith("structure");
    await user.click(within(wheel).getByRole("button", { name: "Språk: kommer senare" }));
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it("turns Redo för slutdiagnos green when every part is at least developed", () => {
    renderMap({ taught: all, parts: all.map((skill, index) => part(skill, index % 2 ? 2 : 3)) });

    expect(screen.getByRole("img", { name: "Redo för slutdiagnos" })).toHaveClass("is-ready");
    expect(screen.getByText("Alla delar är gröna. Du är redo för slutdiagnosen.")).toBeInTheDocument();
  });

  it("is not ready while a part is only basic or missing, and offers a new reading after changes", async () => {
    const user = userEvent.setup();
    const { onAssess } = renderMap({
      taught: all,
      parts: [part("structure", 3), part("reasoning", 2), part("cohesion", 1), part("sentence", 0), part("language", 2)],
      selected: "sentence",
      isOutdated: true,
    });

    expect(screen.getByRole("img", { name: "Redo för slutdiagnos: inte än" })).not.toHaveClass("is-ready");
    expect(screen.getByText("Den här delen syns inte i din text än.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Jag har ändrat i min text – låt Edda titta igen" }));
    expect(onAssess).toHaveBeenCalledTimes(1);
  });
});
