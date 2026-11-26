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
  const requests: { draft: string; skills: string[]; known: unknown[] }[] = [];
  await page.route("**/api/progress-map", async (route) => {
    const request = route.request().postDataJSON() as { draft: string; skills: string[]; known: unknown[] };
    requests.push(request);
    const part = (skill: string, level: number, quote: string, strength: string, next: string) => {
      const start = request.draft.indexOf(quote);
      return { skill, level, start, end: start + quote.length, quote, strength, next };
    };
    // Structure and reasoning are Edda's reading. Linking words and sentences follow plain rules,
    // so the app reads those parts itself from the text and what the server says about them is not used.
    const read: Record<string, unknown> = {
      structure: part("structure", 3, "Jag tycker att vi borde förbjuda mobiltelefoner i skolan.", "Din tes säger tydligt vad du tycker.", ""),
      reasoning: part("reasoning", 2, "skulle eleverna kunna koncentrera sig bättre", "Du förklarar varför ditt första argument stämmer.", "Vad leder det till för eleverna?"),
    };
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        parts: request.skills.map((skill) => read[skill] ?? { skill, level: 0, strength: "", next: "Vilket ord kan visa en orsak?", found: [] }),
      }),
    });
  });
  const draft = "Förbjud mobiler i skolan!\n\nJag tycker att vi borde förbjuda mobiltelefoner i skolan.\n\nFör det första skulle eleverna kunna koncentrera sig bättre utan störningar.";

  await page.goto("/?fri");
  if (process.env.MAP_SHOT) await page.screenshot({ path: process.env.MAP_SHOT.replace(".png", "-start.png") });
  await page.getByRole("button", { name: "Skoldagen" }).click();
  if (process.env.MAP_SHOT) await page.screenshot({ path: process.env.MAP_SHOT.replace(".png", "-reader.png") });
  await page.getByRole("button", { name: "Rektorn" }).click();
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
  // The parts gone through so far are read, and the next chapter's too, so that Edda knows what the text already shows.
  expect(requests[0]).toEqual({ draft, skills: ["structure", "reasoning", "cohesion", "sentence"], known: [] });
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

  // The same text always gives the same map: a text Edda has already read is not sent again.
  await editor.fill(draft);
  await again.click();
  await expect(wheel.getByRole("button", { name: "Textbindning: grundläggande" })).toBeVisible();
  expect(requests).toHaveLength(2);

  // The student chooses a part to practise more on. This part is only begun, so the core idea is
  // repeated first; then the student tries it in the own text and Edda reads again.
  await wheel.getByRole("button", { name: "Textbindning: grundläggande" }).click();
  await page.getByRole("button", { name: "Träna mer på textbindning" }).click();
  await expect(page.getByText("TRÄNA MER · TEXTBINDNING")).toBeVisible();
  await expect(wheel).toHaveCount(0);
  await page.getByRole("textbox", { name: "Ditt svar" }).fill("Ett påhittat svar om orsak och kontrast.");
  await page.getByRole("button", { name: "Svara" }).click();
  await page.getByRole("button", { name: "Fortsätt", exact: true }).click();
  await expect(page.getByText("Pröva i din egen text")).toBeVisible();
  if (process.env.MAP_SHOT) await page.screenshot({ path: process.env.MAP_SHOT.replace(".png", "-practice.png") });
  const readAgain = page.getByRole("button", { name: "Jag har prövat – låt Edda titta igen" });
  await expect(readAgain).toBeDisabled();
  await editor.fill(`${draft} Det är viktigt eftersom lektionerna blir lugnare.`);
  await readAgain.click();
  // Back at the map, the practised part is chosen and shows what the work led to.
  await expect(wheel.getByRole("button", { name: "Textbindning: utvecklad" })).toHaveAttribute("aria-pressed", "true");
  await editor.fill(draft);
  await page.getByRole("button", { name: /låt Edda titta igen/ }).click();
  await wheel.getByRole("button", { name: "Textbindning: grundläggande" }).click();

  // The student chooses to show the map to the teacher, who then sees the same wheel.
  await page.getByRole("button", { name: "Visa min skrivkarta för läraren" }).click();
  await expect(page.getByText("Din lärare kan nu se din skrivkarta.")).toBeVisible();
  await page.getByRole("button", { name: "Öppna lärarvyn (demo)" }).click();
  const teacher = page.getByRole("region", { name: "Lärarvy i demoläge" });
  await expect(teacher.getByRole("list", { name: "Delade skrivkartor" })).toContainText("Delad efter kapitel 3: Textbindning");
  await expect(teacher.getByRole("img", { name: "Struktur: välutvecklad" })).toBeVisible();
  await expect(teacher).toContainText("Resonemang: utvecklad");
  if (process.env.MAP_SHOT) await page.screenshot({ path: process.env.MAP_SHOT.replace(".png", "-teacher.png") });
});

// When the student has handed in the chapter's writing task, Edda has read the text. The map is
// then already drawn at the end of the chapter and in the top bar, with nothing to press.
test("the writing map draws itself when the student has handed in the writing task", async ({ page }) => {
  await page.setViewportSize({ width: 1400, height: 800 });
  await page.route("**/api/speech", (route) => route.fulfill({ status: 503, body: "{}" }));
  await page.route("**/api/check-in", (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ kind: "on_track", feedback: "Du visar vad du kan.", level: 2 }),
  }));
  await page.route("**/api/review", async (route) => {
    const request = route.request().postDataJSON() as { draft: string };
    const quote = request.draft.match(/[\p{L}\p{N}]+/u)?.[0] ?? "";
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ success: { start: 0, end: quote.length, quote, message: "Du visar tydligt vad du tycker." }, nextStep: "Vilket skäl vill du ge?", findings: [] }),
    });
  });
  let readings = 0;
  await page.route("**/api/progress-map", async (route) => {
    readings += 1;
    const request = route.request().postDataJSON() as { draft: string; skills: string[] };
    const quote = "Jag tycker att vi borde förbjuda mobiltelefoner i skolan.";
    const start = request.draft.indexOf(quote);
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ parts: request.skills.map((skill) => skill === "structure"
        ? { skill, level: 2, start, end: start + quote.length, quote, strength: "Du har en tes som säger tydligt vad du tycker.", next: "Hur vill du avsluta?", found: [] }
        : { skill, level: 0, strength: "", next: "Vilket skäl har du för din åsikt?", found: [] }) }),
    });
  });

  await page.goto("/?fri");
  await page.getByRole("button", { name: "Skoldagen" }).click();
  await page.getByRole("button", { name: "Rektorn" }).click();
  await page.getByRole("button", { name: "Fortsätt", exact: true }).click();
  await page.getByRole("button", { name: "Fortsätt", exact: true }).click();
  await page.getByRole("textbox", { name: "Ditt svar, utan ledtråd" }).fill("Ett påhittat svar.");
  await page.getByRole("button", { name: "Svara" }).click();
  await page.getByRole("button", { name: "Börja momentet" }).click();
  await page.getByRole("button", { name: "Starta lektionen utan att lyssna" }).click();
  await page.getByRole("button", { name: /Nästa steg/ }).click();
  const handIn = page.getByRole("button", { name: "Jag är klar – låt Edda läsa" });
  const onward = page.getByRole("button", { name: "Fortsätt", exact: true });
  await expect(handIn.or(onward)).toBeVisible();
  while (!await handIn.isVisible()) {
    await onward.click();
    await expect(handIn.or(onward)).toBeVisible();
  }
  // Before Edda has read anything the small map is there, but empty.
  await expect(page.locator(".topbar-map .map-ring.is-filled")).toHaveCount(0);
  await page.getByRole("textbox", { name: "Din argumenterande text" }).fill("Förbjud mobiler i skolan!\n\nJag tycker att vi borde förbjuda mobiltelefoner i skolan.");
  await handIn.click();

  // The hand-in was the only click: the small map in the top bar is coloured in.
  await expect(page.locator(".topbar-map .map-ring.is-filled").first()).toBeVisible();
  expect(readings).toBe(1);

  // At the end of the chapter the map is already drawn; there is no button to ask for it.
  for (let step = 0; step < 3; step += 1) await page.getByRole("button", { name: /Nästa steg/ }).click();
  const wheel = page.getByRole("group", { name: "Din skrivkarta" });
  await expect(wheel.or(onward)).toBeVisible();
  while (!await wheel.isVisible()) {
    await onward.click();
    await expect(wheel.or(onward)).toBeVisible();
  }
  await expect(wheel.getByRole("button", { name: "Struktur: utvecklad" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Visa min skrivkarta", exact: true })).toHaveCount(0);
  expect(readings).toBe(1);
  if (process.env.MAP_SHOT) await page.screenshot({ path: process.env.MAP_SHOT.replace(".png", "-auto.png") });
});
