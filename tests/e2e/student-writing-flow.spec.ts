import { expect, test } from "@playwright/test";

// The exemplar text is introduced once per session, right after the first entry question.
async function skipListening(page: import("@playwright/test").Page) {
  await page.getByRole("button", { name: "Starta lektionen utan att lyssna" }).click();
}

// Edda's voice is never fetched from the real speech service in tests: without it the text is
// shown directly, which is what the other tests rely on.
test.beforeEach(async ({ page }) => {
  // Handing in a writing task also brings the writing map up to date. Tests never reach the real
  // AI service: the map answers here that it has nothing to show, unless a test gives it a reading.
  await page.route("**/api/progress-map", async (route) => {
    await route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ error: "Inte konfigurerad." }) });
  });
  await page.route("**/api/speech", async (route) => {
    await route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({ error: "Uppläsning är inte konfigurerad på servern." }),
    });
  });
});

// The lesson opens with a welcome where the student chooses what to write about.
async function startLesson(page: import("@playwright/test").Page) {
  await page.getByRole("button", { name: "Skoldagen" }).click();
  // The student also chooses who the text is written for.
  await page.getByRole("button", { name: "Rektorn" }).click();
}

async function completeEntry(
  page: import("@playwright/test").Page,
  answer = "En tes visar skribentens ståndpunkt.",
  firstExemplarMeeting = true,
) {
  // Each lesson opens with an attention line and the goal before the entry question.
  await page.getByRole("button", { name: "Fortsätt", exact: true }).click();
  await page.getByRole("button", { name: "Fortsätt", exact: true }).click();
  await page.getByRole("textbox", { name: "Ditt svar, utan ledtråd" }).fill(answer);
  await page.getByRole("button", { name: "Svara" }).click();
  await page.getByRole("button", { name: "Börja momentet" }).click();
  if (firstExemplarMeeting) await skipListening(page);
}

// The student first looks around in the exemplar alone. These tests go on to Edda's guided
// questions; the exploration itself is covered by the unit tests.
async function leaveExploring(page: import("@playwright/test").Page) {
  await expect(page.getByText("Vilka delar bygger upp texten?")).toBeVisible();
  await page.getByRole("button", { name: "Jag har letat klart" }).click();
  await page.getByRole("button", { name: "Fortsätt", exact: true }).click();
}

async function revealBoard(page: import("@playwright/test").Page, stops: number) {
  for (let stop = 0; stop < stops; stop += 1) {
    await page.getByRole("button", { name: "Fortsätt", exact: true }).click();
  }
  await expect(page.getByRole("button", { name: "Fortsätt", exact: true })).toHaveCount(0);
}

// The six parts the whiteboard asks the student to find in the first chapter, in order.
// The student writes about the school day and meets the exemplar from the same area (the "school" set).
const exemplarTitle = "Stillasittandets pris – dags att schemalägga rörelsen";
const structureParts = [
  "Stillasittandets pris – dags att schemalägga rörelsen",
  "Det är hög tid att skolan schemalägger rörelse varje dag",
  "För det första hänger rörelse och inlärning nära samman.",
  "Utöver inlärningen väcker bristen på rörelse en fråga om rättvisa.",
  "Visst hävdas det ofta att schemat redan är fullt och att daglig rörelse inkräktar på kärnämnena",
  "Sammanfattningsvis är den stillasittande skoldagen en vana som vi måste bryta.",
];

// The student looks for a part and clicks it in the text beside the whiteboard.
async function findInText(page: import("@playwright/test").Page, quote: string) {
  await page.getByRole("region", { name: "Exempeltext" }).getByRole("button", { name: quote, exact: true }).click();
  await expect(page.getByRole("status").locator(".edda-mark")).toBeVisible();
}

async function completeFinalRecall(page: import("@playwright/test").Page) {
  for (let index = 0; index < 5; index += 1) {
    await page.getByRole("textbox", { name: "Ditt svar, utan stöd" }).fill(`Syntetiskt återkallningssvar ${index + 1}.`);
    await page.getByRole("button", {
      name: index === 4 ? "Starta slutdiagnosen" : "Nästa fråga",
    }).click();
  }
}

test("student can ask for contextual tips while keeping their draft editable", async ({ page }) => {
  await page.route("**/api/review", async (route) => {
    const request = route.request().postDataJSON() as { draft: string };
    const successQuote = request.draft.match(/[\p{L}\p{N}]+/u)?.[0] ?? "";
    const successStart = request.draft.indexOf(successQuote);
    const quote = "Jag tycker";
    const start = request.draft.indexOf(quote, quote.length);
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: {
          start: successStart,
          end: successStart + successQuote.length,
          quote: successQuote,
          message: "Du uttrycker en tydlig tanke.",
        },
        nextStep: "Vilket exempel kan hjälpa dig att utveckla din tanke?",
        findings: start < 0 ? [] : [{
          id: `ai-0-${start}`,
          start,
          end: start + quote.length,
          quote,
          title: "Upprepad meningsstart",
          message: "Behöver varje mening börja så?",
          category: "sentence",
        }],
      }),
    });
  });
  await page.route("**/api/check-in", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ kind: "on_track", feedback: "Du är på rätt spår." }),
    });
  });
  await page.goto("/?fri");
  await startLesson(page);
  // The writing surface is blank until the first entry question has been answered.
  await expect(page.locator(".writing-card")).toBeEmpty();
  await completeEntry(page);
  // Edda shows the student's own text with the chapter's writing task.
  await page.getByRole("button", { name: /Nästa steg/ }).click();

  const draft = "Jag tycker skoldagen ska börja senare. Jag tycker elever behöver mer vila.";
  const editor = page.getByRole("textbox", { name: "Din argumenterande text" });
  await editor.fill(draft);
  await page.getByRole("button", { name: "Få återkoppling" }).click();

  const feedback = page.getByRole("region", { name: "Återkoppling på ditt utkast" });
  await expect(feedback).toContainText("Målet");
  await expect(feedback).toContainText("Din framgång");
  await expect(feedback).toContainText("Vad kan bli bättre?");
  await expect(feedback).toContainText("Nästa steg");
  await expect(page.getByRole("textbox", { name: "Din argumenterande text" })).toHaveValue(draft);
  await page.getByRole("button", { name: /Visa förklaring.*Upprepad meningsstart/ }).click();
  await expect(page.getByRole("dialog", { name: "Förklaring: Upprepad meningsstart" })).toContainText("Behöver varje mening börja så?");
  await expect(editor).toHaveValue(draft);
  await expect(page.getByRole("list", { name: "Formativ arbetsgång" })).toHaveCount(0);
  await expect(page.locator(".feedback-card")).toHaveCount(0);

  const quoteStart = draft.indexOf("Jag tycker", "Jag tycker".length);
  const quoteEnd = quoteStart + "Jag tycker".length;
  await page.getByRole("button", { name: "Fortsätt skriva" }).click();
  await expect(editor).toBeFocused();
  await expect(editor).toHaveJSProperty("selectionStart", quoteStart);
  await expect(editor).toHaveJSProperty("selectionEnd", quoteEnd);
  await page.keyboard.type("Jag anser");
  await expect(editor).toHaveValue(`${draft.slice(0, quoteStart)}Jag anser${draft.slice(quoteEnd)}`);
  await expect(page.getByRole("button", { name: /Visa förklaring.*Upprepad meningsstart/ })).toHaveCount(0);
});

test("whiteboard accepts a choice or a written answer and responds", async ({ page }) => {
  await page.route("**/api/check-in", async (route) => {
    const request = route.request().postDataJSON() as { isCorrect?: boolean; mode: string };
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        kind: request.mode === "text" || request.isCorrect ? "on_track" : "retry",
        // As the server does: a written answer has a step, a correct click is simply right.
        ...(request.mode === "text" && { level: 2 }),
        feedback: request.mode === "text"
          ? "Du är inne på rätt spår. Kan du ge ett exempel?"
          : "Precis. Kan du koppla det till ett exempel?",
      }),
    });
  });
  await page.goto("/?fri");
  await startLesson(page);

  await completeEntry(page);
  // In the modelling step the whiteboard asks first, and the student looks for the place in the text.
  await page.getByRole("button", { name: "Fortsätt", exact: true }).click();
  await leaveExploring(page);
  await expect(page.getByText("Klicka på rubriken.")).toBeVisible();
  await expect(page.getByText("Rubriken säger både vad texten handlar om")).toHaveCount(0);
  const text = page.getByRole("region", { name: "Exempeltext" });
  // A wrong try gives a nudge without a mark.
  await text.getByRole("button", { name: structureParts[5], exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Precis.");
  await expect(page.getByRole("status").locator(".edda-mark")).toHaveCount(0);
  await text.getByRole("button", { name: structureParts[0], exact: true }).click();
  // Only when the place is found does Edda explain it. The board then holds just her own short
  // words in her speech bubble: no longer answer from the AI and no copy of the quote.
  await expect(page.getByRole("status")).toContainText("Rubriken säger både vad texten handlar om");
  await expect(page.getByRole("status")).not.toContainText("Precis.");
  await expect(page.getByRole("status")).toContainText("Edda");
  await expect(page.locator(".board-surface .focus-quote")).toHaveCount(0);
  if (process.env.MAP_SHOT) await page.screenshot({ path: process.env.MAP_SHOT.replace(".png", "-clean.png") });
  await expect(page.getByRole("status").locator(".edda-mark")).toBeVisible();
  // A correct click gets a plain green check, in the colours of the writing map: no star and no step.
  await expect(page.getByRole("status").locator(".edda-mark")).toHaveCSS("fill", "rgb(88, 179, 104)");
  await expect(page.getByRole("status").locator(".edda-mark")).toHaveClass(/is-done/);
  await expect(page.getByRole("button", { name: "Försök igen" })).toHaveCount(0);

  await expect(page.getByRole("textbox", { name: "Ditt svar" })).not.toBeVisible();
  await page.getByRole("button", { name: /Nästa steg/ }).click();
  await page.getByRole("button", { name: /Nästa steg/ }).click();
  await revealBoard(page, 1);
  await page.getByRole("textbox", { name: "Ditt svar" }).fill("En tes visar skribentens ståndpunkt.");
  await expect(page.getByRole("group", { name: "Välj ett svar" })).not.toBeVisible();
  await page.getByRole("button", { name: "Svara" }).click();
  await expect(page.getByRole("status")).toContainText("inne på rätt spår");
});

test("student completes the short chapter exit ticket", async ({ page }) => {
  await page.route("**/api/check-in", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ kind: "on_track", feedback: "Du kopplar svaret till kapitlets innehåll." }),
    });
  });
  await page.goto("/?fri");
  await startLesson(page);
  await completeEntry(page);
  for (let step = 0; step < 4; step += 1) {
    await page.getByRole("button", { name: /Nästa steg/ }).click();
  }

  // The criteria come first; the exit ticket follows, and after it the chapter's writing map.
  await page.getByRole("button", { name: "Fortsätt", exact: true }).click();

  const titles = [
    "Textens övergripande delar",
    "Bedöm din inledning",
  ];

  for (const [index, title] of titles.entries()) {
    await expect(page.getByRole("heading", { name: title })).toBeVisible();
    await page.getByRole("textbox", { name: "Ditt svar" }).fill(`Syntetiskt svar ${index + 1}.`);
    await page.getByRole("button", { name: "Svara" }).click();
    await expect(page.getByRole("status")).toContainText("Du kopplar svaret");
    await page.getByRole("button", { name: index === titles.length - 1 ? "Avsluta exit ticket" : "Nästa fråga" }).click();
  }

  // The lesson ends with what the student can do now and their first answer beside the latest one.
  const done = page.getByRole("region", { name: "Exit ticket klar" });
  await expect(done).toContainText("Det här kan du nu");
  await expect(done.getByRole("group", { name: "Din utveckling under lektionen" })).toContainText("En tes visar skribentens ståndpunkt.");
  await expect(done.getByRole("group", { name: "Din utveckling under lektionen" })).toContainText("Syntetiskt svar 1.");
  await expect(done).toContainText("Gå tillbaka till första frågan");
});

test("final diagnosis hides teaching support until completion and offers optional feedback", async ({ page }) => {
  let reviewRequests = 0;
  await page.route("**/api/check-in", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ kind: "on_track", feedback: "Du är på rätt spår. Kan du ge ett exempel?" }),
    });
  });
  await page.route("**/api/review", async (route) => {
    reviewRequests += 1;
    const request = route.request().postDataJSON() as { draft: string };
    const quote = request.draft.match(/[\p{L}\p{N}]+/u)?.[0] ?? "";
    const start = request.draft.indexOf(quote);
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: { start, end: start + quote.length, quote, message: "Du uttrycker en tydlig tanke." },
        nextStep: "Vilket exempel kan hjälpa läsaren att förstå din tanke?",
        findings: [],
      }),
    });
  });
  await page.goto("/?fri");
  await startLesson(page);

  await completeEntry(page);
  // Edda shows the student's own text with the chapter's writing task.
  await page.getByRole("button", { name: /Nästa steg/ }).click();
  await page.getByRole("textbox", { name: "Din argumenterande text" }).fill("Träningsutkast som inte ska följa med till diagnosen.");
  await page.getByRole("button", { name: /Slutdiagnos/ }).click();
  // The final diagnosis lesson has no exemplar text.
  await completeEntry(page, "Jag kontrollerar meningsgränser.", false);
  for (let step = 0; step < 4; step += 1) {
    await page.getByRole("button", { name: /Nästa steg/ }).click();
  }

  await expect(page.getByRole("heading", { name: "Struktur" })).toBeVisible();
  await expect(page.getByText("Svaren stannar i den här sessionen och skickas inte till AI.")).toBeVisible();
  await completeFinalRecall(page);

  await expect(page.getByRole("region", { name: /Whiteboard/ })).toHaveCount(0);
  await expect(page.getByRole("navigation", { name: "Lektionens moment" })).toHaveCount(0);
  await expect(page.getByText("Språkliga normer")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Få återkoppling" })).toHaveCount(0);

  const editor = page.getByRole("textbox", { name: "Din argumenterande text" });
  await expect(editor).toHaveValue("");
  await editor.fill("Ungdomar borde få åka gratis eftersom det kan göra fler aktiviteter möjliga.");
  await expect(page.getByText("Ta ställning: Borde ungdomar få åka gratis med kollektivtrafiken i sin kommun?")).toBeVisible();
  const workspace = await page.locator(".workspace-grid").boundingBox();
  const writingCard = await page.locator(".writing-card").boundingBox();
  expect(workspace).not.toBeNull();
  expect(writingCard).not.toBeNull();
  expect(writingCard!.width).toBeCloseTo(workspace!.width, 0);
  await page.getByRole("button", { name: "Markera slutdiagnosen som klar" }).click();

  expect(reviewRequests).toBe(0);
  await page.getByRole("button", { name: "Få återkoppling" }).click();
  await expect(page.getByRole("region", { name: "Återkoppling på ditt utkast" })).toBeVisible();
  expect(reviewRequests).toBe(1);
});

test("the text is to the left with Edda's bubble beside it, and they stack on narrow screens", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/?fri");

  const board = await page.locator(".board-frame").boundingBox();
  const writingArea = await page.locator(".writing-card").boundingBox();

  expect(board).not.toBeNull();
  expect(writingArea).not.toBeNull();
  // The text takes about 60 percent and Edda's bubble about 40, with the text to the left.
  expect(board!.width / writingArea!.width).toBeCloseTo(2 / 3, 1);
  expect(writingArea!.x).toBeLessThan(board!.x);

  await page.setViewportSize({ width: 820, height: 1000 });
  const narrowBoard = await page.locator(".board-frame").boundingBox();
  const narrowWritingArea = await page.locator(".writing-card").boundingBox();

  expect(narrowBoard).not.toBeNull();
  expect(narrowWritingArea).not.toBeNull();
  expect(narrowWritingArea!.y).toBeGreaterThan(narrowBoard!.y);
});

test("whiteboard writes its headings by hand and waits for the student between parts", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/?fri");

  // While Edda writes the welcome there is nothing to press on the whiteboard.
  await expect(page.locator(".board-ink.is-writing").first()).toBeVisible();
  await expect(page.locator(".board-surface").getByRole("button")).toHaveCount(0);
  // Meanwhile the writing surface shows how the lesson works.
  await expect(page.getByRole("heading", { name: "Så här går lektionen till" })).toBeVisible();
  await expect(page.getByRole("region", { name: "Elevens skrivyta" }).getByRole("listitem")).toHaveCount(6);

  // When the heading is written the choices appear; the choice starts the lesson.
  await page.getByRole("button", { name: "Skoldagen" }).click({ timeout: 15_000 });
  await page.getByRole("button", { name: "Rektorn" }).click();
  await expect(page.locator(".board-ink.is-writing")).toHaveCount(1);
  const next = page.getByRole("button", { name: "Fortsätt", exact: true });
  await expect(next).toBeVisible({ timeout: 15_000 });
  await expect(page.locator(".board-ink.is-writing")).toHaveCount(0);
  await expect(page.getByText("Kan en text få dig att ändra åsikt?")).toBeVisible();
  await expect(page.getByRole("button", { name: "Visa hela texten" })).toHaveCount(0);
});

test("exemplar text follows a retrieval question, is listened to and then shown with yellow marks beside the lesson", async ({ page }) => {
  let audioRequests = 0;
  await page.route("**/api/check-in", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ kind: "on_track", feedback: "Du är på rätt spår." }),
    });
  });
  await page.route("**/api/exemplar-audio", async (route) => {
    audioRequests += 1;
    await route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({ error: "Uppläsning är inte konfigurerad på servern." }),
    });
  });
  await page.goto("/?fri");
  await startLesson(page);

  await expect(page.getByRole("region", { name: "Exempeltext" })).toHaveCount(0);
  await completeEntry(page, "En text där man tar ställning och ger skäl.", false);

  const surface = page.getByRole("region", { name: "Exempeltext" });
  await expect(surface.getByRole("heading", { name: exemplarTitle })).toBeVisible();
  await expect(surface.locator("mark")).toHaveCount(0);
  expect(audioRequests).toBe(0);

  // The listen button is on the whiteboard; the writing surface shows only the text.
  await expect(surface.getByRole("button")).toHaveCount(0);
  await page.getByRole("button", { name: "Lyssna på texten" }).click();
  await expect(page.getByRole("alert")).toContainText("Uppläsning är inte konfigurerad");
  expect(audioRequests).toBe(1);

  await skipListening(page);
  await expect(surface.locator("mark")).toHaveCount(0);

  // The student looks for each part; once found, only that part is lit and the rest is blurred.
  await page.getByRole("button", { name: "Fortsätt", exact: true }).click();
  // While the student looks around alone nothing in the text is marked.
  await expect(surface.locator("article")).toHaveClass(/is-exploring/);
  await expect(surface.locator(".exemplar-mark.is-candidate").first()).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
  await leaveExploring(page);
  await expect(surface.locator("mark")).toHaveCount(0);
  await expect(surface.locator(".exemplar-mark.is-candidate")).toHaveCount(6);
  await findInText(page, structureParts[0]);
  await expect(surface.locator("mark")).toHaveCount(1);
  await expect(surface.locator("mark")).toContainText(structureParts[0]);
  await expect(surface.locator("mark")).toHaveCSS("background-color", "rgb(255, 233, 122)");
  // The quote is lit in the text and is not repeated on the whiteboard.
  await expect(page.getByText(`”${structureParts[0]}”`)).toHaveCount(0);
  await page.getByRole("button", { name: "Fortsätt", exact: true }).click();
  await findInText(page, structureParts[1]);
  await expect(surface.locator("mark")).toHaveCount(1);
  await expect(surface.locator("mark")).toContainText(structureParts[1]);
  await expect(surface.locator(".exemplar-plain").first()).toHaveCSS("filter", /blur/);
  // The whole exemplar stays visible without scrolling.
  await expect.poll(() => surface.locator(".exemplar-stage").evaluate((stage) => {
    const text = stage.querySelector(".exemplar-text")!.getBoundingClientRect();
    return text.bottom <= stage.getBoundingClientRect().bottom + 1;
  })).toBe(true);

  // Edda shows the student's own text with the chapter's writing task.
  await page.getByRole("button", { name: /Nästa steg/ }).click();
  await expect(page.getByRole("textbox", { name: "Din argumenterande text" })).toBeVisible();
});

test("the whole whiteboard is visible without scrolling, one part at a time", async ({ page }) => {
  await page.route("**/api/check-in", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ kind: "on_track", feedback: "Du är på rätt spår." }),
    });
  });
  await page.setViewportSize({ width: 1288, height: 720 });
  await page.goto("/?fri");
  await startLesson(page);

  async function expectBoardFits() {
    await expect.poll(() => page.evaluate(() => {
      const surface = document.querySelector(".board-surface")!.getBoundingClientRect();
      const content = document.querySelector(".board-content")!.getBoundingClientRect();
      return {
        pageScrolls: document.documentElement.scrollHeight > window.innerHeight,
        boardInWindow: surface.bottom <= window.innerHeight,
        contentInBoard: content.bottom <= surface.bottom + 1,
      };
    })).toEqual({ pageScrolls: false, boardInWindow: true, contentInBoard: true });
  }

  await expectBoardFits();
  await completeEntry(page);
  await expectBoardFits();

  // Every page of the modelling fits, both while the student is looking and after Edda has explained.
  for (const quote of structureParts) {
    await page.getByRole("button", { name: "Fortsätt", exact: true }).click();
    await expect(page.locator(".board-goal")).toBeHidden();
    await expectBoardFits();
    await findInText(page, quote);
    await expectBoardFits();
  }
  await expect(page.getByRole("button", { name: /Nästa steg/ })).toBeInViewport();
  await expect(page.getByRole("button", { name: "Visa föregående del" })).toHaveCount(0);
  await expect(page.getByText(/DEMO|Kursplansanknytning/)).toHaveCount(0);
});

test("the lesson is guided: chapters are locked and Edda decides what the writing surface shows", async ({ page }) => {
  await page.route("**/api/check-in", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ kind: "on_track", level: 2, feedback: "Du hittade tesen. Vad visar den?" }),
    });
  });
  await page.route("**/api/review", async (route) => {
    const request = route.request().postDataJSON() as { draft: string };
    const quote = request.draft.match(/[\p{L}\p{N}]+/u)?.[0] ?? "";
    const start = request.draft.indexOf(quote);
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: { start, end: start + quote.length, quote, message: "Du visar tydligt vad du tycker." },
        nextStep: "Vilket skäl vill du ge?",
        findings: [],
      }),
    });
  });
  await page.unroute("**/api/progress-map");
  await page.route("**/api/progress-map", async (route) => {
    const request = route.request().postDataJSON() as { draft: string; skills: string[] };
    const quote = "Skoldagen borde börja senare.";
    const start = request.draft.indexOf(quote);
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ parts: request.skills.map((skill) => skill === "structure"
        ? { skill, level: 1, start, end: start + quote.length, quote, strength: "Du har en tes som säger tydligt vad du tycker.", next: "Vilket skäl till kan du ge för din åsikt?", found: [] }
        : { skill, level: 0, strength: "", next: "Vilket skäl har du för din åsikt?", found: [] }) }),
    });
  });
  await page.goto("/");
  await startLesson(page);

  // The small writing map is in the top bar from the start, empty until Edda has read the student's text.
  await expect(page.getByRole("img", { name: "Din skrivkarta i litet format" })).toBeVisible();
  await expect(page.locator(".topbar-map .map-ring.is-filled")).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Resonemang/ })).toBeDisabled();
  await completeEntry(page);
  const next = page.getByRole("button", { name: /Nästa steg/ });
  await expect(next).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Tillbaka" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Din text" })).toHaveCount(0);

  const proceed = page.getByRole("button", { name: "Fortsätt", exact: true });
  // The student first looks around alone, and here chooses to go on to Edda's questions.
  await proceed.click();
  await expect(page.getByText("Vilka delar bygger upp texten?")).toBeVisible();
  await page.getByRole("button", { name: "Jag har letat klart" }).click();
  // Each question holds the student until the place is found, or Edda has shown it.
  for (const [index, quote] of structureParts.entries()) {
    await proceed.click();
    await expect(proceed).toHaveCount(0);
    await expect(next).toHaveCount(0);
    await findInText(page, quote);
    if (index < structureParts.length - 1) await expect(next).toHaveCount(0);
  }
  await expect(next).toBeEnabled();

  await next.click();
  // This student found every place alone, so Edda steps back by herself: no example first, and she says why.
  await expect(page.getByText("Du hittade ställena i exempeltexten själv, så du går direkt till din uppgift.")).toBeVisible();
  await expect(page.getByText("Här är två sätt att skriva en tes. Klicka på den som är bäst.")).toHaveCount(0);
  // The wording follows the student's level; every level asks for an introduction with a thesis.
  await expect(page.getByText(/inledning med tes|rubrik och din tes/)).toBeVisible();
  await expect(page.getByRole("region", { name: "Exempeltext" })).toHaveCount(0);
  await expect(next).toHaveCount(0);
  await page.getByRole("textbox", { name: "Din argumenterande text" }).fill("Skoldagen borde börja senare.");
  await page.getByRole("button", { name: "Jag är klar – låt Edda läsa" }).click();
  // Edda has read the text: the strength is marked in green in the student's own text.
  await expect(page.locator(".strength-mark")).toHaveText("Skoldagen");
  await expect(page.getByRole("status")).toContainText("Du visar tydligt vad du tycker.");
  await expect(next).toBeEnabled();
  // The same hand-in brought the writing map up to date: it is in the top bar without any click of its own.
  await expect(page.getByRole("img", { name: "Din skrivkarta i litet format" })).toBeVisible();
  // When Edda has read the text the board is short: her answer, and nothing that repeats what the text shows.
  await expect(page.getByText(/så du går direkt till din uppgift/)).toHaveCount(0);
  await expect(page.getByText(/Se det gröna i din text/)).toHaveCount(0);
  if (process.env.MAP_SHOT) await page.screenshot({ path: process.env.MAP_SHOT.replace(".png", "-task.png") });
});

test("Edda speaks her guidance and the text appears when she has finished", async ({ page }) => {
  let spoken: string[] = [];
  // A very short silent sound stands in for Edda's voice.
  const silence = Buffer.from(
    "UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=",
    "base64",
  );
  await page.unroute("**/api/speech");
  await page.route("**/api/speech", async (route) => {
    spoken.push((route.request().postDataJSON() as { text: string }).text);
    await new Promise((resolve) => setTimeout(resolve, 600));
    await route.fulfill({ status: 200, contentType: "audio/wav", body: silence });
  });
  await page.goto("/?fri");
  await startLesson(page);

  // The hook is a heading and is not spoken; the goal that follows is Edda's guidance.
  await page.getByRole("button", { name: "Fortsätt", exact: true }).click();
  await expect(page.locator(".edda-dots")).toBeVisible();
  await expect(page.locator(".board-ink.is-speaking")).toHaveCount(1);
  await expect(page.getByRole("button", { name: "Fortsätt", exact: true })).toHaveCount(0);

  // When she has finished the text is shown and the student can go on.
  await expect(page.getByText("Edda berättar")).toHaveCount(0);
  await expect(page.locator(".board-step:not([hidden]) .activity-instruction .board-ink").first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Fortsätt", exact: true })).toBeVisible();
  // The welcome and the goal are Edda's guidance; the hook between them is a heading and is not spoken.
  expect(spoken).toHaveLength(2);
  expect(spoken[0]).toMatch(/^Hej! Jag heter Edda\./);
  expect(spoken[1]).toMatch(/^När du är klar kan du/);

  // With the sound off Edda does not speak, and the text is shown at once.
  spoken = [];
  await page.getByRole("button", { name: "Ljud på" }).click();
  await expect(page.getByRole("button", { name: "Ljud av" })).toBeVisible();
  await page.getByRole("button", { name: "Fortsätt", exact: true }).click();
  await expect(page.getByText("Vad är en argumenterande text?")).toBeVisible();
  expect(spoken).toHaveLength(0);
});

test("student can make the text on the writing surface easier to read", async ({ page }) => {
  await page.route("**/api/check-in", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ kind: "on_track", feedback: "Du är på rätt spår." }),
    });
  });
  await page.goto("/");
  await startLesson(page);
  await completeEntry(page, undefined, false);

  const exemplar = page.locator(".exemplar-text");
  const sizeOf = () => exemplar.evaluate((element) => parseFloat(getComputedStyle(element).fontSize));
  const before = await sizeOf();

  await page.getByRole("button", { name: "Textformat" }).click();
  const panel = page.getByRole("dialog", { name: "Textformat" });
  await panel.getByRole("group", { name: "Textstorlek" }).getByRole("button", { name: "Störst" }).click();
  await panel.getByRole("group", { name: "Radavstånd" }).getByRole("button", { name: "Större" }).click();
  await panel.getByRole("button", { name: "Gräddvit" }).click();
  await panel.getByRole("group", { name: "Läslinjal" }).getByRole("button", { name: "På" }).click();
  await page.keyboard.press("Escape");

  // The text keeps its larger size: it scrolls instead of shrinking to fit.
  expect(await sizeOf()).toBeGreaterThan(before * 1.3);
  await expect(exemplar).not.toHaveAttribute("style", /--fit-scale/);
  await expect(page.locator(".writing-card")).toHaveCSS("background-color", "rgb(251, 245, 230)");

  // The ruler follows the pointer over the writing surface.
  const card = (await page.locator(".writing-card").boundingBox())!;
  await page.mouse.move(card.x + card.width / 2, card.y + card.height / 2);
  await expect(page.locator(".reading-ruler")).toBeVisible();
});
