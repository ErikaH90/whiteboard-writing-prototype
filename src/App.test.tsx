import { act, cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import { exemplarFocus, exemplarTexts } from "./data/exemplars";
import { finalRecallQuestions, lessons } from "./data/lessons";
import { clearExemplarAudioCache } from "./lib/exemplarAudio";
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

// Each lesson opens with an attention line and the goal before the entry question is asked.
async function openEntryQuestion(user: ReturnType<typeof userEvent.setup>) {
  while (!screen.queryByRole("textbox", { name: "Ditt svar, utan ledtråd" })) {
    await user.click(screen.getByRole("button", { name: "Fortsätt" }));
  }
}

async function completeEntry(user: ReturnType<typeof userEvent.setup>, answer = "En tes visar skribentens ståndpunkt.") {
  await openEntryQuestion(user);
  await user.type(screen.getByRole("textbox", { name: "Ditt svar, utan ledtråd" }), answer);
  await user.click(screen.getByRole("button", { name: "Svara" }));
  await user.click(await screen.findByRole("button", { name: "Börja momentet" }));
  await skipListening(user);
}

// When the exemplar text is shown on the writing surface, the student switches to their own text.
async function openDraft(user: ReturnType<typeof userEvent.setup>) {
  // The surface is blank until the first entry question has been answered.
  if (!screen.queryByRole("button", { name: "Din text" })) await completeEntry(user);
  await user.click(screen.getByRole("button", { name: "Din text" }));
}

// The exemplar text is introduced once per session, after the first entry question.
async function skipListening(user: ReturnType<typeof userEvent.setup>) {
  const skip = screen.queryByRole("button", { name: "Starta lektionen utan att lyssna" });
  if (skip) await user.click(skip);
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
  it("persists summarized learning signals between visits without storing answers", async () => {
    const user = userEvent.setup();
    const view = render(<App />);

    await completeEntry(user);
    const savedProfile = JSON.parse(window.localStorage.getItem(learnerProfileKey) ?? "null");
    expect(savedProfile).toMatchObject({
      evidence: { structure: { latest: "independent", observations: 1, independent: 1 } },
    });
    expect(JSON.stringify(savedProfile)).not.toContain("En tes visar skribentens ståndpunkt.");

    view.unmount();
    render(<App />);
    // The page has no demo footer, no teacher shortcut and no topic picker.
    expect(screen.queryByText(/DEMO|sparas lokalt i demoläget|Kursplansanknytning/)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Lärarvy (demoläge)" })).not.toBeInTheDocument();
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
  });

  it("lets the student continue writing at a cited span without an automatic edit", async () => {
    const user = userEvent.setup();
    const draft = "Jag tycker skoldagen ska börja senare. Jag tycker elever behöver mer vila.";

    render(<App />);
    await openDraft(user);
    const editor = screen.getByRole("textbox", { name: "Din argumenterande text" }) as HTMLTextAreaElement;
    await user.type(editor, draft);
    await user.click(screen.getByRole("button", { name: "Få återkoppling" }));

    const feedback = screen.getByRole("region", { name: "Återkoppling på ditt utkast" });
    expect(feedback).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Din argumenterande text" })).toHaveValue(draft);
    expect(screen.queryByText("Text skickas till OpenAI vid AI-återkoppling.")).not.toBeInTheDocument();
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
    await openDraft(user);

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
    render(<App />);
    await openDraft(user);
    vi.stubGlobal("fetch", vi.fn(async () => new Response(
      JSON.stringify({ error: "OpenAI avvisade serverns API-nyckel eller projektbehörighet. Kontrollera nyckeln och dess åtkomst." }),
      { status: 502, headers: { "Content-Type": "application/json" } },
    )));

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
    await user.click(screen.getByRole("button", { name: "Din text" }));
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

  it("checks understanding in the exemplar text itself: the student clicks the right part", async () => {
    const user = userEvent.setup();
    render(<App />);
    const lesson = lessons[0];
    const focus = exemplarFocus.structure;
    const parts = focus.highlights.strong;

    await completeEntry(user);
    expect(screen.getByText(lesson.learnerGoal)).toBeVisible();
    for (const part of parts) {
      await user.click(screen.getByRole("button", { name: "Fortsätt" }));
      expect(screen.getByText(part.explain ?? "")).toBeVisible();
    }

    // After the walk-through the whiteboard asks, and the answer is given in the text beside it.
    await user.click(screen.getByRole("button", { name: "Fortsätt" }));
    expect(screen.getByText(focus.check.prompt)).toBeVisible();
    expect(screen.queryByRole("button", { name: "Fortsätt" })).not.toBeInTheDocument();
    expect(screen.queryByRole("group", { name: "Välj ett exempel" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Skapa exempel/ })).not.toBeInTheDocument();
    const surface = screen.getByRole("region", { name: "Exempeltext" });
    const candidates = within(surface).getAllByRole("button").filter((button) => button.classList.contains("is-candidate"));
    expect(candidates.map((button) => button.textContent)).toEqual(parts.map((part) => part.quote));
    expect(within(surface).getByRole("article")).not.toHaveClass("is-focusing");

    // A wrong part gives a nudge without a star, and the student can try again.
    vi.mocked(fetch).mockImplementationOnce(async () => new Response(
      JSON.stringify({ kind: "retry", feedback: "Det är rubriken. Var säger skribenten vad hen vill?" }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    ));
    await user.click(candidates[0]);
    expect(await screen.findByRole("status")).toHaveTextContent("Det är rubriken.");
    expect(screen.getByRole("status").querySelector(".edda-star")).not.toBeInTheDocument();
    expect(candidates[0]).not.toBeDisabled();

    const requestsBefore = vi.mocked(fetch).mock.calls.length;
    await user.click(candidates[focus.check.target]);
    expect(fetch).toHaveBeenCalledTimes(requestsBefore + 1);
    expect(JSON.parse(String(vi.mocked(fetch).mock.calls[requestsBefore][1]?.body))).toMatchObject({
      mode: "choice",
      question: focus.check.prompt,
      answer: parts[focus.check.target].quote,
      isCorrect: true,
      learningContext: { attempt: 2 },
    });
    expect(await screen.findByText("Du är på rätt spår. Kan du ge ett exempel?")).toBeVisible();
    expect(screen.getByRole("status").querySelector(".edda-star")).toBeInTheDocument();
    expect(candidates[focus.check.target]).toHaveClass("is-solved");
    expect(candidates.every((button) => (button as HTMLButtonElement).disabled)).toBe(true);
    expect(screen.queryByRole("button", { name: "Försök igen" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Nästa steg/ }));
    expect(screen.getByText(lesson.practice)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Tillbaka" }));
    expect(screen.getByText(focus.check.prompt)).toBeVisible();
    expect(screen.queryByRole("button", { name: "Fortsätt" })).not.toBeInTheDocument();
  });

  it("starts with a simple retrieval question, then listening, then highlights tied to the lesson", async () => {
    const user = userEvent.setup();
    render(<App />);

    window.localStorage.setItem("skrivcoach-argumenterande-draft", "Sparat utkast från ett tidigare besök.");
    cleanup();
    render(<App />);
    expect(screen.getByText(lessons[0].hook)).toBeVisible();
    await openEntryQuestion(user);
    expect(screen.getByText("Vad är en argumenterande text?")).toBeVisible();
    expect(screen.queryByRole("region", { name: "Exempeltext" })).not.toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Elevens skrivyta" })).toBeEmptyDOMElement();
    expect(screen.queryByText("Sparat utkast från ett tidigare besök.")).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: exemplarTexts.strong.title })).not.toBeInTheDocument();
    await openEntryQuestion(user);
    await user.type(screen.getByRole("textbox", { name: "Ditt svar, utan ledtråd" }), "En text där man tar ställning och ger skäl.");
    await user.click(screen.getByRole("button", { name: "Svara" }));
    await user.click(await screen.findByRole("button", { name: "Börja momentet" }));

    const surface = screen.getByRole("region", { name: "Exempeltext" });
    expect(screen.getByText("Lyssna nu")).toBeInTheDocument();
    expect(within(surface).getByRole("heading", { name: exemplarTexts.strong.title })).toBeInTheDocument();
    // The listen button is on the whiteboard so that the text gets the whole writing surface.
    expect(within(surface).queryByRole("button")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Lyssna på texten" })).toBeInTheDocument();
    expect(surface.querySelector("mark")).not.toBeInTheDocument();
    expect(screen.queryByRole("textbox", { name: "Din argumenterande text" })).not.toBeInTheDocument();
    expect(screen.queryByText(lessons[0].learnerGoal)).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Starta lektionen utan att lyssna" }));
    expect(screen.getByText(exemplarFocus.structure.boardNote)).toBeInTheDocument();
    expect(surface.querySelector("mark")).not.toBeInTheDocument();

    // Each part the whiteboard presents is the only one lit in the exemplar; the rest is blurred.
    const parts = exemplarFocus.structure.highlights.strong;
    for (const [index, part] of parts.entries()) {
      await user.click(screen.getByRole("button", { name: "Fortsätt" }));
      expect([...surface.querySelectorAll("mark")].map((mark) => mark.firstChild?.textContent)).toEqual([part.quote]);
      expect(surface.querySelector("mark")).toHaveClass("is-focus");
      expect(within(surface).getByRole("article")).toHaveClass("is-focusing");
      expect(screen.getByText(`”${part.quote}”`)).toBeVisible();
      expect(screen.getByText(`${index + 1} AV ${parts.length}`)).toBeVisible();
      expect(within(surface).queryByRole("button", { name: /Lyssna/ })).not.toBeInTheDocument();
    }

    await user.click(screen.getByRole("button", { name: "Visa föregående del" }));
    expect([...surface.querySelectorAll("mark")].map((mark) => mark.firstChild?.textContent)).toEqual([parts[parts.length - 2].quote]);
    await user.click(screen.getByRole("button", { name: "Fortsätt" }));

    // The check follows; all the parts are lit again in the text and nothing is blurred.
    await user.click(screen.getByRole("button", { name: "Fortsätt" }));
    expect(screen.getByText(exemplarFocus.structure.check.prompt)).toBeVisible();
    expect(surface.querySelectorAll(".exemplar-mark.is-candidate")).toHaveLength(parts.length);
    expect(within(surface).getByRole("article")).not.toHaveClass("is-focusing");

    await user.click(screen.getByRole("button", { name: "Din text" }));
    expect(screen.getByRole("textbox", { name: "Din argumenterande text" })).toHaveValue("Sparat utkast från ett tidigare besök.");

    // In the next step the exemplar is a recap: all marks, explanations and the comparison text.
    await user.click(screen.getByRole("button", { name: /Nästa steg/ }));
    expect(screen.getByRole("textbox", { name: "Din argumenterande text" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Exempeltext" }));
    const recap = screen.getByRole("region", { name: "Exempeltext" });
    expect([...recap.querySelectorAll("mark")].map((mark) => mark.firstChild?.textContent)).toEqual(parts.map((part) => part.quote));
    expect(within(recap).getByText("Tes: skribentens ståndpunkt")).toBeInTheDocument();
    await user.click(within(recap).getByRole("button", { name: "Okej text" }));
    expect(within(recap).getByRole("heading", { name: new RegExp(exemplarTexts.basic.title.replace("!", "")) })).toBeInTheDocument();
    expect(within(recap).queryByRole("button", { name: /Lyssna/ })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Nästa steg/ }));
    expect(screen.getByText("Försök utan stöd")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Exempeltext" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: exemplarTexts.strong.title })).not.toBeInTheDocument();

    // In later lessons the exemplar is already known and stays visible during the entry question.
    await user.click(screen.getByRole("button", { name: /Resonemang/ }));
    expect(screen.getByRole("region", { name: "Exempeltext" }).querySelector("mark")).not.toBeInTheDocument();
    await openEntryQuestion(user);
    expect(screen.getByRole("textbox", { name: "Ditt svar, utan ledtråd" })).toBeInTheDocument();
  });

  it("fetches the read-aloud only when the student asks and starts the lesson when listening is finished", async () => {
    class FakeAudio extends EventTarget {
      static instances: FakeAudio[] = [];
      play = vi.fn(async () => undefined);
      pause = vi.fn();

      constructor(public src: string) {
        super();
        FakeAudio.instances.push(this);
      }
    }
    clearExemplarAudioCache();
    vi.stubGlobal("Audio", FakeAudio);
    vi.stubGlobal("URL", Object.assign(URL, { createObjectURL: vi.fn(() => "blob:exempel") }));
    const user = userEvent.setup();
    render(<App />);
    await openEntryQuestion(user);
    await user.type(screen.getByRole("textbox", { name: "Ditt svar, utan ledtråd" }), "En text där man tar ställning.");
    await user.click(screen.getByRole("button", { name: "Svara" }));
    await user.click(await screen.findByRole("button", { name: "Börja momentet" }));

    const audioRequests = () => vi.mocked(fetch).mock.calls.filter(([input]) => String(input).includes("/api/exemplar-audio"));
    expect(audioRequests()).toHaveLength(0);

    await user.click(screen.getByRole("button", { name: "Lyssna på texten" }));
    expect(audioRequests()).toHaveLength(1);
    expect(JSON.parse(String(audioRequests()[0][1]?.body))).toEqual({ exemplarId: "strong" });
    expect(FakeAudio.instances[0].play).toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Pausa uppläsningen" }));
    expect(FakeAudio.instances[0].pause).toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Fortsätt lyssna" }));
    expect(screen.queryByText(lessons[0].learnerGoal)).not.toBeInTheDocument();

    act(() => { FakeAudio.instances[0].dispatchEvent(new Event("ended")); });
    expect(screen.getByText(lessons[0].learnerGoal)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Lyssna/ })).not.toBeInTheDocument();
  });

  it("shows the server's message when the read-aloud cannot be created", async () => {
    clearExemplarAudioCache();
    const user = userEvent.setup();
    render(<App />);
    await openEntryQuestion(user);
    await user.type(screen.getByRole("textbox", { name: "Ditt svar, utan ledtråd" }), "En text där man tar ställning.");
    await user.click(screen.getByRole("button", { name: "Svara" }));
    await user.click(await screen.findByRole("button", { name: "Börja momentet" }));
    vi.stubGlobal("fetch", vi.fn(async () => new Response(
      JSON.stringify({ error: "Uppläsning är inte konfigurerad på servern." }),
      { status: 503, headers: { "Content-Type": "application/json" } },
    )));

    await user.click(screen.getByRole("button", { name: "Lyssna på texten" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Uppläsning är inte konfigurerad på servern.");
    expect(screen.getByRole("button", { name: "Starta lektionen utan att lyssna" })).toBeInTheDocument();
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

  it("opens each lesson with its goal and the supplied curriculum wording as a reference", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Fortsätt" }));
    expect(screen.getByText(lessons[0].learnerGoal)).toBeVisible();
    expect(screen.getByText("Eleven skriver olika slags texter med fungerande struktur och god anpassning till texttyp, syfte och mottagare.")).toBeVisible();
    await completeEntry(user);
    // The student-facing goal is repeated when the modelling starts.
    expect(screen.getByText(lessons[0].learnerGoal)).toBeVisible();

    await user.click(screen.getByRole("button", { name: /Meningsbyggnad/ }));
    await user.click(screen.getByRole("button", { name: "Fortsätt" }));
    expect(screen.getByText("Eleven följer språkliga normer på ett i huvudsak fungerande sätt.")).toBeVisible();

    await user.click(screen.getByRole("button", { name: /Slutdiagnos/ }));
    await user.click(screen.getByRole("button", { name: "Fortsätt" }));
    const reference = screen.getByText(/Eleven skriver olika slags texter/);
    expect(reference).toHaveTextContent("Eleven följer språkliga normer på ett i huvudsak fungerande sätt.");
  });

  it("keeps the final diagnosis unsupported until completion and optional feedback", async () => {
    const user = userEvent.setup();
    render(<App />);
    await openDraft(user);

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
    expect(screen.queryByRole("region", { name: "Slutdiagnosens självkontroll" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Få återkoppling" }));
    expect(await screen.findByRole("region", { name: "Återkoppling på ditt utkast" })).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledTimes(requestsBeforeComplete + 1);
    expect(screen.getByText("Förslag på fortsatt övning")).toBeInTheDocument();
    const requestsBeforeHandoff = vi.mocked(fetch).mock.calls.length;
    await user.click(screen.getByRole("button", { name: "Lämna in till läraren (demo)" }));
    expect(fetch).toHaveBeenCalledTimes(requestsBeforeHandoff);
    expect(screen.getByText("Inlämnad i den lokala lärarvyn.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Lärarvy (demoläge)" }));
    const inbox = screen.getByRole("region", { name: "Lärarvy i demoläge" });
    expect(inbox).toHaveTextContent(diagnosisText);
    expect(inbox).toHaveTextContent("Du uttrycker en tydlig tanke.");

    await user.click(screen.getByRole("button", { name: "Stäng" }));
    const checklist = screen.getByRole("region", { name: "Slutdiagnosens självkontroll" });
    expect(checklist).toBeInTheDocument();
    await user.click(screen.getByText("1. Struktur & Innehåll"));
    await user.click(screen.getByLabelText("Jag har en tydlig rubrik som passar ämnet."));
    expect(checklist).toHaveTextContent("1 av 28 markerade");
    const lockedEditor = screen.getByRole("textbox", { name: "Din argumenterande text" }) as HTMLTextAreaElement;
    expect(lockedEditor).toHaveAttribute("readonly");

    await user.click(screen.getByRole("button", { name: "Börja en separat bearbetad version" }));
    const revision = screen.getByRole("textbox", { name: "Din separata bearbetade text" }) as HTMLTextAreaElement;
    expect(revision).toHaveValue(diagnosisText);
    expect(revision).not.toHaveAttribute("readonly");
    expect(checklist).toHaveTextContent("1 av 28 markerade");
    expect(screen.queryByRole("button", { name: "Börja en separat bearbetad version" })).not.toBeInTheDocument();
    await user.clear(revision);
    await user.type(revision, "Bearbetad kopia.");
    await user.click(screen.getByRole("button", { name: "Lärarvy (demoläge)" }));
    const originalSubmission = screen.getByRole("region", { name: "Lärarvy i demoläge" });
    expect(originalSubmission).toHaveTextContent(diagnosisText);
    expect(originalSubmission).not.toHaveTextContent("Bearbetad kopia.");
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
