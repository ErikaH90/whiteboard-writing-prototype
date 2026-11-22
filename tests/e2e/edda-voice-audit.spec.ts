import { expect, test, type Page } from "@playwright/test";

/**
 * Walks every step of every chapter with Edda's voice on and checks one rule the whole way:
 * while Edda speaks, the whiteboard shows only the heading and her bubble with dots. All other
 * text, her written speech bubble and the buttons come when she is quiet.
 */

type Audit = { violations: string[]; spoken: string[] };

// A very short silent sound stands in for Edda's voice; the real speech service is never called.
const silence = Buffer.from("UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=", "base64");

async function watchTheBoard(page: Page) {
  await page.addInitScript(() => {
    const audit: Audit = { violations: [], spoken: [] };
    (window as unknown as { __audit: Audit }).__audit = audit;
    let playing = 0;
    const play = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function patchedPlay(this: HTMLMediaElement) {
      playing += 1;
      const stop = () => { playing = Math.max(0, playing - 1); };
      this.addEventListener("ended", stop, { once: true });
      this.addEventListener("pause", stop, { once: true });
      return play.call(this);
    };
    const note = (message: string) => {
      if (!audit.violations.includes(message)) audit.violations.push(message);
    };
    window.setInterval(() => {
      const board = document.querySelector(".board-surface");
      if (!board) return;
      const speaking = board.querySelector("[data-board-step]:not([hidden]) .board-ink.is-speaking");
      if (!speaking) {
        if (playing > 0) note("Edda hörs utan att bubblan Edda berättar visas");
        return;
      }
      const said = speaking.querySelector(".board-ink-full")?.textContent ?? "";
      if (!audit.spoken.includes(said)) audit.spoken.push(said);
      const texts = document.createTreeWalker(board, NodeFilter.SHOW_TEXT);
      for (let node = texts.nextNode(); node; node = texts.nextNode()) {
        const text = node.textContent?.trim();
        const element = node.parentElement;
        if (!text || !element) continue;
        // Headings, the small place label and Edda's own bubble may stay.
        if (element.closest(".board-prompt, .board-hook, .board-kicker, .edda-speaking, .board-ink-full")) continue;
        if (!element.checkVisibility({ visibilityProperty: true, opacityProperty: true })) continue;
        note(`”${said.slice(0, 40)}…” sägs medan tavlan visar: ${text.slice(0, 70)}`);
      }
    }, 20);
  });
}

async function mockServer(page: Page, spokenRequests: string[]) {
  await page.unroute("**/api/speech");
  await page.route("**/api/speech", async (route) => {
    spokenRequests.push((route.request().postDataJSON() as { text: string }).text);
    await new Promise((resolve) => setTimeout(resolve, 150));
    await route.fulfill({ status: 200, contentType: "audio/wav", body: silence });
  });
  await page.route("**/api/check-in", async (route) => {
    // A wrong click in the text gets a hint, a right one a written speech bubble with a star.
    const wrong = (route.request().postDataJSON() as { isCorrect?: boolean }).isCorrect === false;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(wrong
        ? { kind: "retry", feedback: "Inte riktigt. Vad vill skribenten att du ska tycka?" }
        : { kind: "on_track", feedback: "Du har hittat rätt och visar varför det spelar roll.", level: 2 }),
    });
  });
}

test.beforeEach(async ({ page }) => {
  await page.route("**/api/speech", (route) => route.fulfill({ status: 503, body: "{}" }));
});

test("while Edda speaks the whiteboard shows only the heading and her dots, in every chapter", async ({ page }) => {
  test.setTimeout(360_000);
  const spokenRequests: string[] = [];
  await watchTheBoard(page);
  await mockServer(page, spokenRequests);
  await page.goto("/?fri");

  const board = page.locator(".board-surface");
  const idle = async () => {
    await expect(board.locator(".board-ink.is-speaking, .board-ink.is-writing")).toHaveCount(0, { timeout: 30_000 });
    await expect(board.getByText(/Edda läser .*…/)).toHaveCount(0);
    await page.waitForTimeout(120);
  };
  const click = async (name: string | RegExp, exact = true) => {
    const button = board.getByRole("button", { name, exact });
    if (await button.count() !== 1 || !await button.isVisible() || !await button.isEnabled()) return false;
    await button.click({ timeout: 3_000 });
    return true;
  };

  const trail: string[] = [];
  const log = (entry: string) => { trail.push(entry); console.log(entry); };
  const tries = new Map<string, number>();
  const chaptersSeen = new Set<string>();
  let stillFor = 0;
  const startedAt = Date.now();
  for (let turn = 0; turn < 600 && Date.now() - startedAt < 200_000; turn += 1) {
    await idle();
    const segment = page.locator(".lesson-segment.is-current");
    const chapter = await segment.count() === 1 ? (await segment.getAttribute("aria-label")) ?? "" : "";
    if (chapter) chaptersSeen.add(chapter);
    const step = board.locator("[data-board-step]:not([hidden])").last();
    const place = `${chapter} · ${(await step.locator(".board-kicker, .board-prompt").allInnerTexts().catch(() => [])).join(" / ")}`;

    // 1. A place to find in the text beside the board: answer by clicking there.
    const candidates = page.getByRole("region", { name: "Exempeltext" }).locator("button:not([disabled])");
    const answered = await step.locator(".edda-says.is-on-track, .edda-shows").count();
    const attempt = tries.get(place) ?? 0;
    if (await candidates.count() > 0 && answered === 0 && attempt < 3) {
      tries.set(place, attempt + 1);
      await candidates.nth(attempt % await candidates.count()).click({ timeout: 3_000 }).catch(() => log(`KUNDE INTE KLICKA · ${place}`));
      stillFor = 0; log(`klick i texten · ${place}`);
      continue;
    }
    // After two tries the student can ask Edda to show the place.
    if (await click("Visa stället")) { stillFor = 0; log(`visa stället · ${place}`); continue; }
    // 2. The topic on the welcome board.
    if (await click("Skoldagen")) { stillFor = 0; log("ämne"); continue; }
    if (await click("Rektorn")) { stillFor = 0; log("mottagare"); continue; }
    // 3. The board's own way forward.
    if (await click("Fortsätt")) { stillFor = 0; log(`fortsätt · ${place}`); continue; }
    // 4. A question to answer in writing.
    const answer = board.getByRole("textbox").first();
    if (await answer.count() && await answer.isVisible() && !(await answer.inputValue())) {
      await answer.fill("Ett påhittat svar som visar vad jag kommer ihåg.");
      stillFor = 0; log(`svar · ${place}`);
      continue;
    }
    let moved = false;
    for (const name of ["Svara", "Börja momentet", "Starta lektionen utan att lyssna", "Nästa fråga", "Starta slutdiagnosen"]) {
      const key = `${name}:${place}`;
      if ((tries.get(key) ?? 0) < 1 && await click(name)) {
        tries.set(key, 1);
        stillFor = 0; log(`${name} · ${place}`);
        moved = true;
        break;
      }
    }
    if (moved) continue;
    // Nothing to do yet: Edda may be about to speak. Move on only when the board stays still.
    stillFor += 1;
    if (stillFor <= 3) {
      await page.waitForTimeout(200);
      continue;
    }
    // 5. The next step of the lesson, and after the last step the next chapter.
    if (await click(/Nästa steg/, false)) { stillFor = 0; log(`nästa steg · ${place}`); continue; }
    const nextChapter = page.getByRole("button", { name: new RegExp(`^Kapitel ${chaptersSeen.size + 1}:`) });
    if (await nextChapter.count() === 1) {
      await nextChapter.click({ timeout: 3_000 });
      stillFor = 0;
      log(`NYTT KAPITEL efter · ${place}`);
      continue;
    }
    log(`stopp · ${place}`);
    break;
  }

  const audit = await page.evaluate(() => (window as unknown as { __audit: Audit }).__audit);
  console.log(`KAPITEL:\n${[...chaptersSeen].join("\n")}`);
  console.log(`UPPLÄST (${audit.spoken.length}):\n${audit.spoken.map((text) => `- ${text.slice(0, 90)}`).join("\n")}`);
  console.log(`BROTT (${audit.violations.length}):\n${audit.violations.join("\n")}`);
  expect(audit.violations).toEqual([]);
  expect(chaptersSeen.size).toBe(6);
  // Every chapter's goal, explanations, tasks and questions were heard on the way.
  expect(audit.spoken.length).toBeGreaterThan(60);
});
