import { expect, test } from "@playwright/test";

// A chapter ends with the student's writing map: Edda reads the student's own text and shows how
// far each part has come, with a quote from the text as evidence.
test("the chapter ends with the writing map, bound to the student's own text", async ({ page }) => {
  await page.setViewportSize({ width: 1400, height: 800 });
  await page.route("**/api/speech", (route) => route.fulfill({ status: 503, body: "{}" }));
  await page.route("**/api/check-in", (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ kind: "on_track", feedback: "Du visar vad du kan.", level: 2 }),
  }));
  const requests: { draft: string; skills: string[] }[] = [];
  await page.route("**/api/progress-map", async (route) => {
    const request = route.request().postDataJSON() as { draft: string; skills: string[] };
    requests.push(request);
    const part = (skill: string, level: number, quote: string, strength: string, next: string) => {
      const start = request.draft.indexOf(quote);
      return { skill, level, start, end: start + quote.length, quote, strength, next };
    };
    // After the student has revised, the part about cohesion has moved one step.
    const revised = request.draft.includes("eftersom");
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ parts: [
        part("structure", 3, "Jag tycker att vi borde förbjuda mobiltelefoner i skolan.", "Din tes säger tydligt vad du tycker.", ""),
        part("reasoning", 2, "skulle eleverna kunna koncentrera sig bättre", "Du förklarar varför ditt första argument stämmer.", "Vad leder det till för eleverna?"),
        part("cohesion", revised ? 2 : 1, "För det första", "Du visar ordningen mellan dina argument.", "Vilket ord kan visa en orsak?"),
      ] }),
    });
  });
  const draft = "Förbjud mobiler i skolan!\n\nJag tycker att vi borde förbjuda mobiltelefoner i skolan.\n\nFör det första skulle eleverna kunna koncentrera sig bättre utan störningar.";

  await page.goto("/?fri");
  await page.getByRole("button", { name: "Skoldagen" }).click();
  await page.getByRole("button", { name: /^Kapitel 3:/ }).click();
  await page.getByRole("button", { name: "Fortsätt", exact: true }).click();
  await page.getByRole("button", { name: "Fortsätt", exact: true }).click();
  await page.getByRole("textbox", { name: "Ditt svar, utan ledtråd" }).fill("Ett påhittat svar.");
  await page.getByRole("button", { name: "Svara" }).click();
  await page.getByRole("button", { name: "Börja momentet" }).click();
  await page.getByRole("button", { name: "Starta lektionen utan att lyssna" }).click();
  await page.getByRole("button", { name: /Nästa steg/ }).click();
  const editor = page.getByRole("textbox", { name: "Din argumenterande text" });
  await editor.fill(draft);
  for (let step = 0; step < 3; step += 1) await page.getByRole("button", { name: /Nästa steg/ }).click();
  // The last step of the chapter: criteria, exit ticket and then the map.
  const show = page.getByRole("button", { name: "Visa min skrivkarta" });
  const onward = page.getByRole("button", { name: "Fortsätt", exact: true });
  await expect(show.or(onward)).toBeVisible();
  while (await onward.isVisible()) {
    await onward.click();
    await expect(show.or(onward)).toBeVisible();
  }

  // Nothing is sent before the student asks for the map.
  expect(requests).toHaveLength(0);
  await show.click();
  const wheel = page.getByRole("group", { name: "Din skrivkarta" });
  await expect(wheel.getByRole("button", { name: "Struktur: välutvecklad" })).toBeVisible();
  // Only the parts Edda has gone through so far are read.
  expect(requests[0]).toEqual({ draft, skills: ["structure", "reasoning", "cohesion"] });
  await expect(wheel.getByRole("button", { name: "Meningar: kommer senare" })).toBeVisible();
  await expect(wheel.getByRole("img", { name: "Redo för slutdiagnos: inte än" })).toBeVisible();

  // At first only the map is shown: no part is chosen, nothing is marked and Edda says nothing more.
  await expect(wheel.locator("[aria-pressed='true']")).toHaveCount(0);
  await expect(page.locator(".map-detail")).toHaveCount(0);
  await expect(page.locator(".strength-mark")).toHaveCount(0);
  await expect(page.getByRole("button", { name: /låt Edda titta igen/ })).toHaveCount(0);

  if (process.env.MAP_SHOT) await page.screenshot({ path: process.env.MAP_SHOT });

  // When the student chooses a part, Edda gives her tips and the evidence is marked in the text.
  await wheel.getByRole("button", { name: "Textbindning: grundläggande" }).click();
  await expect(page.locator(".strength-mark")).toHaveText("För det första");
  // Choosing the same part again puts the tips away.
  await wheel.getByRole("button", { name: "Textbindning: grundläggande" }).click();
  await expect(page.locator(".map-detail")).toHaveCount(0);
  await wheel.getByRole("button", { name: "Resonemang: utvecklad" }).click();
  await expect(page.locator(".strength-mark")).toHaveText("skulle eleverna kunna koncentrera sig bättre");
  await expect(page.getByText("Vad leder det till för eleverna?")).toBeVisible();

  // The whole board is visible without scrolling.
  const board = page.locator(".board-surface");
  // The board is fitted to the screen: its last row is still inside the whiteboard.
  await expect.poll(async () => {
    const frame = await board.boundingBox();
    const last = await page.getByRole("button", { name: /Nästa kapitel/ }).boundingBox();
    return frame && last ? last.y + last.height - (frame.y + frame.height) : 999;
  }).toBeLessThanOrEqual(1);

  // When the student has changed the text, Edda can read again and the map follows the text.
  const again = page.getByRole("button", { name: "Jag har ändrat i min text – låt Edda titta igen" });
  await editor.fill(`${draft} Det är viktigt eftersom lektionerna blir lugnare.`);
  await expect(page.locator(".strength-mark")).toHaveCount(0);
  await again.click();
  await expect(wheel.getByRole("button", { name: "Textbindning: utvecklad" })).toBeVisible();
  expect(requests).toHaveLength(2);
  await expect(editor).toHaveValue(`${draft} Det är viktigt eftersom lektionerna blir lugnare.`);
});
