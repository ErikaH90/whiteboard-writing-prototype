import { expect, test } from "@playwright/test";

test("student can review a draft without replacing their text", async ({ page }) => {
  await page.route("**/api/review", async (route) => {
    const request = route.request().postDataJSON() as { draft: string };
    const quote = "Jag tycker";
    const start = request.draft.indexOf(quote, quote.length);
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
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
  await page.getByRole("tab", { name: "Granska" }).click();

  await expect(page.getByText(/AI-återkoppling/)).toBeVisible();
  await expect(page.getByText("Upprepad meningsstart")).toBeVisible();
  await page.getByRole("tab", { name: "Skriv" }).click();

  await expect(page.getByRole("textbox", { name: "Din argumenterande text" })).toHaveValue(draft);
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

test("board uses 40 percent on desktop and stacks on narrow screens", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/");

  const board = await page.locator(".board-frame").boundingBox();
  const writingArea = await page.locator(".writing-card").boundingBox();

  expect(board).not.toBeNull();
  expect(writingArea).not.toBeNull();
  expect(board!.width / writingArea!.width).toBeCloseTo(2 / 3, 1);

  await page.setViewportSize({ width: 820, height: 1000 });
  const narrowBoard = await page.locator(".board-frame").boundingBox();
  const narrowWritingArea = await page.locator(".writing-card").boundingBox();

  expect(narrowBoard).not.toBeNull();
  expect(narrowWritingArea).not.toBeNull();
  expect(narrowWritingArea!.y).toBeGreaterThan(narrowBoard!.y);
});
