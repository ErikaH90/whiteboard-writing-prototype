import { expect, test } from "@playwright/test";

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
        }],
      }),
    });
  });
  await page.goto("/");

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
  await expect(page.locator(".formative-cycle-step.is-current")).toHaveAttribute("aria-current", "step");
  await expect(page.locator(".formative-cycle-step.is-current")).toContainText("Revidera");
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
        feedback: request.mode === "text"
          ? "Du är inne på rätt spår. Kan du ge ett exempel?"
          : "Precis. Kan du koppla det till ett exempel?",
      }),
    });
  });
  await page.goto("/");

  await page.getByRole("button", { name: "Skoldagen borde börja senare." }).click();
  await page.getByRole("button", { name: "Svara" }).click();
  await expect(page.getByRole("status")).toContainText("Precis.");

  await expect(page.getByRole("textbox", { name: "Ditt svar" })).not.toBeVisible();
  await page.getByRole("button", { name: "Återkalla utan stöd" }).click();
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
  await page.getByRole("button", { name: "Slutbedömning" }).click();

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

  await expect(page.getByRole("region", { name: "Exit ticket klar" })).toContainText("Syntetiskt svar 5.");
  await expect(page.getByRole("region", { name: "Exit ticket klar" })).toContainText("Gå tillbaka till första frågan");
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
