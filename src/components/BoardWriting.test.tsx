import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { resetVoice } from "../lib/eddaVoice";
import { AfterWriting, BoardPause, BoardSequence, BoardStep, Written } from "./BoardWriting";

function allowMotion() {
  vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: false })));
}

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("board writing", () => {
  it("renders plain text outside a sequence", () => {
    render(<p><Written byHand>Hela texten</Written></p>);

    expect(screen.getByText("Hela texten").tagName).toBe("P");
  });

  it("writes the text gradually while the full text stays available to assistive technology", () => {
    allowMotion();
    vi.useFakeTimers();
    const onComplete = vi.fn();
    render(
      <BoardSequence onComplete={onComplete}>
        <BoardStep>
          <p><Written byHand>Första raden</Written></p>
          <p><Written byHand>Andra raden</Written></p>
          <AfterWriting><button type="button">Svara</button></AfterWriting>
        </BoardStep>
      </BoardSequence>,
    );

    const first = screen.getByText("Första raden");
    expect(first).toHaveClass("board-ink-full");
    const visible = first.parentElement?.querySelector("[aria-hidden='true']");
    expect(visible?.firstChild?.textContent).toBe("F");
    expect(screen.getByText("Andra raden")).toHaveClass("is-pending");
    expect(screen.queryByRole("button", { name: "Svara" })).not.toBeInTheDocument();

    act(() => { vi.advanceTimersByTime(30); });
    act(() => { vi.advanceTimersByTime(30); });
    expect(visible?.firstChild?.textContent?.length).toBeGreaterThan(1);
    expect(visible?.firstChild?.textContent?.length).toBeLessThan("Första raden".length);
    expect(onComplete).not.toHaveBeenCalled();

    // Each written character schedules the next one after React has rendered it.
    for (let tick = 0; tick < 60; tick += 1) {
      act(() => { vi.advanceTimersByTime(300); });
    }
    expect(screen.getByText("Första raden")).toHaveClass("board-ink");
    expect(screen.getByText("Andra raden")).not.toHaveClass("is-pending");
    expect(screen.getByRole("button", { name: "Svara" })).toBeInTheDocument();
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it("offers no way to skip the writing: the board decides when the text is shown", () => {
    allowMotion();
    render(
      <BoardSequence>
        <BoardStep pause>
          <p><Written byHand>En lång mening som tar tid att skriva för hand på tavlan.</Written></p>
        </BoardStep>
        <BoardStep><p><Written byHand>Nästa del.</Written></p></BoardStep>
      </BoardSequence>,
    );

    expect(document.querySelector(".is-writing")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("waits for the student at pauses and between steps, also without motion", async () => {
    const user = userEvent.setup();
    render(
      <BoardSequence>
        <BoardStep pause>
          <p><Written byHand>Exempel ett</Written></p>
          <BoardPause />
          <p><Written byHand>Exempel två</Written></p>
        </BoardStep>
        <BoardStep>
          <p><Written byHand>Frågan</Written></p>
        </BoardStep>
      </BoardSequence>,
    );

    expect(screen.getByText("Exempel ett")).not.toHaveClass("is-pending");
    expect(screen.getByText("Exempel två")).toHaveClass("is-pending");
    expect(screen.queryByText("Frågan")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Fortsätt" }));
    expect(screen.getByText("Exempel två")).not.toHaveClass("is-pending");
    expect(screen.queryByText("Frågan")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Fortsätt" }));
    expect(screen.getByText("Frågan")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Fortsätt" })).not.toBeInTheDocument();
  });

  it("shows everything at once when the step has already been seen", () => {
    allowMotion();
    render(
      <BoardSequence instant>
        <BoardStep pause><p><Written byHand>Del ett</Written></p></BoardStep>
        <BoardStep><p><Written byHand>Del två</Written></p></BoardStep>
      </BoardSequence>,
    );

    expect(screen.getByText("Del ett")).not.toHaveClass("is-pending");
    expect(screen.getByText("Del två")).not.toHaveClass("is-pending");
    expect(screen.queryByRole("button", { name: "Fortsätt" })).not.toBeInTheDocument();
  });

  it("shows one part at a time and only moves forward", async () => {
    const user = userEvent.setup();
    render(
      <BoardSequence>
        <BoardStep pause><p><Written byHand>Del ett</Written></p></BoardStep>
        <BoardStep><p><Written byHand>Del två</Written></p></BoardStep>
      </BoardSequence>,
    );

    expect(screen.getByText("Del ett")).toBeVisible();

    await user.click(screen.getByRole("button", { name: "Fortsätt" }));
    expect(screen.getByText("Del ett")).not.toBeVisible();
    expect(screen.getByText("Del två")).toBeVisible();
    // The board has no button for going back to an earlier part.
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("lets Edda say her guidance first and shows the text when she has finished", async () => {
    class FakeAudio extends EventTarget {
      static instances: FakeAudio[] = [];
      play = vi.fn(async () => undefined);
      pause = vi.fn();

      constructor(public src: string) {
        super();
        FakeAudio.instances.push(this);
      }
    }
    resetVoice();
    allowMotion();
    vi.stubGlobal("Audio", FakeAudio);
    vi.stubGlobal("URL", Object.assign(URL, { createObjectURL: vi.fn(() => "blob:edda") }));
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) => new Response("ljud", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    render(
      <BoardSequence>
        <BoardStep pause>
          <p><Written spoken>Här står tesen.</Written></p>
          <AfterWriting><button type="button">Svara</button></AfterWriting>
        </BoardStep>
        <BoardStep><p><Written>Nästa del.</Written></p></BoardStep>
      </BoardSequence>,
    );

    // While she speaks only her bubble is shown; the text is not visible and nothing can be pressed.
    await waitFor(() => expect(FakeAudio.instances).toHaveLength(1));
    expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body))).toEqual({ text: "Här står tesen." });
    expect(screen.getByText("Edda berättar")).toBeInTheDocument();
    expect(screen.getByText("Här står tesen.")).toHaveClass("board-ink-full");
    expect(screen.queryByRole("button")).not.toBeInTheDocument();

    act(() => { FakeAudio.instances[0].dispatchEvent(new Event("ended")); });
    await waitFor(() => expect(screen.queryByText("Edda berättar")).not.toBeInTheDocument());
    expect(screen.getByText("Här står tesen.")).toHaveClass("board-ink");
    expect(screen.getByRole("button", { name: "Svara" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Fortsätt" })).toBeInTheDocument();
  });

  it("shows the text at once when Edda's voice cannot be used", async () => {
    resetVoice();
    allowMotion();
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ error: "nej" }), { status: 503 })));
    render(
      <BoardSequence>
        <BoardStep><p><Written spoken>Här står tesen.</Written></p></BoardStep>
      </BoardSequence>,
    );

    await waitFor(() => expect(screen.getByText("Här står tesen.")).toHaveClass("board-ink"));
    expect(screen.queryByText("Edda berättar")).not.toBeInTheDocument();
  });
});
