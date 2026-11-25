import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import ReadingSettings from "./ReadingSettings";
import {
  defaultReadingSettings,
  forgetReadingSettings,
  readingStyle,
  setReadingSettings,
  takesMoreRoom,
} from "../lib/readingSettings";

describe("reading settings", () => {
  beforeEach(() => forgetReadingSettings());
  afterEach(cleanup);

  it("keeps the panel closed until the student asks for it", async () => {
    render(<ReadingSettings />);
    expect(screen.queryByRole("dialog", { name: "Textformat" })).toBeNull();

    await userEvent.click(screen.getByRole("button", { name: "Textformat" }));
    const panel = screen.getByRole("dialog", { name: "Textformat" });
    for (const name of ["Textstorlek", "Radavstånd", "Avstånd mellan bokstäver", "Bakgrund", "Läslinjal"]) {
      expect(within(panel).getByRole("group", { name })).toBeTruthy();
    }

    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("dialog", { name: "Textformat" })).toBeNull();
  });

  it("remembers what the student chooses and can be reset", async () => {
    render(<ReadingSettings />);
    await userEvent.click(screen.getByRole("button", { name: "Textformat" }));
    const panel = screen.getByRole("dialog", { name: "Textformat" });
    // Nothing to reset before something is changed.
    expect(within(panel).queryByRole("button", { name: "Återställ" })).toBeNull();

    const size = within(panel).getByRole("group", { name: "Textstorlek" });
    await userEvent.click(within(size).getByRole("button", { name: "Störst" }));
    await userEvent.click(within(panel).getByRole("button", { name: "Ljusblå" }));
    expect(within(size).getByRole("button", { name: "Störst" }).getAttribute("aria-pressed")).toBe("true");
    expect(JSON.parse(window.localStorage.getItem("skrivcoach.readingSettings")!)).toMatchObject({ size: 2, paper: "blue" });

    await userEvent.click(within(panel).getByRole("button", { name: "Återställ" }));
    expect(within(size).getByRole("button", { name: "Normal" }).getAttribute("aria-pressed")).toBe("true");
    expect(JSON.parse(window.localStorage.getItem("skrivcoach.readingSettings")!)).toEqual(defaultReadingSettings);
  });

  it("sets no variables for the lesson's own look and only the changed ones otherwise", () => {
    expect(readingStyle(defaultReadingSettings)).toEqual({});
    expect(takesMoreRoom(defaultReadingSettings)).toBe(false);

    setReadingSettings({ lineSpacing: 1, paper: "cream" });
    const changed = { ...defaultReadingSettings, lineSpacing: 1 as const, paper: "cream" as const };
    expect(readingStyle(changed)).toEqual({ "--read-line-add": "0.35", "--read-paper": "#fbf5e6" });
    expect(takesMoreRoom(changed)).toBe(true);
    // A paper colour or the ruler alone leaves the layout as it is.
    expect(takesMoreRoom({ ...defaultReadingSettings, paper: "green", ruler: true })).toBe(false);
  });
});
