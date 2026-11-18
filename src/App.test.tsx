import { act, cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import { finalRecallQuestions } from "./data/lessons";
import { learnerProfileKey } from "./lib/learnerProfile";

function reviewResponse(draft: string) {
  const successQuote = draft.match(/[\p{L}\p{N}]+/u)?.[0] ?? "";
  const successStart = draft.indexOf(successQuote);
  const quote = "Jag tycker";
  const start = draft.indexOf(quote, quote.length);
  const findings = start < 0 ? [] : [{
    id: `ai-0-${start}`,
    start,
    end: start + quote.length,
    quote,
    title: "Upprepad meningsstart",
    message: "Behöver varje mening börja så?",
    category: "sentence",
  }];

  return new Response(JSON.stringify({
    success: {
      start: successStart,
      end: successStart + successQuote.length,
      quote: successQuote,
      message: "Du uttrycker en tydlig tanke.",
    },
    nextStep: "Vilket exempel kan hjälpa dig att utveckla din tanke?",
    findings,
  }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

async function completeEntry(user: ReturnType<typeof userEvent.setup>, answer = "En tes visar skribentens ståndpunkt.") {
  await user.type(screen.getByRole("textbox", { name: "Ditt svar, utan ledtråd" }), answer);
  await user.click(screen.getByRole("button", { name: "Svara" }));
  await user.click(await screen.findByRole("button", { name: "Börja momentet" }));
}

async function completeFinalRecall(user: ReturnType<typeof userEvent.setup>) {
  for (let index = 0; index < finalRecallQuestions.length; index += 1) {
    await user.type(screen.getByRole("textbox", { name: "Ditt svar, utan stöd" }), `Återkallat svar ${index + 1}.`);
    await user.click(screen.getByRole("button", {
      name: index === finalRecallQuestions.length - 1 ? "Starta slutdiagnosen" : "Nästa fråga",
    }));
  }
}

beforeEach(() => {
  window.localStorage.clear();
  vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    if (String(input).includes("/api/check-in")) {
      return new Response(JSON.stringify({ kind: "on_track", feedback: "Du är på rätt spår. Kan du ge ett exempel?" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    const request = JSON.parse(String(init?.body)) as { draft?: string };
    if (String(input).includes("/api/example")) {
      return new Response(JSON.stringify({
        needsWork: "Musik är bra.",
        developed: "Musik kan samla människor eftersom de delar en upplevelse.",
        question: "Vad förklarar sambandet i det andra exemplet?",
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
    return reviewResponse(request.draft ?? "");
  }));
});

afterEach(() => {
  cleanup();
  window.localStorage.clear();
  vi.unstubAllGlobals();
});

describe("writing coach", () => {
  it("persists learning signals and uses the selected interest for a fictional example", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.mocked(fetch);
    const view = render(<App />);

    await user.type(screen.getByRole("textbox", { name: "Ditt svar, utan ledtråd" }), "En tes visar skribentens ståndpunkt.");
    await user.click(screen.getByRole("button", { name: "Svara" }));
    await screen.findByRole("status");
    await user.click(screen.getByRole("button", { name: "För svårt" }));
    await user.click(screen.getByRole("button", { name: "Börja momentet" }));
    await user.selectOptions(screen.getByRole("combobox", { name: "Välj intresse för exempel" }), "music");
    await user.click(screen.getByRole("button", { name: "Skapa exempel med valt ämne" }));

    expect(await screen.findByText("Musik kan samla människor eftersom de delar en upplevelse.")).toBeInTheDocument();
    const exampleRequest = fetchMock.mock.calls
      .map(([, init]) => JSON.parse(String(init?.body)) as Record<string, unknown>)
      .find((body) => body.interest === "music");
    expect(exampleRequest).toMatchObject({
      skillId: "structure",
      interest: "music",
      supportLevel: 0,
      evidence: [{ skillId: "structure", latest: "independent", selfReport: "too_hard" }],
    });
    expect(exampleRequest).not.toHaveProperty("draft");
    expect(exampleRequest).not.toHaveProperty("answer");

    const savedProfile = JSON.parse(window.localStorage.getItem(learnerProfileKey) ?? "null");
    expect(savedProfile).toMatchObject({
      interest: "music",
      difficulty: { structure: "too_hard" },
      evidence: { structure: { latest: "independent", observations: 1 } },
    });

    view.unmount();
    render(<App />);
    expect(screen.getByRole("combobox", { name: "Välj intresse för exempel" })).toHaveValue("music");
    expect(screen.getByText("Lärsignaler och ämnesval sparas lokalt i demoläget")).toBeInTheDocument();
  });

  it("lets the student continue writing at a cited span without an automatic edit", async () => {
    const user = userEvent.setup();
    const draft = "Jag tycker skoldagen ska börja senare. Jag tycker elever behöver mer vila.";

    render(<App />);
    const editor = screen.getByRole("textbox", { name: "Din argumenterande text" }) as HTMLTextAreaElement;
    await user.type(editor, draft);
    await user.click(screen.getByRole("button", { name: "Få återkoppling" }));

    const feedback = screen.getByRole("region", { name: "Återkoppling på ditt utkast" });
    expect(feedback).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Din argumenterande text" })).toHaveValue(draft);
    expect(screen.getByText("Utkast skickas till OpenAI")).toBeInTheDocument();
    expect([...feedback.querySelectorAll("strong")].map((label) => label.textContent)).toEqual([
      "Målet",
      "Din framgång",
      "Vad kan bli bättre?",
      "Nästa steg",
    ]);
    expect(screen.getByText("Du uttrycker en tydlig tanke.")).toBeInTheDocument();
    expect(screen.getByText("Vilket exempel kan hjälpa dig att utveckla din tanke?")).toBeInTheDocument();
    expect(screen.queryByRole("list", { name: "Formativ arbetsgång" })).not.toBeInTheDocument();

    const mark = screen.getByRole("button", { name: /Visa förklaring.*Upprepad meningsstart/ });
    expect(mark).toHaveTextContent("Jag tycker");
    await user.click(mark);
    expect(screen.getByRole("dialog", { name: "Förklaring: Upprepad meningsstart" })).toHaveTextContent("Behöver varje mening börja så?");
    expect(editor).toHaveValue(draft);
    expect(screen.queryByText("Tips på ditt utkast")).not.toBeInTheDocument();
    expect(document.querySelector(".feedback-card")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Skriv om|Ersätt text/ })).not.toBeInTheDocument();

    const quoteStart = draft.indexOf("Jag tycker", "Jag tycker".length);
    const quoteEnd = quoteStart + "Jag tycker".length;
    await user.click(screen.getByRole("button", { name: "Fortsätt skriva" }));

    expect(editor).toHaveFocus();
    expect(editor.selectionStart).toBe(quoteStart);
    expect(editor.selectionEnd).toBe(quoteEnd);
    expect(editor).toHaveValue(draft);

    await user.keyboard("Jag anser");
    expect(editor).toHaveValue(`${draft.slice(0, quoteStart)}Jag anser${draft.slice(quoteEnd)}`);
    expect(screen.queryByRole("button", { name: /Visa förklaring.*Upprepad meningsstart/ })).not.toBeInTheDocument();
  });

  it("clears annotations after the student edits the text", async () => {
    const user = userEvent.setup();
    render(<App />);

    const editor = screen.getByRole("textbox", { name: "Din argumenterande text" }) as HTMLTextAreaElement;
    await user.type(editor, "Jag tycker det. Jag tycker också det.");
    await user.click(screen.getByRole("button", { name: "Få återkoppling" }));
    expect(await screen.findByRole("button", { name: /Visa förklaring.*Upprepad meningsstart/ })).toBeInTheDocument();

    await user.clear(screen.getByRole("textbox", { name: "Din argumenterande text" }));
    await user.type(screen.getByRole("textbox", { name: "Din argumenterande text" }), "Ny text utan gamla markeringar.");

    expect(screen.queryByRole("button", { name: /Visa förklaring.*Upprepad meningsstart/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "Återkoppling på ditt utkast" })).not.toBeInTheDocument();
    expect(screen.queryByRole("list", { name: "Formativ arbetsgång" })).not.toBeInTheDocument();
  });

  it("shows a clear error when the AI service fails instead of using a local fallback", async () => {
    const user = userEvent.setup();
    vi.stubGlobal("fetch", vi.fn(async () => new Response(
      JSON.stringify({ error: "OpenAI avvisade serverns API-nyckel eller projektbehörighet. Kontrollera nyckeln och dess åtkomst." }),
      { status: 502, headers: { "Content-Type": "application/json" } },
    )));
    render(<App />);

    await user.type(screen.getByRole("textbox", { name: "Din argumenterande text" }), "Text att granska.");
    await user.click(screen.getByRole("button", { name: "Få återkoppling" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("OpenAI avvisade serverns API-nyckel");
    expect(screen.queryByText("Upprepad meningsstart")).not.toBeInTheDocument();
  });

  it("does not show a pending review after the student changes lesson phase", async () => {
    const user = userEvent.setup();
    let resolveReview!: (response: Response) => void;
    vi.stubGlobal("fetch", vi.fn((input: RequestInfo | URL) => {
      if (String(input).includes("/api/check-in")) {
        return Promise.resolve(new Response(JSON.stringify({
          kind: "on_track",
          feedback: "Du är på rätt spår. Kan du ge ett exempel?",
        }), { status: 200, headers: { "Content-Type": "application/json" } }));
      }

      return new Promise<Response>((resolve) => {
        resolveReview = resolve;
      });
    }));
    render(<App />);

    await completeEntry(user);
    await user.type(screen.getByRole("textbox", { name: "Din argumenterande text" }), "Text att granska.");
    await user.click(screen.getByRole("button", { name: "Få återkoppling" }));
    await user.click(screen.getByRole("button", { name: /Nästa steg/ }));
    await act(async () => {
      resolveReview(reviewResponse("Text att granska."));
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(screen.queryByText("Tips på ditt utkast")).not.toBeInTheDocument();
    expect(screen.queryByText("Upprepad meningsstart")).not.toBeInTheDocument();
  });

  it("reduces visible support as the student progresses", async () => {
    const user = userEvent.setup();
    render(<App />);

    await completeEntry(user);
    await user.click(screen.getByRole("button", { name: /Nästa steg/ }));
    await user.click(screen.getByRole("button", { name: "Visa en ledtråd" }));
    expect(screen.getByText(/En tes tar tydlig ställning/)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Nästa steg/ }));
    expect(screen.queryByText(/En tes tar tydlig ställning/)).not.toBeInTheDocument();
    expect(screen.getByText("Försök utan stöd")).toBeInTheDocument();
  });

  it("shows the supplied curriculum criteria for the relevant lessons", async () => {
    const user = userEvent.setup();
    render(<App />);

    await completeEntry(user);
    expect(screen.getByText("Eleven skriver olika slags texter med fungerande struktur och god anpassning till texttyp, syfte och mottagare.")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Meningsbyggnad/ }));
    await completeEntry(user, "Jag kan variera meningsstarter.");
    expect(screen.getByText("Eleven följer språkliga normer på ett i huvudsak fungerande sätt.")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Slutdiagnos/ }));
    await completeEntry(user, "Jag kontrollerar meningsgränser.");
    const boardGoal = screen.getByText(/Eleven skriver olika slags texter/);
    expect(boardGoal).toHaveTextContent("Eleven följer språkliga normer på ett i huvudsak fungerande sätt.");
  });

  it("keeps the final diagnosis unsupported until completion and optional feedback", async () => {
    const user = userEvent.setup();
    render(<App />);

    const trainingDraft = "Skoldagen borde börja senare. Jag tycker elever behöver mer vila.";
    await user.type(screen.getByRole("textbox", { name: "Din argumenterande text" }), trainingDraft);
    await user.click(screen.getByRole("button", { name: /Slutdiagnos/ }));
    await completeEntry(user, "Jag kontrollerar meningsgränser.");
    const requestsBeforeRecall = vi.mocked(fetch).mock.calls.length;
    for (let step = 0; step < 4; step += 1) {
      await user.click(screen.getByRole("button", { name: /Nästa steg/ }));
    }

    expect(screen.getByRole("heading", { name: "Struktur" })).toBeInTheDocument();
    expect(screen.getByText("Svaren stannar i den här sessionen och skickas inte till AI.")).toBeInTheDocument();
    await completeFinalRecall(user);
    expect(fetch).toHaveBeenCalledTimes(requestsBeforeRecall);

    expect(screen.queryByRole("region", { name: /Whiteboard/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("navigation", { name: "Lektionens moment" })).not.toBeInTheDocument();
    expect(screen.queryByText("Struktur, innehåll och språklig variation")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Få återkoppling" })).not.toBeInTheDocument();

    const editor = screen.getByRole("textbox", { name: "Din argumenterande text" }) as HTMLTextAreaElement;
    expect(editor).toHaveAttribute("placeholder", "");
    expect(editor).toHaveValue("");
    expect(screen.getByText("Ta ställning: Borde ungdomar få åka gratis med kollektivtrafiken i sin kommun?")).toBeInTheDocument();
    const requestsBeforeComplete = vi.mocked(fetch).mock.calls.length;
    await user.type(editor, "Jag tycker ungdomar borde få åka gratis med kollektivtrafiken. Jag tycker det kan göra fler aktiviteter möjliga.");
    const diagnosisText = editor.value;
    expect(window.localStorage.getItem("skrivcoach-argumenterande-draft")).toBe(trainingDraft);
    await user.click(screen.getByRole("button", { name: "Markera slutdiagnosen som klar" }));

    expect(fetch).toHaveBeenCalledTimes(requestsBeforeComplete);
    expect(screen.getByRole("status")).toHaveTextContent("AI-återkoppling är valfri.");
    expect(screen.getByText("Utkast skickas till OpenAI")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Få återkoppling" }));
    expect(await screen.findByRole("region", { name: "Återkoppling på ditt utkast" })).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledTimes(requestsBeforeComplete + 1);
    expect(screen.getByText("Förslag på fortsatt övning")).toBeInTheDocument();
    const requestsBeforeHandoff = vi.mocked(fetch).mock.calls.length;
    await user.click(screen.getByRole("button", { name: "Lämna in till läraren (demo)" }));
    expect(fetch).toHaveBeenCalledTimes(requestsBeforeHandoff);
    expect(screen.getByText("Inlämnad i den lokala lärarvyn.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Lärarvy (demoläge)" }));
    expect(screen.getByRole("region", { name: "Lärarvy i demoläge" })).toHaveTextContent(diagnosisText);
    expect(screen.getByRole("region", { name: "Lärarvy i demoläge" })).toHaveTextContent("Du uttrycker en tydlig tanke.");
    await user.click(screen.getByRole("button", { name: "Öva vidare på Meningsbyggnad" }));
    expect(screen.getByRole("textbox", { name: "Din argumenterande text" })).toHaveValue(trainingDraft);
  });

  it("omits the extra workspace labels and duplicate review button", () => {
    render(<App />);

    expect(screen.queryByText("Moment 1 av 6")).not.toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "Lektionssteg" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Modellering" })).not.toBeInTheDocument();
    expect(screen.queryByText("SKRIVCOACH · SVENSKA ÅK 9")).not.toBeInTheDocument();
    expect(screen.queryByText("Sparas på den här enheten")).not.toBeInTheDocument();
    expect(screen.queryByText("DIN TEXT · ARBETSDOKUMENT")).not.toBeInTheDocument();
    expect(screen.queryByText("Skriv och bearbeta")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Granska texten" })).not.toBeInTheDocument();
    expect(screen.queryByText("Du är författaren. Välj själv vilka förslag du vill arbeta vidare med.")).not.toBeInTheDocument();
    expect(screen.queryByRole("list", { name: "Formativ arbetsgång" })).not.toBeInTheDocument();
  });
});
