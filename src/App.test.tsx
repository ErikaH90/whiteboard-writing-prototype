import { act, cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import { exemplarFocus, exemplarTexts, modellingFlow } from "./data/exemplars";
import { finalRecallQuestions, lessons } from "./data/lessons";
import { topicStorageKey, writingTopics } from "./data/topics";
import { clearExemplarAudioCache } from "./lib/exemplarAudio";
import { learnerProfileKey } from "./lib/learnerProfile";
import { effortTimes } from "./lib/effort";

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
// The lesson opens with a welcome where the student chooses what to write about.
async function startLesson(user: ReturnType<typeof userEvent.setup>, topic = "Skoldagen") {
  const choice = screen.queryByRole("button", { name: topic });
  if (!choice) return;
  await user.click(choice);
  // The student also chooses who the text is written for.
  await user.click(screen.getByRole("button", { name: "Rektorn" }));
}

async function openEntryQuestion(user: ReturnType<typeof userEvent.setup>) {
  await startLesson(user);
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

// Edda decides what the writing surface shows: the student's own text appears with the chapter's
// writing task, after the walk-through of the exemplar.
async function openDraft(user: ReturnType<typeof userEvent.setup>) {
  if (screen.queryByRole("textbox", { name: "Din argumenterande text" })) return;
  await completeEntry(user);
  await user.click(screen.getByRole("button", { name: /Nästa steg/ }));
}

// The student finds a place themselves by clicking it in the text beside the whiteboard.
async function findInText(user: ReturnType<typeof userEvent.setup>, quote: string) {
  const surface = screen.getByRole("region", { name: "Exempeltext" });
  await user.click(within(surface).getAllByRole("button").find((button) => button.textContent === quote)!);
  await waitFor(() => expect(screen.getByRole("status").querySelector(".edda-mark")).toBeInTheDocument());
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
  // Most tests move freely between chapters and steps; the guided progression has its own tests.
  window.history.replaceState({}, "", "/?fri");
  window.localStorage.clear();
  // Help normally comes out after the student has worked for a while; most tests do not wait for it.
  effortTimes.hint = 0;
  effortTimes.reveal = 0;
  effortTimes.idle = 45_000;
  effortTimes.writingIdle = 90_000;
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
    // The strength is marked in the text too, as visibly as what can be developed.
    expect(document.querySelector(".strength-mark")).toHaveTextContent("Jag");
    expect(document.querySelectorAll(".finding-mark")).toHaveLength(1);
    expect(document.querySelector(".finding-mark.is-develop")).not.toBeInTheDocument();
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

    await openDraft(user);
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

  it("lets the student look for each part first, and has Edda show it by herself when the student is stuck", async () => {
    const user = userEvent.setup();
    render(<App />);
    const lesson = lessons[0];
    const parts = exemplarFocus.structure.highlights.strong;

    await completeEntry(user);
    expect(screen.getByText(lesson.learnerGoal)).toBeVisible();
    const surface = screen.getByRole("region", { name: "Exempeltext" });
    const candidates = () => within(surface).getAllByRole("button");
    const marks = () => [...surface.querySelectorAll("mark")].map((mark) => mark.firstChild?.textContent);

    // The whiteboard asks first. Nothing is shown or explained yet, and every part can be clicked.
    await user.click(screen.getByRole("button", { name: "Fortsätt" }));
    expect(screen.getByText(parts[0].ask!)).toBeVisible();
    expect(screen.queryByText(parts[0].explain!)).not.toBeInTheDocument();
    expect(screen.queryByText(`”${parts[0].quote}”`)).not.toBeInTheDocument();
    expect(candidates().map((button) => button.textContent)).toEqual(parts.map((part) => part.quote));
    expect(marks()).toEqual([]);

    // Found: the board then holds only what Edda says about the place, in her speech bubble. The
    // place is lit in the text, so it is not repeated on the board, and no reading by the AI is needed.
    let requests = vi.mocked(fetch).mock.calls.length;
    await user.click(candidates()[0]);
    const eddaSays = screen.getByRole("status");
    expect(eddaSays).toHaveTextContent(`Edda${parts[0].explain!}`);
    expect(eddaSays.querySelector(".edda-mark")).toBeInTheDocument();
    expect(screen.queryByText(`”${parts[0].quote}”`)).not.toBeInTheDocument();
    expect(fetch).toHaveBeenCalledTimes(requests);
    expect(marks()).toEqual([parts[0].quote]);
    expect(within(surface).queryByRole("button")).not.toBeInTheDocument();

    // A wrong try gives a nudge and another chance; after the second wrong try Edda shows the place.
    await user.click(screen.getByRole("button", { name: "Fortsätt" }));
    expect(screen.getByText(parts[1].ask!)).toBeVisible();
    vi.mocked(fetch).mockImplementation(async () => new Response(
      JSON.stringify({ kind: "retry", feedback: "Inte riktigt. Var säger skribenten vad hen vill?" }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    ));
    await user.click(candidates()[0]);
    expect(await screen.findByText("Inte riktigt. Var säger skribenten vad hen vill?")).toBeVisible();
    expect(screen.getByRole("status").querySelector(".edda-mark")).not.toBeInTheDocument();
    expect(screen.queryByText(parts[1].explain!)).not.toBeInTheDocument();
    expect(candidates().length).toBe(parts.length);

    requests = vi.mocked(fetch).mock.calls.length;
    await user.click(candidates()[2]);
    expect(JSON.parse(String(vi.mocked(fetch).mock.calls[requests][1]?.body))).toMatchObject({
      isCorrect: false,
      learningContext: { attempt: 2 },
    });
    // After a second try and a while on the question Edda shows the place by herself; there is nothing to press.
    expect(screen.queryByRole("button", { name: "Visa stället" })).not.toBeInTheDocument();
    expect(await screen.findByText(parts[1].explain!)).toBeVisible();
    expect(screen.queryByText("Inte riktigt. Var säger skribenten vad hen vill?")).not.toBeInTheDocument();
    expect(marks()).toEqual([parts[1].quote]);
    expect(document.querySelector(".edda-mark")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Fortsätt" })).toBeInTheDocument();
  });

  it("starts with a simple retrieval question, then listening, then highlights tied to the lesson", async () => {
    const user = userEvent.setup();
    render(<App />);

    window.localStorage.setItem("skrivcoach-argumenterande-draft", "Sparat utkast från ett tidigare besök.");
    cleanup();
    render(<App />);
    await startLesson(user);
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

    // The student looks for each part; once found it is the only one lit and the rest is blurred.
    const parts = exemplarFocus.structure.highlights.strong;
    for (const [index, part] of parts.entries()) {
      await user.click(screen.getByRole("button", { name: "Fortsätt" }));
      expect(screen.getByText(`${index + 1} AV ${parts.length}`)).toBeVisible();
      expect(within(surface).getByRole("article")).not.toHaveClass("is-focusing");
      await findInText(user, part.quote);
      expect([...surface.querySelectorAll("mark")].map((mark) => mark.firstChild?.textContent)).toEqual([part.quote]);
      expect(surface.querySelector("mark")).toHaveClass("is-focus");
      expect(within(surface).getByRole("article")).toHaveClass("is-focusing");
      // The quote is lit in the text and is not repeated on the whiteboard.
      expect(screen.queryByText(`”${part.quote}”`)).not.toBeInTheDocument();
      expect(screen.getByText(part.explain!)).toBeVisible();
      expect(within(surface).queryByRole("button", { name: /Lyssna/ })).not.toBeInTheDocument();
    }
    expect(screen.queryByRole("button", { name: "Visa föregående del" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Fortsätt" })).not.toBeInTheDocument();

    // The student cannot switch between the exemplar and their own text; Edda decides.
    expect(screen.queryByRole("button", { name: "Din text" })).not.toBeInTheDocument();
    expect(screen.queryByRole("textbox", { name: "Din argumenterande text" })).not.toBeInTheDocument();

    // With the writing task the surface changes to the student's own text, with the saved draft.
    // This student found every place alone, so there is no example to look at first.
    await user.click(screen.getByRole("button", { name: /Nästa steg/ }));
    expect(screen.getByText(lessons[0].practice)).toBeVisible();
    expect(screen.getByRole("textbox", { name: "Din argumenterande text" })).toHaveValue("Sparat utkast från ett tidigare besök.");
    expect(screen.queryByRole("region", { name: "Exempeltext" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Exempeltext" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Nästa steg/ }));
    expect(screen.getByText("Försök utan stöd")).toBeInTheDocument();
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

  it("guides the student forward one step at a time when navigation is not unlocked", async () => {
    window.history.replaceState({}, "", "/");
    const user = userEvent.setup();
    render(<App />);
    const lesson = lessons[0];

    // Other chapters cannot be opened, and there is no way back.
    expect(screen.getByRole("button", { name: /Resonemang/ })).toBeDisabled();
    expect(screen.getByRole("button", { name: /Slutdiagnos/ })).toBeDisabled();
    await completeEntry(user);
    expect(screen.queryByRole("button", { name: "Tillbaka" })).not.toBeInTheDocument();

    // The next step stays closed until the student has found, or been shown, every part.
    const next = () => screen.getByRole("button", { name: /Nästa steg/ });
    expect(next()).toBeDisabled();
    const parts = exemplarFocus.structure.highlights.strong;
    for (const [index, part] of parts.entries()) {
      await user.click(screen.getByRole("button", { name: "Fortsätt" }));
      // The board holds the student on each question until it is answered.
      expect(screen.getByText(part.ask!)).toBeVisible();
      expect(screen.queryByRole("button", { name: "Fortsätt" })).not.toBeInTheDocument();
      expect(next()).toBeDisabled();
      await findInText(user, part.quote);
      if (index < parts.length - 1) expect(next()).toBeDisabled();
    }
    expect(next()).toBeEnabled();

    // The chapter's writing task: the student's own text takes over the writing surface.
    await user.click(next());
    // This student found every place alone, so Edda steps back by herself: no example first, and she says why.
    expect(screen.queryByText(lesson.model.question)).not.toBeInTheDocument();
    expect(screen.getByText("Du hittade ställena i exempeltexten själv, så du går direkt till din uppgift.")).toBeVisible();
    expect(screen.getByText(lesson.practice)).toBeVisible();
    expect(screen.getByText("Börja med att skriva din inledning med tes.")).toBeVisible();
    const editor = screen.getByRole("textbox", { name: "Din argumenterande text" });
    expect(next()).toBeDisabled();
    expect(screen.getByRole("button", { name: "Jag är klar – låt Edda läsa" })).toBeDisabled();
    const requestsBefore = vi.mocked(fetch).mock.calls.length;
    const taskDraft = "Jag tycker att skoldagen borde börja senare. Jag tycker att elever är trötta på morgonen.";
    await user.type(editor, taskDraft);
    expect(fetch).toHaveBeenCalledTimes(requestsBefore);

    // When the student is done, Edda reads the text: one strength and one thing to try, both marked in the text.
    await user.click(screen.getByRole("button", { name: "Jag är klar – låt Edda läsa" }));
    expect(JSON.parse(String(vi.mocked(fetch).mock.calls[requestsBefore][1]?.body))).toMatchObject({
      draft: taskDraft,
      task: lesson.practice,
    });
    // The same hand-in lets Edda bring the writing map up to date; it needs no click of its own.
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(requestsBefore + 2));
    expect(String(vi.mocked(fetch).mock.calls[requestsBefore + 1][0])).toContain("/api/progress-map");
    expect(JSON.parse(String(vi.mocked(fetch).mock.calls[requestsBefore + 1][1]?.body))).toMatchObject({
      draft: taskDraft,
      // The chapter's own part and the next chapter's, so that Edda knows what the text already shows.
      skills: ["structure", "reasoning"],
    });
    const eddaSays = await screen.findByRole("status");
    expect(eddaSays).toHaveTextContent("Du uttrycker en tydlig tanke.");
    expect(eddaSays.querySelector(".edda-mark")).toBeInTheDocument();
    expect(screen.getByText("Att pröva")).toBeVisible();
    expect(screen.getByText("Behöver varje mening börja så?")).toBeVisible();
    expect(screen.getByText(lesson.taskLink)).toBeVisible();
    expect(document.querySelector(".strength-mark")).toHaveTextContent("Jag");
    expect(document.querySelectorAll(".finding-mark.is-develop")).toHaveLength(1);
    // The summary above the text belongs to feedback the student asks for; here Edda answers on the board.
    expect(screen.queryByRole("region", { name: "Återkoppling på ditt utkast" })).not.toBeInTheDocument();
    expect(editor).toHaveValue(taskDraft);
    expect(next()).toBeEnabled();

    // The loop is closed: the student tries the advice in the text and Edda looks again.
    expect(screen.getByText("Pröva det i din text. Sedan kan Edda titta igen.")).toBeVisible();
    await user.type(editor, " Dessutom orkar man mer.");
    expect(screen.getByText("Behöver varje mening börja så?")).toBeVisible();
    const requestsBeforeRetry = vi.mocked(fetch).mock.calls.length;
    await user.click(screen.getByRole("button", { name: "Jag har prövat – låt Edda titta igen" }));
    expect(JSON.parse(String(vi.mocked(fetch).mock.calls[requestsBeforeRetry][1]?.body))).toMatchObject({
      draft: `${taskDraft} Dessutom orkar man mer.`,
      task: lesson.practice,
      followUp: "Behöver varje mening börja så?",
    });
    expect(await screen.findByText("Du prövade, och din text förändrades. Så arbetar en skribent.")).toBeVisible();
    expect(screen.queryByRole("button", { name: /Jag har prövat/ })).not.toBeInTheDocument();
    expect(editor).toHaveValue(`${taskDraft} Dessutom orkar man mer.`);

    // Recall without support: closed until the student has answered.
    await user.click(next());
    expect(next()).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "Fortsätt" }));
    await user.type(screen.getByRole("textbox", { name: "Ditt svar" }), "Tesen är det skribenten vill övertyga om.");
    await user.click(screen.getByRole("button", { name: "Svara" }));
    await screen.findByRole("status");
    expect(next()).toBeEnabled();
    expect(screen.getByRole("button", { name: /Resonemang/ })).toBeDisabled();
  });

  it("does not lock the student in a step when the AI service fails", async () => {
    window.history.replaceState({}, "", "/");
    const user = userEvent.setup();
    render(<App />);
    await completeEntry(user);
    const parts = exemplarFocus.structure.highlights.strong;
    vi.stubGlobal("fetch", vi.fn(async () => new Response(
      JSON.stringify({ error: "AI-tjänsten är inte tillgänglig." }),
      { status: 503, headers: { "Content-Type": "application/json" } },
    )));
    const surface = screen.getByRole("region", { name: "Exempeltext" });

    for (const [index, part] of parts.entries()) {
      await user.click(screen.getByRole("button", { name: "Fortsätt" }));
      // A place that is not the one asked for: Edda cannot answer, so she shows the place and the student can go on.
      await user.click(within(surface).getAllByRole("button")[index === 0 ? 1 : 0]);
      expect(await screen.findByRole("alert")).toHaveTextContent("AI-tjänsten är inte tillgänglig.");
      expect(screen.getByText(part.explain!)).toBeVisible();
    }
    expect(screen.getByRole("button", { name: /Nästa steg/ })).toBeEnabled();
  });

  it.each([
    ["Resonemang", "reasoning", "Tesen visar vad skribenten tycker."],
    ["Textbindning", "cohesion", "Ett argument förklaras och får stöd."],
    ["Meningsbyggnad", "sentence", "Sambandsord visar hur tankar hänger ihop."],
  ] as const)("lets the student do the finding in chapter %s, in the comparisons and in the text", async (chapter, skill, entryAnswer) => {
    const user = userEvent.setup();
    render(<App />);
    const focus = exemplarFocus[skill];
    const parts = focus.highlights.strong;

    await completeEntry(user);
    await user.click(screen.getByRole("button", { name: new RegExp(chapter) }));
    await completeEntry(user, entryAnswer);
    const surface = screen.getByRole("region", { name: "Exempeltext" });
    const marks = () => [...surface.querySelectorAll("mark")].map((mark) => mark.firstChild?.textContent);

    for (const step of modellingFlow(focus)) {
      await user.click(screen.getByRole("button", { name: "Fortsätt" }));

      if ("compare" in step) {
        // Both examples are shown in full first.
        const comparison = focus.comparisons![step.compare];
        expect(screen.getByText(comparison.title)).toBeVisible();
        expect(within(surface).getByRole("heading", { name: comparison.simpleLabel })).toBeInTheDocument();
        expect(within(surface).getByRole("heading", { name: comparison.developedLabel })).toBeInTheDocument();
        expect(marks()).toEqual([]);

        for (const pair of comparison.pairs) {
          // One part is lit in the first example; the student finds what it became in the second.
          await user.click(screen.getByRole("button", { name: "Fortsätt" }));
          expect(marks()).toEqual([pair.simple]);
          expect(screen.queryByText(pair.explain)).not.toBeInTheDocument();
          expect(within(surface).getAllByRole("button").map((button) => button.textContent).sort()).toEqual(
            comparison.pairs.map((item) => item.developed).sort(),
          );
          await findInText(user, pair.developed);
          expect(screen.getByText(pair.explain)).toBeVisible();
          expect(marks()).toEqual([pair.simple, pair.developed]);
        }
      } else {
        // The whiteboard asks, the student finds the place, and only then Edda explains.
        const part = parts[step.part];
        expect(screen.getByText(part.ask!)).toBeVisible();
        expect(screen.queryByText(part.explain!)).not.toBeInTheDocument();
        await findInText(user, part.quote);
        expect(screen.getByText(part.explain!)).toBeVisible();
        expect(marks()).toEqual([part.quote]);
        if (part.related) expect(screen.getByText(part.related.words.join(" · "))).toBeVisible();
      }
    }
    expect(screen.queryByRole("button", { name: "Fortsätt" })).not.toBeInTheDocument();
  });

  it("makes the self-check an action: the student marks the place in their own text", async () => {
    const user = userEvent.setup();
    render(<App />);
    const lesson = lessons[0];

    await openDraft(user);
    const editor = screen.getByRole("textbox", { name: "Din argumenterande text" }) as HTMLTextAreaElement;
    await user.type(editor, "Senare skolstart\n\nSkoldagen borde börja senare.");
    await user.click(screen.getByRole("button", { name: /Nästa steg/ }));
    await user.click(screen.getByRole("button", { name: /Nästa steg/ }));

    expect(screen.getByText("Din egenkontroll")).toBeVisible();
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
    const items = screen.getAllByRole("listitem");
    expect(items.map((item) => within(item).getByText(/./, { selector: ".self-check-statement *, .self-check-statement" }).textContent)).toEqual(lesson.checklist);

    // Edda points out the place on the student's request; she only points and the text is untouched.
    vi.mocked(fetch).mockImplementation(async (input, init) => {
      if (String(input) !== "/api/locate") return new Response(JSON.stringify({ error: "nej" }), { status: 500 });
      const body = JSON.parse(String(init?.body)) as { draft: string; statement: string };
      expect(body.statement).toBe(lesson.checklist[2]);
      const start = body.draft.indexOf("Skoldagen");
      return new Response(JSON.stringify({ found: true, start, end: body.draft.length, quote: body.draft.slice(start) }), { status: 200 });
    });
    await user.click(within(items[2]).getByRole("button", { name: "Visa var i din text" }));
    await waitFor(() => expect(items[2]).toHaveClass("is-marked"));
    expect(within(items[2]).getByText("Skoldagen borde börja senare.")).toBeVisible();
    expect(document.querySelector(".self-mark")).toHaveTextContent("Skoldagen borde börja senare.");
    expect(items[0]).not.toHaveClass("is-marked");
    expect(editor).toHaveValue("Senare skolstart\n\nSkoldagen borde börja senare.");

    // When the text does not show the statement, Edda says so instead of marking something.
    vi.mocked(fetch).mockImplementation(async () => new Response(JSON.stringify({ found: false }), { status: 200 }));
    await user.click(within(items[0]).getByRole("button", { name: "Visa var i din text" }));
    expect(await within(items[0]).findByRole("status")).toHaveTextContent("Edda hittar inte det i din text än");
    expect(items[0]).not.toHaveClass("is-marked");
    expect(document.querySelector(".self-mark")).not.toBeInTheDocument();
  });

  it("opens with a welcome where the student chooses what to write about and sees how the lesson works", async () => {
    const user = userEvent.setup();
    render(<App />);

    expect(screen.getByRole("heading", { name: "Välkommen!" })).toBeVisible();
    expect(screen.getByText(/Hej! Jag heter Edda\./)).toBeVisible();
    const choices = within(screen.getByRole("group", { name: "Välj vad du vill skriva om" })).getAllByRole("button");
    expect(choices.map((choice) => choice.textContent)).toEqual(writingTopics.map((topic) => `${topic.icon}${topic.label}`));

    // The writing surface shows how the lesson works: the six chapters and what happens in each.
    const surface = screen.getByRole("region", { name: "Elevens skrivyta" });
    expect(within(surface).getByRole("heading", { name: "Så här går lektionen till" })).toBeVisible();
    expect(within(surface).getAllByRole("listitem").map((item) => item.textContent)).toEqual(lessons.map((lesson) => lesson.title));
    expect(screen.queryByRole("textbox", { name: "Din argumenterande text" })).not.toBeInTheDocument();
    expect(screen.queryByText(lessons[0].hook)).not.toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();

    // After the topic the student chooses who the text should convince; then the lesson starts.
    await user.click(screen.getByRole("button", { name: "Mobilen i skolan" }));
    expect(screen.getByText("Vem vill du övertyga med din text?")).toBeVisible();
    expect(screen.getByRole("heading", { name: "Välkommen!" })).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Kommunens politiker" }));
    expect(screen.queryByRole("heading", { name: "Välkommen!" })).not.toBeInTheDocument();
    expect(screen.getByText(lessons[0].hook)).toBeVisible();
    expect(surface).toBeEmptyDOMElement();
    expect(window.localStorage.getItem(topicStorageKey)).toBe("phones");

    await openDraft(user);
    expect(screen.getByText("Ta ställning: Borde mobiler vara förbjudna under hela skoldagen?")).toBeVisible();
    expect(screen.getByText("Du skriver för att övertyga kommunens politiker.")).toBeVisible();
    expect(screen.queryByText(/Borde skoldagen börja senare/)).not.toBeInTheDocument();
  });

  it("lets the student write about a topic of their own and for a reader of their own", async () => {
    const user = userEvent.setup();
    render(<App />);

    // Too short to be a question: the student's own topic cannot be chosen yet.
    expect(screen.getByRole("button", { name: "Välj mitt ämne" })).toBeDisabled();
    await user.type(screen.getByRole("textbox", { name: /Vilken fråga vill du ta ställning i/ }), "Borde läxor avskaffas?");
    await user.click(screen.getByRole("button", { name: "Välj mitt ämne" }));
    await user.type(screen.getByRole("textbox", { name: /Eller någon annan/ }), "mina föräldrar");
    await user.click(screen.getByRole("button", { name: "Välj min mottagare" }));

    expect(screen.getByText(lessons[0].hook)).toBeVisible();
    expect(window.localStorage.getItem(topicStorageKey)).toBe("own:Borde läxor avskaffas?");
    expect(fetch).not.toHaveBeenCalled();
    await openDraft(user);
    expect(screen.getByText("Ta ställning: Borde läxor avskaffas?")).toBeVisible();
    expect(screen.getByText("Du skriver för att övertyga mina föräldrar.")).toBeVisible();
  });

  it("explains more briefly by itself while the student finds the places at the first try, and says so once", async () => {
    const user = userEvent.setup();
    render(<App />);
    const parts = exemplarFocus.structure.highlights.strong;
    await completeEntry(user);
    const clickInText = async (quote: string) => {
      const surface = screen.getByRole("region", { name: "Exempeltext" });
      await user.click(within(surface).getAllByRole("button").find((button) => button.textContent === quote)!);
    };

    await user.click(screen.getByRole("button", { name: "Fortsätt" }));
    await findInText(user, parts[0].quote);
    await user.click(screen.getByRole("button", { name: "Fortsätt" }));
    await findInText(user, parts[1].quote);
    // Nothing is asked of the student: there is no offer and no choice to make.
    expect(screen.queryByRole("group", { name: "Välj hur du vill fortsätta" })).not.toBeInTheDocument();

    // Two in a row: on the next question Edda says, once, that she now explains more briefly.
    await user.click(screen.getByRole("button", { name: "Fortsätt" }));
    expect(screen.getByText("Du hittar ställena själv, så jag förklarar kortare nu.")).toBeVisible();
    const requests = vi.mocked(fetch).mock.calls.length;
    await clickInText(parts[2].quote);
    expect(screen.getByRole("status")).toHaveTextContent(parts[2].explain!);
    expect(fetch).toHaveBeenCalledTimes(requests);
    await user.click(screen.getByRole("button", { name: "Fortsätt" }));
    expect(screen.queryByText("Du hittar ställena själv, så jag förklarar kortare nu.")).not.toBeInTheDocument();

    // A miss gets Edda's short question; then the student finds the place and goes on.
    await clickInText(parts[5].quote);
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(requests + 1));
    await findInText(user, parts[3].quote);
    expect(fetch).toHaveBeenCalledTimes(requests + 1);
  });

  it("gives help by itself when the student is stuck, and keeps the example for the one who needed it", async () => {
    window.history.replaceState({}, "", "/");
    const user = userEvent.setup();
    render(<App />);
    const lesson = lessons[0];
    const parts = exemplarFocus.structure.highlights.strong;
    await completeEntry(user);
    const clickInText = async (quote: string) => {
      const surface = screen.getByRole("region", { name: "Exempeltext" });
      await user.click(within(surface).getAllByRole("button").find((button) => button.textContent === quote)!);
    };

    await user.click(screen.getByRole("button", { name: "Fortsätt" }));
    // No hint before a first try, and never a button to ask for one.
    expect(screen.queryByText(/Ett första steg/)).not.toBeInTheDocument();
    await clickInText(parts[3].quote);
    expect(await screen.findByText("Ett första steg: titta i rubriken.")).toBeVisible();
    expect(screen.queryByRole("button", { name: "Jag vill ha en ledtråd" })).not.toBeInTheDocument();
    // After a second try Edda shows the place by herself.
    await clickInText(parts[4].quote);
    expect(await screen.findByText(parts[0].explain!)).toBeVisible();
    expect(document.querySelector(".edda-mark")).not.toBeInTheDocument();
    for (const part of parts.slice(1)) {
      await user.click(screen.getByRole("button", { name: "Fortsätt" }));
      await findInText(user, part.quote);
    }
    await user.click(screen.getByRole("button", { name: /Nästa steg/ }));

    // The example before the writing task stays part of the lesson, without any remark about why.
    expect(screen.getByText(lesson.model.question)).toBeVisible();
    expect(screen.queryByText(/så du går direkt till din uppgift/)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Fortsätt" })).not.toBeInTheDocument();
  });

  it("brings help only when the student has tried for a while or stood still, not after quick clicks", async () => {
    effortTimes.hint = 250;
    effortTimes.reveal = 700;
    const user = userEvent.setup();
    render(<App />);
    const parts = exemplarFocus.structure.highlights.strong;
    await completeEntry(user);
    await user.click(screen.getByRole("button", { name: "Fortsätt" }));
    const clickInText = async (quote: string) => {
      const surface = screen.getByRole("region", { name: "Exempeltext" });
      await user.click(within(surface).getAllByRole("button").find((button) => button.textContent === quote)!);
    };

    // Two quick misses: no hint yet, and Edda does not show the place.
    await clickInText(parts[3].quote);
    await clickInText(parts[4].quote);
    await screen.findByRole("status");
    expect(screen.queryByText(/Ett första steg/)).not.toBeInTheDocument();
    expect(screen.queryByText(parts[0].explain!)).not.toBeInTheDocument();

    // After a while the hint comes by itself, and later still Edda shows the place.
    expect(await screen.findByText("Ett första steg: titta i rubriken.")).toBeVisible();
    expect(screen.queryByText(parts[0].explain!)).not.toBeInTheDocument();
    expect(await screen.findByText(parts[0].explain!)).toBeVisible();
  });

  it("gives a first step by itself when nothing has happened for a long while", async () => {
    effortTimes.idle = 200;
    const user = userEvent.setup();
    render(<App />);
    await completeEntry(user);
    await user.click(screen.getByRole("button", { name: "Fortsätt" }));

    expect(screen.queryByText(/Ett första steg/)).not.toBeInTheDocument();
    expect(await screen.findByText("Ett första steg: titta i rubriken.")).toBeVisible();
  });

  it("lets Edda read the writing task only when the student has written something new", async () => {
    const user = userEvent.setup();
    render(<App />);
    await openDraft(user);
    while (!screen.queryByText(lessons[0].practice)) await user.click(screen.getByRole("button", { name: "Fortsätt" }));

    const handIn = screen.getByRole("button", { name: "Jag är klar – låt Edda läsa" });
    const editor = screen.getByRole("textbox", { name: "Din argumenterande text" });
    expect(handIn).toBeDisabled();
    await user.type(editor, "Hej hej");
    expect(handIn).toBeDisabled();
    await user.type(editor, " Skoldagen borde börja senare.");
    expect(handIn).toBeEnabled();
  });

  it("reduces visible support as the student progresses", async () => {
    const user = userEvent.setup();
    render(<App />);

    await completeEntry(user);
    effortTimes.writingIdle = 150;
    await user.click(screen.getByRole("button", { name: /Nästa steg/ }));
    await user.click(screen.getByRole("button", { name: "Fortsätt" }));
    // When the text stands still in the writing task, Edda gives a first step by herself.
    expect(screen.queryByText(/En tes tar tydlig ställning/)).not.toBeInTheDocument();
    expect(await screen.findByText(/Ett första steg: En tes tar tydlig ställning/)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Nästa steg/ }));
    expect(screen.queryByText(/En tes tar tydlig ställning/)).not.toBeInTheDocument();
    expect(screen.getByText("Försök utan stöd")).toBeInTheDocument();
  });

  it("opens each lesson with its goal and why it is worth the effort, now and for the grade in Swedish", async () => {
    const user = userEvent.setup();
    render(<App />);

    await startLesson(user);
    await user.click(screen.getByRole("button", { name: "Fortsätt" }));
    expect(screen.getByText(lessons[0].learnerGoal)).toBeVisible();
    expect(screen.getByText(lessons[0].worth)).toBeVisible();
    await completeEntry(user);
    // The student-facing goal is repeated when the modelling starts.
    expect(screen.getByText(lessons[0].learnerGoal)).toBeVisible();

    await user.click(screen.getByRole("button", { name: /Meningsbyggnad/ }));
    await user.click(screen.getByRole("button", { name: "Fortsätt" }));
    expect(screen.getByText(lessons[3].worth)).toBeVisible();

    // Every chapter says what the work does for the student's own text; none promises a grade level.
    for (const lesson of lessons) {
      expect(lesson.worth).toMatch(/svenska/);
      expect(lesson.worth).not.toMatch(/\b[A-F]\b|betyget [A-F]/);
    }
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
    // The checklist comes back as the student's own check while the diagnosis can still be changed.
    const checklist = screen.getByRole("region", { name: "Slutdiagnosens självkontroll" });
    expect(checklist).toHaveTextContent("INFÖR INLÄMNING");
    await user.click(screen.getByText("1. Struktur & Innehåll"));
    await user.click(screen.getByLabelText("Jag har en tydlig rubrik som passar ämnet."));
    expect(checklist).toHaveTextContent("1 av 28 markerade");
    await user.type(editor, "Jag tycker ungdomar borde få åka gratis med kollektivtrafiken. Jag tycker det kan göra fler aktiviteter möjliga.");
    const diagnosisText = editor.value;
    expect(window.localStorage.getItem("skrivcoach-argumenterande-draft")).toBe(trainingDraft);
    await user.click(screen.getByRole("button", { name: "Markera slutdiagnosen som klar" }));

    expect(fetch).toHaveBeenCalledTimes(requestsBeforeComplete);
    expect(screen.getByRole("status")).toHaveTextContent("AI-återkoppling är valfri.");

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
    // On the locked original the points are put away; they return with the separate copy.
    expect(checklist).toHaveTextContent("EFTER INLÄMNING");
    expect(screen.queryByLabelText("Jag har en tydlig rubrik som passar ämnet.")).not.toBeInTheDocument();
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
