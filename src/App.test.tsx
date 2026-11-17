import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";

function reviewResponse(draft: string) {
  const quote = "Jag tycker";
  const start = draft.indexOf(quote, quote.length);
  const findings = start < 0 ? [] : [{
    id: `ai-0-${start}`,
    start,
    end: start + quote.length,
    quote,
    title: "Upprepad meningsstart",
    message: "Behöver varje mening börja så?",
  }];

  return new Response(JSON.stringify({ findings }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

beforeEach(() => {
  window.localStorage.clear();
  vi.stubGlobal("fetch", vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
    const request = JSON.parse(String(init?.body)) as { draft?: string };
    return reviewResponse(request.draft ?? "");
  }));
});

afterEach(() => {
  cleanup();
  window.localStorage.clear();
  vi.unstubAllGlobals();
});

describe("writing coach", () => {
  it("keeps the student's text unchanged when running a review", async () => {
    const user = userEvent.setup();
    const draft = "Jag tycker skoldagen ska börja senare. Jag tycker elever behöver mer vila.";

    render(<App />);
    const editor = screen.getByRole("textbox", { name: "Din argumenterande text" });
    await user.type(editor, draft);
    await user.click(screen.getByRole("tab", { name: "Granska" }));

    expect(screen.getByText(/AI-återkoppling/)).toBeInTheDocument();
    expect(screen.getByText("Upprepad meningsstart")).toBeInTheDocument();
    await user.click(screen.getByRole("tab", { name: "Skriv" }));

    expect(screen.getByRole("textbox", { name: "Din argumenterande text" })).toHaveValue(draft);
    expect(screen.queryByRole("button", { name: /Skriv om|Ersätt text/ })).not.toBeInTheDocument();
  });

  it("clears annotations after the student edits the text", async () => {
    const user = userEvent.setup();
    render(<App />);

    const editor = screen.getByRole("textbox", { name: "Din argumenterande text" });
    await user.type(editor, "Jag tycker det. Jag tycker också det.");
    await user.click(screen.getByRole("tab", { name: "Granska" }));
    expect(screen.getAllByRole("mark").length).toBeGreaterThan(0);

    await user.click(screen.getByRole("tab", { name: "Skriv" }));
    await user.clear(screen.getByRole("textbox", { name: "Din argumenterande text" }));
    await user.type(screen.getByRole("textbox", { name: "Din argumenterande text" }), "Ny text utan gamla markeringar.");
    await user.click(screen.getByRole("tab", { name: "Granska" }));

    expect(screen.queryAllByRole("mark")).toHaveLength(0);
    expect(screen.queryByText("Upprepad meningsstart")).not.toBeInTheDocument();
  });

  it("shows a clear error when the AI service fails instead of using a local fallback", async () => {
    const user = userEvent.setup();
    vi.stubGlobal("fetch", vi.fn(async () => new Response(
      JSON.stringify({ error: "AI-granskningen misslyckades. Försök igen." }),
      { status: 502, headers: { "Content-Type": "application/json" } },
    )));
    render(<App />);

    await user.type(screen.getByRole("textbox", { name: "Din argumenterande text" }), "Text att granska.");
    await user.click(screen.getByRole("tab", { name: "Granska" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("AI-granskningen misslyckades");
    expect(screen.queryByText("Upprepad meningsstart")).not.toBeInTheDocument();
  });

  it("reduces visible support as the student progresses", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Träna själv" }));
    await user.click(screen.getByRole("button", { name: "Visa en ledtråd" }));
    expect(screen.getByText(/En tes tar tydlig ställning/)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Återkalla utan stöd" }));
    expect(screen.queryByText(/En tes tar tydlig ställning/)).not.toBeInTheDocument();
    expect(screen.getByText("Försök utan stöd")).toBeInTheDocument();
  });

  it("omits the extra workspace labels and duplicate review button", () => {
    render(<App />);

    expect(screen.queryByText("SKRIVCOACH · SVENSKA ÅK 9")).not.toBeInTheDocument();
    expect(screen.queryByText("Sparas på den här enheten")).not.toBeInTheDocument();
    expect(screen.queryByText("DIN TEXT · ARBETSDOKUMENT")).not.toBeInTheDocument();
    expect(screen.queryByText("Skriv och bearbeta")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Granska texten" })).not.toBeInTheDocument();
    expect(screen.queryByText("Du är författaren. Välj själv vilka förslag du vill arbeta vidare med.")).not.toBeInTheDocument();
  });
});
