import { expect, test } from "@playwright/test";

// The exemplar text is introduced once per session, right after the first entry question.
async function skipListening(page: import("@playwright/test").Page) {
  await page.getByRole("button", { name: "Starta lektionen utan att lyssna" }).click();
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

// The first modelling step has seven stops (goal and six parts of the exemplar); other steps have one.
async function revealBoard(page: import("@playwright/test").Page, stops: number) {
  for (let stop = 0; stop < stops; stop += 1) {
    await page.getByRole("button", { name: "Fortsätt", exact: true }).click();
  }
  await expect(page.getByRole("button", { name: "Fortsätt", exact: true })).toHaveCount(0);
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
  await page.goto("/");
  // The writing surface is blank until the first entry question has been answered.
  await expect(page.locator(".writing-card")).toBeEmpty();
  await completeEntry(page);
  await page.getByRole("button", { name: "Din text" }).click();

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
  await page.goto("/");

  await completeEntry(page);
  await revealBoard(page, 7);
  // In the modelling step the student answers by clicking the right part of the exemplar text.
  await expect(page.getByText("Klicka på tesen i texten till höger.")).toBeVisible();
  await page.getByRole("region", { name: "Exempeltext" }).getByRole("button", { name: "Det är hög tid att vi ifrågasätter vår köttnorm" }).click();
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

test("student completes all five steps of the chapter exit ticket", async ({ page }) => {
  await page.route("**/api/check-in", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ kind: "on_track", feedback: "Du kopplar svaret till kapitlets innehåll." }),
    });
  });
  await page.goto("/");
  await completeEntry(page);
  for (let step = 0; step < 4; step += 1) {
    await page.getByRole("button", { name: /Nästa steg/ }).click();
  }

  await revealBoard(page, 1);

  const titles = [
    "Textens övergripande delar",
    "Kännetecken och struktur",
    "Varför har texten en fast struktur?",
    "Bedöm din egen struktur",
    "Att utveckla och förbättra argumenten",
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
  await page.goto("/");

  await completeEntry(page);
  await page.getByRole("button", { name: "Din text" }).click();
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
  await page.goto("/");

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

test("whiteboard writes its text by hand and waits for the student between parts", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");

  await expect(page.locator(".board-ink.is-writing").first()).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Ditt svar, utan ledtråd" })).toHaveCount(0);

  await expect(page.getByRole("button", { name: "Fortsätt", exact: true })).toHaveCount(0);

  await page.getByRole("button", { name: "Visa hela texten" }).click();
  await expect(page.locator(".board-ink.is-writing")).toHaveCount(0);
  await expect(page.getByText("Kan en text få dig att ändra åsikt?")).toBeVisible();
  await expect(page.getByRole("button", { name: "Visa hela texten" })).toHaveCount(0);

  // Attention first, then the goal, then the retrieval question.
  await page.getByRole("button", { name: "Fortsätt", exact: true }).click();
  await page.getByRole("button", { name: "Visa hela texten" }).click();
  await expect(page.getByText(/^När du är klar kan du peka ut tes/)).toBeVisible();
  await page.getByRole("button", { name: "Fortsätt", exact: true }).click();
  await page.getByRole("button", { name: "Visa hela texten" }).click();
  await expect(page.getByText("Vad är en argumenterande text?")).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Ditt svar, utan ledtråd" })).toBeVisible();
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
  await page.goto("/");

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

  // The whiteboard walks through the text; only the part it talks about is lit, the rest is blurred.
  await page.getByRole("button", { name: "Fortsätt", exact: true }).click();
  await expect(surface.locator("mark")).toHaveCount(1);
  await expect(surface.locator("mark")).toContainText("Tallrikens tysta offer");
  await expect(surface.locator("mark")).toHaveCSS("background-color", "rgb(255, 233, 122)");
  await expect(page.getByText("”Tallrikens tysta offer – dags att duka av köttet”")).toBeVisible();
  await page.getByRole("button", { name: "Fortsätt", exact: true }).click();
  await expect(surface.locator("mark")).toHaveCount(1);
  await expect(surface.locator("mark")).toContainText("Det är hög tid att vi ifrågasätter vår köttnorm");
  await expect(surface.locator(".exemplar-plain").first()).toHaveCSS("filter", /blur/);
  // The whole exemplar stays visible without scrolling.
  await expect.poll(() => surface.locator(".exemplar-stage").evaluate((stage) => {
    const text = stage.querySelector(".exemplar-text")!.getBoundingClientRect();
    return text.bottom <= stage.getBoundingClientRect().bottom + 1;
  })).toBe(true);

  await page.getByRole("button", { name: "Din text" }).click();
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
  await page.goto("/");

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

  for (let stop = 0; stop < 7; stop += 1) {
    await page.getByRole("button", { name: "Fortsätt", exact: true }).click();
    await expectBoardFits();
  }
  // The goal has been wiped from the board; the check is answered in the text beside it.
  const check = page.getByText("Klicka på tesen i texten till höger.");
  await expect(check).toBeVisible();
  await expect(page.locator(".board-goal")).toBeHidden();
  await expectBoardFits();
  await expect(page.getByRole("button", { name: /Nästa steg/ })).toBeInViewport();

  const surface = page.getByRole("region", { name: "Exempeltext" });
  await expect(surface.locator(".exemplar-mark.is-candidate")).toHaveCount(6);
  await surface.getByRole("button", { name: "Det är hög tid att vi ifrågasätter vår köttnorm" }).click();
  await expect(page.getByRole("status")).toContainText("Edda");
  await expect(surface.locator(".exemplar-mark.is-solved")).toHaveCount(1);
  await expectBoardFits();

  await page.getByRole("button", { name: "Visa föregående del" }).click();
  await expect(page.getByText("6 AV 6")).toBeVisible();
  await expect(check).toBeHidden();
  await page.getByRole("button", { name: "Fortsätt", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Edda");
  await expect(page.getByText(/DEMO|Kursplansanknytning/)).toHaveCount(0);
});
