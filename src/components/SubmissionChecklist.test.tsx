import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { finalDiagnosisChecklist } from "../data/finalDiagnosisChecklist";
import SubmissionChecklist from "./SubmissionChecklist";

afterEach(cleanup);

describe("checklist before the final diagnosis", () => {
  it("lets the student tick off and untick points, one part of the list at a time", async () => {
    const user = userEvent.setup();
    render(<SubmissionChecklist />);

    expect(screen.getByRole("status")).toHaveTextContent("0 av 28 avklarade");
    const first = finalDiagnosisChecklist[0];
    const items = screen.getByRole("list", { name: first.title });
    expect(within(items).getAllByRole("button")).toHaveLength(first.items.length);

    const point = within(items).getByRole("button", { name: first.items[0] });
    await user.click(point);
    expect(point).toHaveAttribute("aria-pressed", "true");
    expect(point).toHaveClass("is-done");
    expect(screen.getByRole("status")).toHaveTextContent("1 av 28 avklarade");
    expect(screen.getByRole("button", { name: /1\. Struktur & Innehåll/ })).toHaveTextContent("1/7");

    // The other parts are opened one at a time, and what is ticked off stays ticked.
    await user.click(screen.getByRole("button", { name: /4\. Språkriktighet & Korrektur/ }));
    expect(screen.getByRole("list", { name: finalDiagnosisChecklist[3].title })).toBeVisible();
    await user.click(screen.getByRole("button", { name: /1\. Struktur & Innehåll/ }));
    const again = screen.getByRole("button", { name: first.items[0] });
    expect(again).toHaveAttribute("aria-pressed", "true");
    await user.click(again);
    expect(screen.getByRole("status")).toHaveTextContent("0 av 28 avklarade");
  });
});
