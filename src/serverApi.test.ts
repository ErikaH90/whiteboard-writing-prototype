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
    expect(result.body).toEqual({ kind: "on_track", feedback: "Kan du ge ett exempel?" });
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
});
