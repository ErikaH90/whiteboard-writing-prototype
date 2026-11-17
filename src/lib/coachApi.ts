export type Finding = {
  id: string;
  start: number;
  end: number;
  quote: string;
  title: string;
  message: string;
};

type ReviewRequest = {
  draft: string;
  lessonTitle: string;
  goal: string;
  criteria: string[];
};

type CheckInRequest = {
  mode: "choice" | "text";
  question: string;
  answer: string;
  focus: string;
  isCorrect?: boolean;
};

export type CheckInFeedback = {
  kind: "on_track" | "retry";
  feedback: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isFinding(value: unknown): value is Finding {
  return isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.start === "number" &&
    Number.isSafeInteger(value.start) &&
    typeof value.end === "number" &&
    Number.isSafeInteger(value.end) &&
    typeof value.quote === "string" &&
    typeof value.title === "string" &&
    typeof value.message === "string";
}

async function postJson(path: string, body: unknown): Promise<unknown> {
  let response: Response;

  try {
    response = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error("Kunde inte nå AI-tjänsten. Kontrollera att servern kör och försök igen.");
  }

  let result: unknown;
  try {
    result = await response.json();
  } catch {
    throw new Error("AI-tjänsten gav ett svar som inte kunde läsas.");
  }

  if (!response.ok) {
    const message = isRecord(result) && typeof result.error === "string"
      ? result.error
      : "AI-tjänsten kunde inte behandla förfrågan.";
    throw new Error(message);
  }

  return result;
}

export async function reviewDraft(request: ReviewRequest): Promise<Finding[]> {
  const result = await postJson("/api/review", request);
  if (!isRecord(result) || !Array.isArray(result.findings) || result.findings.length > 5) {
    throw new Error("AI-granskningen gav ett ogiltigt resultat.");
  }

  const findings = result.findings.filter(isFinding);
  if (findings.length !== result.findings.length) {
    throw new Error("AI-granskningen gav en ogiltig markering.");
  }
  let previousEnd = 0;

  for (const finding of findings) {
    if (
      typeof finding.id !== "string" ||
      typeof finding.title !== "string" ||
      typeof finding.message !== "string" ||
      typeof finding.quote !== "string" ||
      !Number.isSafeInteger(finding.start) ||
      !Number.isSafeInteger(finding.end) ||
      finding.start < previousEnd ||
      finding.end <= finding.start ||
      request.draft.slice(finding.start, finding.end) !== finding.quote
    ) {
      throw new Error("AI-granskningen innehöll en markering som inte stämmer med texten.");
    }

    previousEnd = finding.end;
  }

  return findings;
}

export async function submitCheckIn(request: CheckInRequest): Promise<CheckInFeedback> {
  const result = await postJson("/api/check-in", request);
  if (
    !isRecord(result) ||
    (result.kind !== "on_track" && result.kind !== "retry") ||
    typeof result.feedback !== "string" ||
    result.feedback.trim().length === 0
  ) {
    throw new Error("AI-återkopplingen gav ett ogiltigt resultat.");
  }

  return { kind: result.kind, feedback: result.feedback };
}
