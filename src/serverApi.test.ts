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
    const client = mockClient({
      findings: [{
        quote: "tes",
        occurrence: 1,
        title: "Undersök upprepningen",
        comment: "Behöver den här formuleringen upprepas?",
        category: "structure",
        rewrite: "En ny formulering som inte får visas.",
      }],
    });
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
      findings: [{
        id: "ai-0-8",
        start: 8,
        end: 11,
        quote: "tes",
        title: "Undersök upprepningen",
        message: "Behöver den här formuleringen upprepas?",
      }],
    });
    expect(draft.slice(result.body.findings[0].start, result.body.findings[0].end)).toBe("tes");
  });

  it("rejects a model highlight that is not present in the draft", async () => {
    const client = mockClient({ findings: [{
      quote: "saknas",
      occurrence: 0,
      title: "Granska",
      comment: "Vad vill du undersöka här?",
      category: "language",
    }] });
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

  it("binds capitalization and punctuation variants to the exact source span", async () => {
    const client = mockClient({ findings: [{
      quote: "TESEN är tydlig",
      occurrence: 0,
      title: "Undersök tesen",
      comment: "Vilken ståndpunkt uttrycker den här meningen?",
      category: "structure",
    }] });
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
    const client = mockClient({ findings: [{
      quote: "Skoldagen",
      occurrence: 4,
      title: "Undersök tesen",
      comment: "Vilken ståndpunkt uttrycker den här meningen?",
      category: "structure",
    }] });
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
