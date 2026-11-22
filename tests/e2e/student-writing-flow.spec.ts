import { expect, test } from "@playwright/test";

// The exemplar text is introduced once per session, right after the first entry question.
async function skipListening(page: import("@playwright/test").Page) {
  await page.getByRole("button", { name: "Starta lektionen utan att lyssna" }).click();
}

// Edda's voice is never fetched from the real speech service in tests: without it the text is
// shown directly, which is what the other tests rely on.
test.beforeEach(async ({ page }) => {
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

async function revealBoard(page: import("@playwright/test").Page, stops: number) {
  for (let stop = 0; stop < stops; stop += 1) {
    await page.getByRole("button", { name: "Fortsätt", exact: true }).click();
  }
  await expect(page.getByRole("button", { name: "Fortsätt", exact: true })).toHaveCount(0);
}

// The six parts the whiteboard asks the student to find in the first chapter, in order.
const structureParts = [
  "Tallrikens tysta offer – dags att duka av köttet",
  "Det är hög tid att vi ifrågasätter vår köttnorm",
  "För det första står köttindustrin för en massiv belastning på miljön.",
  "Utöver miljöaspekten väcker den industriella djurhållningen en djupt etisk fråga.",
  "Visst hävdas det ofta att kött är en oumbärlig källa till protein och järn",
  "Sammanfattningsvis är köttnormen ett systemfel som vi måste börja montera ned.",
];

// The student looks for a part and clicks it in the text beside the whiteboard.
async function findInText(page: import("@playwright/test").Page, quote: string) {
  await page.getByRole("region", { name: "Exempeltext" }).getByRole("button", { name: quote, exact: true }).click();
  await expect(page.getByRole("status").locator(".edda-star")).toBeVisible();
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
        // As the server does: a correct click on the first try gives the middle-sized star.
        ...(request.mode !== "text" && request.isCorrect && { level: 2 }),
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
  await expect(page.getByText("Klicka på rubriken.")).toBeVisible();
  await expect(page.getByText("Rubriken säger både vad texten handlar om")).toHaveCount(0);
  const text = page.getByRole("region", { name: "Exempeltext" });
  // A wrong try gives a nudge without a star.
  await text.getByRole("button", { name: structureParts[5], exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Precis.");
  await expect(page.getByRole("status").locator(".edda-star")).toHaveCount(0);
  await text.getByRole("button", { name: structureParts[0], exact: true }).click();
  // Only when the place is found does Edda explain it.
  await expect(page.getByText(/^Rubriken säger både vad texten handlar om/)).toBeVisible();
  await expect(page.getByRole("status")).toContainText("Precis.");
  await expect(page.getByRole("status")).toContainText("Edda");
  await expect(page.getByRole("status").locator(".edda-star")).toBeVisible();
  await expect(page.getByRole("status").locator(".edda-star")).toHaveCSS("fill", "rgb(248, 201, 58)");
  await expect(page.getByRole("status").locator(".edda-star")).toHaveClass(/is-level-2/);
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

test("board uses 45 percent on desktop and stacks on narrow screens", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/?fri");

  const board = await page.locator(".board-frame").boundingBox();
  const writingArea = await page.locator(".writing-card").boundingBox();

  expect(board).not.toBeNull();
  expect(writingArea).not.toBeNull();
  expect(board!.width / writingArea!.width).toBeCloseTo(9 / 11, 1);

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
  await expect(surface.getByRole("heading", { name: "Tallrikens tysta offer – dags att duka av köttet" })).toBeVisible();
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
  await expect(surface.locator("mark")).toHaveCount(0);
  await expect(surface.locator(".exemplar-mark.is-candidate")).toHaveCount(6);
  await findInText(page, structureParts[0]);
  await expect(surface.locator("mark")).toHaveCount(1);
  await expect(surface.locator("mark")).toContainText("Tallrikens tysta offer");
  await expect(surface.locator("mark")).toHaveCSS("background-color", "rgb(255, 233, 122)");
  await expect(page.getByText("”Tallrikens tysta offer – dags att duka av köttet”")).toBeVisible();
  await page.getByRole("button", { name: "Fortsätt", exact: true }).click();
  await findInText(page, structureParts[1]);
  await expect(surface.locator("mark")).toHaveCount(1);
  await expect(surface.locator("mark")).toContainText("Det är hög tid att vi ifrågasätter vår köttnorm");
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
  await page.goto("/");
  await startLesson(page);

  await expect(page.getByRole("button", { name: /Resonemang/ })).toBeDisabled();
  await completeEntry(page);
  const next = page.getByRole("button", { name: /Nästa steg/ });
  await expect(next).toBeDisabled();
  await expect(page.getByRole("button", { name: "Tillbaka" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Din text" })).toHaveCount(0);

  const proceed = page.getByRole("button", { name: "Fortsätt", exact: true });
  // Each question holds the student until the place is found, or Edda has shown it.
  for (const [index, quote] of structureParts.entries()) {
    await proceed.click();
    await expect(proceed).toHaveCount(0);
    await expect(next).toBeDisabled();
    await findInText(page, quote);
    if (index < structureParts.length - 1) await expect(next).toBeDisabled();
  }
  await expect(next).toBeEnabled();

  await next.click();
  // Edda shows a better and a weaker thesis; the student picks the better one before writing.
  await expect(page.getByText("Här är två sätt att skriva en tes. Klicka på den som är bäst.")).toBeVisible();
  await expect(proceed).toHaveCount(0);
  await page.getByRole("group", { name: "Välj ett exempel" }).getByRole("button", { name: /Det är hög tid att vi ifrågasätter vår köttnorm/ }).click();
  await proceed.click();
  await expect(page.getByText("Börja med att skriva din inledning med tes.")).toBeVisible();
  await expect(page.getByRole("region", { name: "Exempeltext" })).toHaveCount(0);
  await expect(next).toBeDisabled();
  await page.getByRole("textbox", { name: "Din argumenterande text" }).fill("Skoldagen borde börja senare.");
  await page.getByRole("button", { name: "Jag är klar – låt Edda läsa" }).click();
  // Edda has read the text: the strength is marked in green in the student's own text.
  await expect(page.locator(".strength-mark")).toHaveText("Skoldagen");
  await expect(page.getByRole("status")).toContainText("Du visar tydligt vad du tycker.");
  await expect(next).toBeEnabled();
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
  await expect(page.getByText("Edda berättar")).toBeVisible();
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
