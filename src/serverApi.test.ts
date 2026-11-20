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
    expect((await click(1)).body).toMatchObject({ kind: "on_track", level: 2 });
    expect((await click(2)).body).toMatchObject({ kind: "on_track", level: 1 });

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

    const retry = await post(createApiApp({ client: mockClient({ kind: "retry", level: 1, feedback: "Titta en gång till." }) }), "/api/check-in", {
      mode: "text",
      question: "Vad är en tes?",
      answer: "Vet inte.",
      focus: "tesens funktion",
    });
    expect(retry.status).toBe(502);
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
