import type { ReviewFeedback } from "./coachApi";

export const demoSubmissionsKey = "skrivcoach-demo-teacher-inbox-v1";
const maxDemoSubmissions = 20;

export type DemoSubmission = {
  id: string;
  submittedAt: string;
  studentLabel: "Demo-elev";
  prompt: string;
  draft: string;
  feedback: ReviewFeedback | null;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isSubmission(value: unknown): value is DemoSubmission {
  if (
    !isRecord(value) ||
    typeof value.id !== "string" ||
    value.id.length > 80 ||
    typeof value.submittedAt !== "string" ||
    !Number.isFinite(Date.parse(value.submittedAt)) ||
    value.studentLabel !== "Demo-elev" ||
    typeof value.prompt !== "string" ||
    value.prompt.length > 600 ||
    typeof value.draft !== "string" ||
    value.draft.length === 0 ||
    value.draft.length > 16_000
  ) return false;
  if (value.feedback === null) return true;
  if (!isRecord(value.feedback) || !isRecord(value.feedback.success) || !Array.isArray(value.feedback.findings)) return false;
  return typeof value.feedback.success.message === "string" &&
    typeof value.feedback.success.quote === "string" &&
    typeof value.feedback.nextStep === "string" &&
    value.feedback.findings.every((finding) =>
      isRecord(finding) &&
      typeof finding.id === "string" &&
      typeof finding.title === "string" &&
      typeof finding.message === "string",
    );
}

export function readDemoSubmissions(storage: Pick<Storage, "getItem">): { submissions: DemoSubmission[]; error: boolean } {
  try {
    const saved = storage.getItem(demoSubmissionsKey);
    if (!saved) return { submissions: [], error: false };
    const parsed: unknown = JSON.parse(saved);
    if (!Array.isArray(parsed) || parsed.length > maxDemoSubmissions || !parsed.every(isSubmission)) {
      return { submissions: [], error: true };
    }
    return { submissions: parsed, error: false };
  } catch {
    return { submissions: [], error: true };
  }
}

export function saveDemoSubmission(
  storage: Pick<Storage, "getItem" | "setItem">,
  draft: string,
  prompt: string,
  feedback: ReviewFeedback | null,
  id: string = crypto.randomUUID(),
  submittedAt = new Date().toISOString(),
): { submission: DemoSubmission | null; error: boolean } {
  const saved = readDemoSubmissions(storage);
  if (saved.error || !draft.trim() || draft.length > 16_000 || !prompt.trim() || prompt.length > 600) {
    return { submission: null, error: true };
  }

  const submission: DemoSubmission = {
    id,
    submittedAt,
    studentLabel: "Demo-elev",
    prompt,
    draft,
    feedback,
  };
  try {
    storage.setItem(demoSubmissionsKey, JSON.stringify([...saved.submissions, submission].slice(-maxDemoSubmissions)));
    return { submission, error: false };
  } catch {
    return { submission: null, error: true };
  }
}

export function clearDemoSubmissions(storage: Pick<Storage, "removeItem">): boolean {
  try {
    storage.removeItem(demoSubmissionsKey);
    return true;
  } catch {
    return false;
  }
}
