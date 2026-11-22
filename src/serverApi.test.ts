import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { describe, expect, it, vi } from "vitest";
import OpenAI from "openai";
import { createApiApp } from "../server/api.mjs";

function mockClient(result: unknown) {
  return {
    chat: {
      completions: {
        create: vi.fn(async () => ({
          choices: [{ message: { content: JSON.stringify(result) } }],
        })),
      },
    },
  };
}

function failingClient(error: Error) {
  return {
    chat: {
      completions: {
        create: vi.fn(async () => {
          throw error;
        }),
      },
    },
  };
}

function reviewModelResult(successQuote: string, findings: unknown[] = []) {
  return {
    success: {
      quote: successQuote,
      occurrence: 0,
      message: "Du uttrycker din ståndpunkt tydligt.",
    },
    nextStep: "Vilket exempel kan hjälpa dig att utveckla resonemanget?",
    findings: findings.map((item) => {
      if (!item || typeof item !== "object" || Array.isArray(item)) return item;
      const finding = item as Record<string, unknown>;
      return { ...finding, category: finding.category ?? "structure" };
    }),
  };
}

async function post(app: ReturnType<typeof createApiApp>, path: string, body: unknown) {
  const server = createServer(app);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address() as AddressInfo;

  try {
    const response = await fetch(`http://127.0.0.1:${address.port}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    return { status: response.status, body: await response.json() };
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve());
    });
  }
}

describe("exemplar read-aloud API", () => {
  async function requestAudio(app: ReturnType<typeof createApiApp>, body: unknown) {
    const server = createServer(app);
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    const address = server.address() as AddressInfo;

    try {
      const response = await fetch(`http://127.0.0.1:${address.port}/api/exemplar-audio`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const isAudio = response.headers.get("content-type")?.includes("audio/mpeg") ?? false;
      return {
        status: response.status,
        isAudio,
        body: isAudio ? Buffer.from(await response.arrayBuffer()).toString() : await response.json(),
      };
    } finally {
      await new Promise<void>((resolve, reject) => {
        server.close((error) => error ? reject(error) : resolve());
      });
    }
  }

  it("reads only the fixed exemplar text aloud and reuses the audio", async () => {
    const speech = vi.fn(async (_text: string) => Buffer.from("ljud"));
    const app = createApiApp({ client: null, speech });

    const first = await requestAudio(app, { exemplarId: "strong", text: "Elevens egen text ska aldrig läsas upp." });
    const second = await requestAudio(app, { exemplarId: "strong" });

    expect(first).toMatchObject({ status: 200, isAudio: true, body: "ljud" });
    expect(second).toMatchObject({ status: 200, isAudio: true, body: "ljud" });
    expect(speech).toHaveBeenCalledTimes(1);
    const spoken = speech.mock.calls[0][0];
    expect(spoken).toContain("Tallrikens tysta offer");
    expect(spoken).toContain("välja medvetet.");
    expect(spoken).not.toContain("Stolt vegetarian");
    expect(spoken).not.toContain("Elevens egen text");
  });

  it("rejects unknown exemplar ids before calling the speech service", async () => {
    const speech = vi.fn(async () => Buffer.from("ljud"));
    const result = await requestAudio(createApiApp({ client: null, speech }), { exemplarId: "__proto__" });

    expect(result.status).toBe(400);
    expect(speech).not.toHaveBeenCalled();
  });

  it("returns clear errors when read-aloud is missing or fails", async () => {
    const missing = await requestAudio(createApiApp({ client: null, speech: null }), { exemplarId: "strong" });
    expect(missing).toMatchObject({ status: 503, body: { error: "Uppläsning är inte konfigurerad på servern." } });

    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const speech = vi.fn(async () => { throw new Error("hemlig detalj"); });
    const app = createApiApp({ client: null, speech });
    const failed = await requestAudio(app, { exemplarId: "strong" });
    expect(failed.status).toBe(502);
    expect(JSON.stringify(failed.body)).not.toContain("hemlig detalj");
    await requestAudio(app, { exemplarId: "strong" });
    expect(speech).toHaveBeenCalledTimes(2);
  });
});

describe("server AI API", () => {
  it("counts each part's step from fixed things in the student's text, with the place as evidence", async () => {
    const draft = "Senare skolstart\n\nSkoldagen borde börja senare. För det första sover elever för lite, eftersom lektionerna börjar tidigt.";
    const create = vi.fn(async (request: { messages: { content: string }[]; temperature?: number }) => {
      const asked = JSON.parse(request.messages[1].content) as { look: { id: string }[] };
      // The model points out the thesis; one quote runs past what is in the text, one is not there at all.
      const answers: Record<string, { found: boolean; quote: string }> = {
        thesis: { found: true, quote: "skoldagen borde börja senare.\n\nNågot annat" },
        arguments: { found: true, quote: "Något som inte står i texten" },
      };
      return { choices: [{ message: { content: JSON.stringify({ features: asked.look.map(({ id }) => ({ id, ...(answers[id] ?? { found: false, quote: "" }) })) }) } }] };
    });
    const result = await post(createApiApp({ client: { chat: { completions: { create } } } }), "/api/progress-map", { draft, skills: ["structure", "cohesion"] });

    expect(result.status).toBe(200);
    expect(result.body.parts).toEqual([
      // Heading (found by rule) and thesis: two of five things, the first step. The quote that is not in the text does not count.
      {
        skill: "structure",
        level: 1,
        start: 18,
        end: 46,
        quote: "Skoldagen borde börja senare",
        strength: "Du har en tes som säger tydligt vad du tycker.",
        next: "Vilket skäl till kan du ge för din åsikt?",
        found: [{ id: "thesis", quote: "Skoldagen borde börja senare" }],
      },
      // Linking words are found by rule: order and cause make the second step.
      {
        skill: "cohesion",
        level: 2,
        start: 86,
        end: 94,
        quote: "eftersom",
        strength: "Du använder sambandsord som visar en orsak.",
        next: "Vilket ord kan visa en följd, alltså vad något leder till?",
        found: [],
      },
    ]);
    // Only structure needs the model. It is read twice, and only what both readings point out counts.
    expect(create).toHaveBeenCalledTimes(2);
    expect(create.mock.calls[0][0].temperature).toBe(0);
  });

  it("counts several arguments only when two different places in the text are quoted", async () => {
    const draft = "Senare skolstart\n\nSkoldagen borde börja senare. För det första sover elever för lite. För det andra lär man sig mer när man är pigg.";
    const answer = (quote: string) => mockClient({ features: [{ id: "arguments", reason: "Två skäl.", found: true, quote }] });
    const read = async (quote: string) => (await post(createApiApp({ client: answer(quote) }), "/api/progress-map", { draft, skills: ["structure"] })).body.parts[0];

    // One quote, or the same place twice, is one argument.
    expect((await read("För det första sover elever för lite.")).found).toEqual([]);
    expect((await read("För det första sover elever för lite. | För det första sover elever för lite.")).found).toEqual([]);
    const two = await read("För det första sover elever för lite. | För det andra lär man sig mer när man är pigg.");
    expect(two.found).toEqual([{ id: "arguments", quote: "För det andra lär man sig mer när man är pigg." }]);
    expect(two.strength).toBe("Du har flera argument som stöder din tes.");
  });

  it("reads the map with a stronger model and falls back to the usual one when it cannot be used", async () => {
    const draft = "Senare skolstart\n\nSkoldagen borde börja senare.";
    const unavailable = Object.assign(Object.create(OpenAI.APIError.prototype), { status: 404, message: "model not found" });
    const create = vi.fn(async (request: { model: string }) => {
      if (request.model === "gpt-4o") throw unavailable;
      return { choices: [{ message: { content: JSON.stringify({ features: [] }) } }] };
    });
    const result = await post(createApiApp({ client: { chat: { completions: { create } } } }), "/api/progress-map", { draft, skills: ["structure"] });

    expect(result.status).toBe(200);
    expect(create.mock.calls.map(([request]) => request.model).sort()).toEqual(["gpt-4o", "gpt-4o", "gpt-4o-mini", "gpt-4o-mini"]);
  });

  it("counts only what two independent readings of the text both point out", async () => {
    const draft = "Senare skolstart\n\nSkoldagen borde börja senare. Elever sover för lite.";
    let reading = 0;
    const create = vi.fn(async () => {
      reading += 1;
      // The thesis is pointed out in both readings; the counter-argument only in one of them.
      const features = [
        { id: "thesis", reason: "Tydlig ståndpunkt.", found: true, quote: "Skoldagen borde börja senare." },
        { id: "counter", reason: "Osäkert.", found: reading === 1, quote: reading === 1 ? "Elever sover för lite." : "" },
      ];
      return { choices: [{ message: { content: JSON.stringify({ features }) } }] };
    });
    const result = await post(createApiApp({ client: { chat: { completions: { create } } } }), "/api/progress-map", { draft, skills: ["structure"] });

    expect(result.body.parts[0].found).toEqual([{ id: "thesis", quote: "Skoldagen borde börja senare." }]);
  });

  it("keeps what Edda has pointed out before as long as that place is still in the text", async () => {
    const draft = "Senare skolstart\n\nSkoldagen borde börja senare. Elever sover för lite.";
    const client = mockClient({ features: [] });
    const body = { draft, skills: ["structure"], known: [{ skill: "structure", id: "thesis", quote: "Skoldagen borde börja senare." }] };
    const kept = await post(createApiApp({ client }), "/api/progress-map", body);
    const removed = await post(createApiApp({ client }), "/api/progress-map", { ...body, draft: "Senare skolstart\n\nElever sover för lite." });

    expect(kept.body.parts[0].found).toEqual([{ id: "thesis", quote: "Skoldagen borde börja senare." }]);
    expect(kept.body.parts[0].strength).toBe("Du har en tes som säger tydligt vad du tycker.");
    expect(removed.body.parts[0].found).toEqual([]);
    expect(removed.body.parts[0].strength).toBe("Du har en rubrik som visar vad texten handlar om.");
  });

  it("reads the parts that follow plain rules without the AI service", async () => {
    const draft = "Senare skolstart\n\nSkoldagen borde börja senare. Dessutom sover elever för lite.";
    const result = await post(createApiApp({ client: null }), "/api/progress-map", { draft, skills: ["cohesion"] });
    const needsModel = await post(createApiApp({ client: null }), "/api/progress-map", { draft, skills: ["structure"] });

    expect(result.body.parts[0]).toMatchObject({ skill: "cohesion", level: 1, quote: "Dessutom" });
    expect(needsModel.status).toBe(503);
  });

  it("rejects a map request for unknown or repeated parts", async () => {
    const app = createApiApp({ client: mockClient({}) });
    expect((await post(app, "/api/progress-map", { draft: "Text", skills: ["grade"] })).status).toBe(400);
    expect((await post(app, "/api/progress-map", { draft: "Text", skills: ["structure", "structure"] })).status).toBe(400);
    expect((await post(app, "/api/progress-map", { draft: "", skills: ["structure"] })).status).toBe(400);
  });

  it("points out where the student's own text shows a self-check statement, bound to that text", async () => {
    const draft = "Senare skolstart\n\nSkoldagen borde börja senare.";
    const client = mockClient({ found: true, quote: "skoldagen borde börja senare", occurrence: 0 });
    const result = await post(createApiApp({ client }), "/api/locate", { draft, statement: "Min tes visar tydligt vad jag tycker." });

    expect(result.status).toBe(200);
    expect(result.body).toEqual({ found: true, start: 18, end: 46, quote: "Skoldagen borde börja senare" });
  });

  it("marks nothing when the place is missing or cannot be found in the text", async () => {
    const draft = "Senare skolstart";
    const missing = await post(createApiApp({ client: mockClient({ found: false, quote: "", occurrence: 0 }) }), "/api/locate", { draft, statement: "Min text har ett motargument." });
    const invented = await post(createApiApp({ client: mockClient({ found: true, quote: "Något som inte står där", occurrence: 0 }) }), "/api/locate", { draft, statement: "Min text har ett motargument." });
    const invalid = await post(createApiApp({ client: mockClient({ found: true }) }), "/api/locate", { draft: "", statement: "x" });

    expect(missing.body).toEqual({ found: false });
    expect(invented.body).toEqual({ found: false });
    expect(invalid.status).toBe(400);
  });

  it("only returns review highlights that exactly match the student's text", async () => {
    const client = mockClient(reviewModelResult("tes", [{
        quote: "tes",
        occurrence: 1,
        title: "Undersök upprepningen",
        comment: "Behöver den här formuleringen upprepas?",
        category: "structure",
        rewrite: "En ny formulering som inte får visas.",
      }]));
    const draft = "tes och tes";
    const result = await post(createApiApp({ client }), "/api/review", {
      draft,
      lessonTitle: "Struktur",
      phase: "Träna själv",
      goal: "Visa en tydlig tes.",
      criteria: ["Textens struktur"],
    });

    expect(result.status).toBe(200);
    expect(client.chat.completions.create).toHaveBeenCalledWith(expect.objectContaining({
      messages: expect.arrayContaining([
        expect.objectContaining({ role: "user", content: expect.stringContaining('"phase":"Träna själv"') }),
      ]),
    }));
    expect(result.body).toEqual({
      success: {
        start: 0,
        end: 3,
        quote: "tes",
        message: "Du uttrycker din ståndpunkt tydligt.",
      },
      nextStep: "Vilket exempel kan hjälpa dig att utveckla resonemanget?",
      findings: [{
        id: "ai-0-8",
        start: 8,
        end: 11,
        quote: "tes",
        title: "Undersök upprepningen",
        message: "Behöver den här formuleringen upprepas?",
        category: "structure",
      }],
    });
    expect(draft.slice(result.body.findings[0].start, result.body.findings[0].end)).toBe("tes");
  });

  it("creates a fictional personalized example without sending student text", async () => {
    const client = mockClient({
      needsWork: "Skoldagen ska börja senare.",
      developed: "En senare start kan ge fler elever tid att resa till skolan utan stress.",
      question: "Vilken förklaring gör det andra exemplet tydligare?",
    });
    const result = await post(createApiApp({ client }), "/api/example", {
      skillId: "reasoning",
      lessonTitle: "Resonemang",
      goal: "Utveckla skäl med förklaringar.",
      interest: "sports",
      supportLevel: 1,
      evidence: [{
        skillId: "structure",
        latest: "independent",
        observations: 2,
        independent: 2,
        supported: 0,
        needsSupport: 0,
        selfReport: null,
      }],
    });

    expect(result.status).toBe(200);
    expect(client.chat.completions.create).toHaveBeenCalledWith(expect.objectContaining({
      messages: expect.arrayContaining([
        expect.objectContaining({ role: "system", content: expect.stringContaining("ingen elevtext har skickats") }),
        expect.objectContaining({ role: "system", content: expect.stringContaining("question ska jämföra just dessa två exempel") }),
        expect.objectContaining({ role: "user", content: expect.not.stringContaining('"draft"') }),
      ]),
    }));
    expect(result.body).toEqual({
      needsWork: "Skoldagen ska börja senare.",
      developed: "En senare start kan ge fler elever tid att resa till skolan utan stress.",
      question: "Vilken förklaring gör det andra exemplet tydligare?",
    });
  });

  it("rejects personalized examples with unknown interests or invalid evidence", async () => {
    const client = mockClient({});
    const result = await post(createApiApp({ client }), "/api/example", {
      skillId: "reasoning",
      lessonTitle: "Resonemang",
      goal: "Utveckla skäl.",
      interest: "sensitive-personal-topic",
      supportLevel: 1,
      evidence: [],
    });

    expect(result.status).toBe(400);
    expect(client.chat.completions.create).not.toHaveBeenCalled();
  });

  it("accepts a short improvement hint that is not phrased as a question", async () => {
    const client = mockClient(reviewModelResult("Tesen", [{
      quote: "Tesen",
      occurrence: 0,
      title: "Utveckla argumentet",
      comment: "Lägg till ett exempel som visar hur skälet stödjer tesen.",
      category: "reasoning",
    }]));
    const result = await post(createApiApp({ client }), "/api/review", {
      draft: "Tesen är att skoldagen borde börja senare.",
      lessonTitle: "Resonemang",
      phase: "Träna själv",
      goal: "Utveckla argumenten.",
      criteria: ["Argumentens underbyggnad"],
    });

    expect(result.status).toBe(200);
    expect(result.body.findings[0].message).toBe("Lägg till ett exempel som visar hur skälet stödjer tesen.");
  });

  it("rejects a model highlight that is not present in the draft", async () => {
    const client = mockClient(reviewModelResult("En", [{
      quote: "saknas",
      occurrence: 0,
      title: "Granska",
      comment: "Vad vill du undersöka här?",
      category: "language",
    }]));
    const result = await post(createApiApp({ client }), "/api/review", {
      draft: "En text.",
      lessonTitle: "Struktur",
      phase: "Träna själv",
      goal: "Visa en tydlig tes.",
      criteria: ["Textens struktur"],
    });

    expect(result.status).toBe(502);
    expect(result.body.error).toContain("citat");
    expect(result.body.error).not.toContain("saknas");
  });

  it("rejects success feedback that cannot be anchored to the draft", async () => {
    const client = mockClient(reviewModelResult("saknas"));
    const result = await post(createApiApp({ client }), "/api/review", {
      draft: "En text.",
      lessonTitle: "Struktur",
      phase: "Träna själv",
      goal: "Visa en tydlig tes.",
      criteria: ["Textens struktur"],
    });

    expect(result.status).toBe(502);
    expect(result.body.error).toContain("framgångsåterkopplingen");
  });

  it("binds capitalization and punctuation variants to the exact source span", async () => {
    const client = mockClient(reviewModelResult("Tesen", [{
      quote: "TESEN är tydlig",
      occurrence: 0,
      title: "Undersök tesen",
      comment: "Vilken ståndpunkt uttrycker den här meningen?",
      category: "structure",
    }]));
    const result = await post(createApiApp({ client }), "/api/review", {
      draft: "Tesen, är tydlig.",
      lessonTitle: "Struktur",
      phase: "Modellering",
      goal: "Visa en tydlig tes.",
      criteria: ["Textens struktur"],
    });

    expect(result.status).toBe(200);
    expect(result.body.findings[0]).toMatchObject({
      start: 0,
      end: 16,
      quote: "Tesen, är tydlig",
    });
  });

  it("uses a unique exact quote when the model gives an incorrect occurrence number", async () => {
    const client = mockClient(reviewModelResult("Skoldagen", [{
      quote: "Skoldagen",
      occurrence: 4,
      title: "Undersök tesen",
      comment: "Vilken ståndpunkt uttrycker den här meningen?",
      category: "structure",
    }]));
    const result = await post(createApiApp({ client }), "/api/review", {
      draft: "Skoldagen borde börja senare.",
      lessonTitle: "Struktur",
      phase: "Modellering",
      goal: "Visa en tydlig tes.",
      criteria: ["Textens struktur"],
    });

    expect(result.status).toBe(200);
    expect(result.body.findings[0]).toMatchObject({ start: 0, end: 9, quote: "Skoldagen" });
  });

  it("explains an OpenAI quota error without exposing provider details", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const error = new OpenAI.APIError(
      429,
      { code: "insufficient_quota", message: "provider detail" },
      "provider detail",
      new Headers(),
    );
    const result = await post(createApiApp({ client: failingClient(error) }), "/api/review", {
      draft: "En syntetisk elevtext.",
      lessonTitle: "Struktur",
      phase: "Modellering",
      goal: "Visa en tydlig tes.",
      criteria: ["Textens struktur"],
    });

    expect(result.status).toBe(502);
    expect(result.body.error).toContain("API-kvot");
    expect(JSON.stringify(result.body)).not.toContain("provider detail");
  });

  it("returns an explicit configuration error instead of using a fallback when no server key is configured", async () => {
    const result = await post(createApiApp({ client: null }), "/api/check-in", {
      mode: "text",
      question: "Vad är en tes?",
      answer: "En ståndpunkt.",
      focus: "tes",
    });

    expect(result.status).toBe(503);
    expect(result.body).toHaveProperty("error");
  });

  it("returns short formative feedback for an open response", async () => {
    const client = mockClient({ kind: "on_track", feedback: "Kan du ge ett exempel?" });
    const result = await post(createApiApp({ client }), "/api/check-in", {
      mode: "text",
      question: "Vad är en tes?",
      answer: "En tydlig ståndpunkt.",
      focus: "tesens funktion",
    });

    expect(result.status).toBe(200);
    // Without a valid level from the model the answer counts as on track but brief.
    expect(result.body).toEqual({ kind: "on_track", feedback: "Kan du ge ett exempel?", level: 1 });
  });

  it("passes only validated learning signals with the student's submitted answer", async () => {
    const client = mockClient({ kind: "on_track", feedback: "Kan du ge ett exempel?" });
    const result = await post(createApiApp({ client }), "/api/check-in", {
      mode: "text",
      question: "Vad är en tes?",
      answer: "En tydlig ståndpunkt.",
      focus: "tesens funktion",
      learningContext: {
        attempt: 2,
        supportLevel: 1,
        priorEvidence: [{ skillId: "structure", evidence: "supported" }],
      },
    });

    expect(result.status).toBe(200);
    expect(client.chat.completions.create).toHaveBeenCalledWith(expect.objectContaining({
      messages: expect.arrayContaining([
        expect.objectContaining({
          role: "user",
          content: expect.stringContaining('"evidence":"supported"'),
        }),
      ]),
    }));
  });

  it("evaluates an adapted check-in using its personalized example pair", async () => {
    const client = mockClient({ kind: "on_track", feedback: "Du jämför exemplen. Vad gör förklaringen tydlig?" });
    const exampleContext = {
      needsWork: "Musik är bra.",
      developed: "Musik kan samla människor eftersom de delar en upplevelse.",
    };
    const result = await post(createApiApp({ client }), "/api/check-in", {
      mode: "text",
      question: "Vad förklarar sambandet i det andra exemplet?",
      answer: "Det förklarar varför musik kan samla människor.",
      focus: "jämföra hur resonemang utvecklas",
      exampleContext,
    });

    expect(result.status).toBe(200);
    expect(client.chat.completions.create).toHaveBeenCalledWith(expect.objectContaining({
      messages: expect.arrayContaining([
        expect.objectContaining({
          role: "user",
          content: expect.stringContaining(JSON.stringify(exampleContext)),
        }),
      ]),
    }));
  });

  it("rejects malformed personalized example context before calling the model", async () => {
    const client = mockClient({ kind: "on_track", feedback: "Kan du ge ett exempel?" });
    const result = await post(createApiApp({ client }), "/api/check-in", {
      mode: "text",
      question: "Vad förklarar sambandet i exemplet?",
      answer: "En förklaring.",
      focus: "resonemang",
      exampleContext: {
        needsWork: "x".repeat(241),
        developed: "En utvecklad förklaring.",
      },
    });

    expect(result.status).toBe(400);
    expect(client.chat.completions.create).not.toHaveBeenCalled();
  });

  it("rejects malformed or unknown learning evidence", async () => {
    const client = mockClient({ kind: "on_track", feedback: "Kan du ge ett exempel?" });
    const result = await post(createApiApp({ client }), "/api/check-in", {
      mode: "text",
      question: "Vad är en tes?",
      answer: "En tydlig ståndpunkt.",
      focus: "tesens funktion",
      learningContext: {
        attempt: 99,
        supportLevel: 4,
        priorEvidence: [{ skillId: "unknown", evidence: "mastered" }],
      },
    });

    expect(result.status).toBe(400);
    expect(client.chat.completions.create).not.toHaveBeenCalled();
  });

  it("does not allow the model to contradict the known correctness of a choice", async () => {
    const client = mockClient({ kind: "on_track", feedback: "Fundera på frågan." });
    const result = await post(createApiApp({ client }), "/api/check-in", {
      mode: "choice",
      question: "Vad visar en tes?",
      answer: "Textens signatur.",
      focus: "tesens funktion",
      isCorrect: false,
    });

    expect(result.status).toBe(502);
    expect(result.body).toHaveProperty("error");
  });

  it("reports how developed a written answer was and never gives a click the highest level", async () => {
    const written = await post(createApiApp({ client: mockClient({ kind: "on_track", level: 3, feedback: "Du förklarar och ger skäl. Vad vill du lägga till?" }) }), "/api/check-in", {
      mode: "text",
      question: "Vad är en tes?",
      answer: "Tesen är det skribenten vill övertyga läsaren om, och den behöver stå tidigt så att läsaren kan följa argumenten.",
      focus: "tesens funktion",
    });
    expect(written.body).toMatchObject({ kind: "on_track", level: 3 });

    const click = (attempt: number) => post(createApiApp({ client: mockClient({ kind: "on_track", level: 3, feedback: "Du valde tesen. Vad visar den?" }) }), "/api/check-in", {
      mode: "choice",
      question: "Vilken formulering visar en tydlig tes?",
      answer: "Skoldagen borde börja senare.",
      focus: "tesens funktion",
      isCorrect: true,
      learningContext: { attempt, supportLevel: 0, priorEvidence: [] },
    });
    // A click on the right place is simply right: it is not given a step.
    expect((await click(1)).body).toEqual({ kind: "on_track", feedback: "Du valde tesen. Vad visar den?" });
    expect((await click(2)).body).toEqual({ kind: "on_track", feedback: "Du valde tesen. Vad visar den?" });

    const retry = await post(createApiApp({ client: mockClient({ kind: "retry", level: 2, feedback: "Vad vill skribenten?" }) }), "/api/check-in", {
      mode: "text",
      question: "Vad är en tes?",
      answer: "Vet inte.",
      focus: "tesens funktion",
    });
    expect(retry.body).toEqual({ kind: "retry", feedback: "Vad vill skribenten?" });
  });

  it("tells the model about the writing task when Edda reads the text after it", async () => {
    const client = mockClient(reviewModelResult("Skoldagen"));
    const result = await post(createApiApp({ client }), "/api/review", {
      draft: "Skoldagen borde börja senare.",
      lessonTitle: "Bygg upp en argumenterande text",
      phase: "Träna själv",
      goal: "Mål",
      criteria: ["Textens struktur och innehåll"],
      task: "Börja med att skriva din inledning med tes.",
    });

    expect(result.status).toBe(200);
    const call = client.chat.completions.create.mock.calls[0] as unknown as [{ messages: { role: string; content: string }[] }];
    const [system, user] = call[0].messages;
    expect(system.content).toContain("Ge högst en förbättringspunkt.");
    expect(system.content).toContain("aldrig som ett fel");
    expect(JSON.parse(user.content)).toMatchObject({ task: "Börja med att skriva din inledning med tes." });

    // When the student has tried the advice, Edda is asked what got better and gives no new points.
    const followUpClient = mockClient(reviewModelResult("Skoldagen"));
    await post(createApiApp({ client: followUpClient }), "/api/review", {
      draft: "Skoldagen borde börja senare, eftersom man lär sig bättre utvilad.",
      lessonTitle: "Bygg upp en argumenterande text",
      phase: "Träna själv",
      goal: "Mål",
      criteria: [],
      task: "Börja med att skriva din inledning med tes.",
      followUp: "Pröva att lägga till ett skäl efter tesen.",
    });
    const followUpCall = followUpClient.chat.completions.create.mock.calls[0] as unknown as [{ messages: { role: string; content: string }[] }];
    expect(followUpCall[0].messages[0].content).toContain("findings ska vara en tom lista");
    expect(JSON.parse(followUpCall[0].messages[1].content)).toMatchObject({ followUp: "Pröva att lägga till ett skäl efter tesen." });

    const tooLong = await post(createApiApp({ client }), "/api/review", {
      draft: "Skoldagen borde börja senare.",
      lessonTitle: "Bygg upp en argumenterande text",
      phase: "Träna själv",
      goal: "Mål",
      criteria: [],
      task: "x".repeat(301),
    });
    expect(tooLong.status).toBe(400);
  });

  it("lets Edda end with a statement when the answer is on track, but requires a question for a new try", async () => {
    const onTrack = await post(createApiApp({ client: mockClient({ kind: "on_track", level: 2, feedback: "Du förklarar vad en tes gör i texten." }) }), "/api/check-in", {
      mode: "text",
      question: "Vad är en tes?",
      answer: "Det skribenten vill övertyga läsaren om.",
      focus: "tesens funktion",
    });
    expect(onTrack.body).toEqual({ kind: "on_track", feedback: "Du förklarar vad en tes gör i texten.", level: 2 });

    // A new try without a question is asked for once more; after that Edda's answer is shown anyway.
    const client = mockClient({ kind: "retry", level: 1, feedback: "Titta en gång till." });
    const retry = await post(createApiApp({ client }), "/api/check-in", {
      mode: "text",
      question: "Vad är en tes?",
      answer: "Vet inte.",
      focus: "tesens funktion",
    });
    expect(retry.body).toEqual({ kind: "retry", feedback: "Titta en gång till." });
    expect(client.chat.completions.create).toHaveBeenCalledTimes(2);
  });

  it("asks the model again when its answer cannot be read, and shortens an answer that is too long", async () => {
    const create = vi.fn()
      .mockResolvedValueOnce({ choices: [{ message: { content: "{\"kind\": \"on_tr" } }] })
      .mockResolvedValueOnce({ choices: [{ message: { content: JSON.stringify({ kind: "on_track", level: 2, feedback: `${"Du förklarar vad en tes gör i texten. ".repeat(14)}` }) } }] });
    const result = await post(createApiApp({ client: { chat: { completions: { create } } } }), "/api/check-in", {
      mode: "text",
      question: "Vad är en tes?",
      answer: "Det skribenten vill övertyga läsaren om.",
      focus: "tesens funktion",
    });

    expect(result.status).toBe(200);
    expect(create).toHaveBeenCalledTimes(2);
    expect(result.body.feedback.length).toBeLessThanOrEqual(420);
    expect(result.body.feedback.endsWith("texten.")).toBe(true);
  });

  it("reads Edda's guidance aloud and reuses the audio for the same text", async () => {
    const speech = vi.fn(async (_text: string) => Buffer.from("ljud"));
    const app = createApiApp({ client: null, speech });
    const request = async (body: unknown) => {
      const server = createServer(app);
      await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
      const address = server.address() as AddressInfo;
      try {
        const response = await fetch(`http://127.0.0.1:${address.port}/api/speech`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        return { status: response.status, type: response.headers.get("content-type") };
      } finally {
        await new Promise<void>((resolve, reject) => {
          server.close((error) => error ? reject(error) : resolve());
        });
      }
    };

    expect(await request({ text: "Här står tesen." })).toMatchObject({ status: 200, type: expect.stringContaining("audio/mpeg") });
    expect(await request({ text: "Här står tesen." })).toMatchObject({ status: 200 });
    expect(speech).toHaveBeenCalledTimes(1);
    expect(speech).toHaveBeenCalledWith("Här står tesen.");

    // Long or missing texts are refused before the speech service is called.
    expect((await request({ text: "x".repeat(601) })).status).toBe(400);
    expect((await request({})).status).toBe(400);
    expect(speech).toHaveBeenCalledTimes(1);

    const withoutVoice = createApiApp({ client: null, speech: null });
    const server = createServer(withoutVoice);
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    const address = server.address() as AddressInfo;
    const response = await fetch(`http://127.0.0.1:${address.port}/api/speech`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "Här står tesen." }),
    });
    await new Promise<void>((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve());
    });
    expect(response.status).toBe(503);
  });
});
