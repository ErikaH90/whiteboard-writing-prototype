import { act, cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import { exemplarFocus, exemplarTexts, modellingFlow } from "./data/exemplars";
import { finalRecallQuestions, lessons } from "./data/lessons";
import { topicStorageKey, writingTopics } from "./data/topics";
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
// The lesson opens with a welcome where the student chooses what to write about.
async function startLesson(user: ReturnType<typeof userEvent.setup>, topic = "Skoldagen") {
  const choice = screen.queryByRole("button", { name: topic });
  if (choice) await user.click(choice);
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
  await waitFor(() => expect(screen.getByRole("status").querySelector(".edda-star")).toBeInTheDocument());
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

  it("lets the student look for each part first, and has Edda show it after two tries", async () => {
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

    // Found on the first try: a star, and only then the explanation.
    let requests = vi.mocked(fetch).mock.calls.length;
    await user.click(candidates()[0]);
    expect(JSON.parse(String(vi.mocked(fetch).mock.calls[requests][1]?.body))).toMatchObject({
      mode: "choice",
      question: parts[0].ask,
      answer: parts[0].quote,
      isCorrect: true,
      learningContext: { attempt: 1 },
    });
    await waitFor(() => expect(screen.getByRole("status").querySelector(".edda-star")).toBeInTheDocument());
    expect(screen.getByText(parts[0].explain!)).toBeVisible();
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
    expect(screen.getByRole("status").querySelector(".edda-star")).not.toBeInTheDocument();
    expect(screen.queryByText(parts[1].explain!)).not.toBeInTheDocument();
    expect(candidates().length).toBe(parts.length);

    requests = vi.mocked(fetch).mock.calls.length;
    await user.click(candidates()[2]);
    expect(JSON.parse(String(vi.mocked(fetch).mock.calls[requests][1]?.body))).toMatchObject({
      isCorrect: false,
      learningContext: { attempt: 2 },
    });
    expect(await screen.findByText("Edda visar stället i texten.")).toBeVisible();
    expect(screen.getByText(parts[1].explain!)).toBeVisible();
    expect(marks()).toEqual([parts[1].quote]);
    expect(document.querySelector(".edda-star")).not.toBeInTheDocument();
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
      expect(screen.getByText(`”${part.quote}”`)).toBeVisible();
      expect(within(surface).queryByRole("button", { name: /Lyssna/ })).not.toBeInTheDocument();
    }
    expect(screen.queryByRole("button", { name: "Visa föregående del" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Fortsätt" })).not.toBeInTheDocument();

    // The student cannot switch between the exemplar and their own text; Edda decides.
    expect(screen.queryByRole("button", { name: "Din text" })).not.toBeInTheDocument();
    expect(screen.queryByRole("textbox", { name: "Din argumenterande text" })).not.toBeInTheDocument();

    // With the writing task the surface changes to the student's own text, with the saved draft.
    await user.click(screen.getByRole("button", { name: /Nästa steg/ }));
    await user.click(screen.getByRole("button", { name: "Fortsätt" }));
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
    // Before writing, Edda shows a better and a weaker example and the student chooses the better one.
    expect(screen.getByText(lesson.model.question)).toBeVisible();
    expect(screen.queryByText(lesson.practice)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Fortsätt" })).not.toBeInTheDocument();
    const examples = screen.getByRole("group", { name: "Välj ett exempel" });
    expect(within(examples).getByText("EXEMPEL A")).toBeInTheDocument();
    expect(within(examples).queryByText("MER UTVECKLAT")).not.toBeInTheDocument();
    await user.click(within(examples).getByRole("button", { name: new RegExp(lesson.model.strong.slice(0, 30)) }));
    await waitFor(() => expect(screen.getByRole("status").querySelector(".edda-star")).toBeInTheDocument());
    expect(within(examples).getByText("MER UTVECKLAT")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Fortsätt" }));

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
    expect(fetch).toHaveBeenCalledTimes(requestsBefore + 1);
    expect(JSON.parse(String(vi.mocked(fetch).mock.calls[requestsBefore][1]?.body))).toMatchObject({
      draft: taskDraft,
      task: lesson.practice,
    });
    const eddaSays = await screen.findByRole("status");
    expect(eddaSays).toHaveTextContent("Du uttrycker en tydlig tanke.");
    expect(eddaSays.querySelector(".edda-star")).toBeInTheDocument();
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
    expect(fetch).toHaveBeenCalledTimes(requestsBeforeRetry + 1);
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

    for (const part of parts) {
      await user.click(screen.getByRole("button", { name: "Fortsätt" }));
      await user.click(within(surface).getAllByRole("button")[0]);
      // Edda cannot answer, so she shows the place and the student can go on.
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
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(screen.queryByText(lessons[0].hook)).not.toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();

    // The choice becomes the writing task, and the lesson starts.
    await user.click(screen.getByRole("button", { name: "Mobilen i skolan" }));
    expect(screen.queryByRole("heading", { name: "Välkommen!" })).not.toBeInTheDocument();
    expect(screen.getByText(lessons[0].hook)).toBeVisible();
    expect(surface).toBeEmptyDOMElement();
    expect(window.localStorage.getItem(topicStorageKey)).toBe("phones");

    await openDraft(user);
    expect(screen.getByText("Ta ställning: Borde mobiler vara förbjudna under hela skoldagen?")).toBeVisible();
    expect(screen.queryByText(/Borde skoldagen börja senare/)).not.toBeInTheDocument();
  });

  it("reduces visible support as the student progresses", async () => {
    const user = userEvent.setup();
    render(<App />);

    await completeEntry(user);
    await user.click(screen.getByRole("button", { name: /Nästa steg/ }));
    await user.click(screen.getByRole("button", { name: "Fortsätt" }));
    await user.click(screen.getByRole("button", { name: "Visa en ledtråd" }));
    expect(screen.getByText(/En tes tar tydlig ställning/)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Nästa steg/ }));
    expect(screen.queryByText(/En tes tar tydlig ställning/)).not.toBeInTheDocument();
    expect(screen.getByText("Försök utan stöd")).toBeInTheDocument();
  });

  it("opens each lesson with its goal and the supplied curriculum wording as a reference", async () => {
    const user = userEvent.setup();
    render(<App />);

    await startLesson(user);
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
