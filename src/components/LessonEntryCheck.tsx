import { useState, type FormEvent } from "react";
import type { LearningEvidence, Lesson } from "../data/lessons";
import { submitCheckIn, type CheckInFeedback, type LearningContext } from "../lib/coachApi";
import type { DifficultyRating } from "../lib/learnerProfile";

type Props = {
  lesson: Lesson;
  learningEvidence: Partial<Record<LearningEvidenceKey, LearningEvidence>>;
  priorEvidence: LearningContext["priorEvidence"];
  difficultyRating: DifficultyRating | null;
  onEvidence: (skillIds: Lesson["skillIds"], evidence: LearningEvidence) => void;
  onDifficulty: (skillIds: Lesson["skillIds"], rating: DifficultyRating) => void;
  onComplete: () => void;
};

type LearningEvidenceKey = Lesson["skillIds"][number];
const maxAttempts = 10;

export default function LessonEntryCheck({
  lesson,
  learningEvidence,
  priorEvidence,
  difficultyRating,
  onEvidence,
  onDifficulty,
  onComplete,
}: Props) {
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState<CheckInFeedback | null>(null);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [supportLevel, setSupportLevel] = useState<0 | 1 | 2>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const relevantEvidence = lesson.entryCheck.skillIds.flatMap((skillId) => {
    const evidence = learningEvidence[skillId];
    return evidence ? [{ skillId, evidence }] : [];
  });
  const needsSupport = relevantEvidence.some((item) => item.evidence === "needs_support");
  const isIndependent = relevantEvidence.length > 0 && relevantEvidence.every((item) => item.evidence === "independent");
  const question = needsSupport
    ? lesson.entryCheck.supportQuestion
    : isIndependent
      ? lesson.entryCheck.extensionQuestion
      : lesson.entryCheck.question;

  async function submitAnswer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setRequestError(null);
    setFeedback(null);
    setIsSubmitting(true);

    try {
      const nextAttempt = attempt + 1;
      const result = await submitCheckIn({
        mode: "text",
        question,
        answer: answer.trim(),
        focus: lesson.entryCheck.focus,
        learningContext: {
          attempt: nextAttempt,
          supportLevel,
          priorEvidence,
        },
      });
      setAttempt(nextAttempt);
      setFeedback(result);
      onEvidence(lesson.entryCheck.skillIds, result.kind === "retry"
        ? "needs_support"
        : supportLevel === 0 ? "independent" : "supported");
      if (result.kind === "retry") setSupportLevel((current) => current === 2 ? 2 : 1);
    } catch (error) {
      setRequestError(error instanceof Error ? error.message : "AI-återkopplingen misslyckades. Försök igen.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="entry-check" aria-labelledby="entry-check-title">
      <p className="board-kicker">{lesson.entryCheck.previousTopic}</p>
      <h2 className="board-prompt" id="entry-check-title">
        {lesson.entryCheck.previousTopic === "Dina förkunskaper" ? "Hämta fram det du redan vet" : "Börja med att återkalla"}
      </h2>
      <p className="entry-check-question">{question}</p>

      <form className="entry-check-form" onSubmit={submitAnswer}>
        <label className="check-in-answer-label" htmlFor="entry-check-answer">Ditt svar, utan ledtråd</label>
        <textarea
          className="check-in-answer"
          id="entry-check-answer"
          maxLength={2_000}
          onChange={(event) => {
            setAnswer(event.target.value);
            setFeedback(null);
            setRequestError(null);
          }}
          placeholder="Skriv det du kommer ihåg..."
          rows={3}
          value={answer}
        />
        {feedback && (
          <div className={`check-in-feedback is-${feedback.kind === "on_track" ? "on-track" : "retry"}`} role="status">
            <strong>AI-coach</strong>
            <span>{feedback.feedback}</span>
          </div>
        )}
        {feedback && <p className="entry-check-bridge"><strong>Koppling till momentet:</strong> {lesson.entryCheck.bridge}</p>}
        {feedback && (
          <div className="difficulty-rating" role="group" aria-label="Hur kändes frågan?">
            <span>Hur kändes frågan? Din skattning hjälper välja nästa stöd.</span>
            {([
              ["too_easy", "För lätt"],
              ["about_right", "Lagom"],
              ["too_hard", "För svårt"],
            ] as const).map(([rating, label]) => (
              <button
                aria-pressed={difficultyRating === rating}
                className="difficulty-rating-option"
                key={rating}
                onClick={() => onDifficulty(lesson.entryCheck.skillIds, rating)}
                type="button"
              >
                {label}
              </button>
            ))}
          </div>
        )}
        {feedback?.kind === "retry" && (
          <div className="entry-check-support">
            <strong>Ett steg tillbaka</strong>
            <p>{lesson.foundationSupport}</p>
            {supportLevel === 2 && <p className="entry-check-example">{lesson.foundationExample}</p>}
            <div className="entry-check-support-actions">
              {supportLevel < 2 && (
                <button className="text-button" onClick={() => setSupportLevel(2)} type="button">
                  Visa ett exempel
                </button>
              )}
              {attempt < maxAttempts && (
                <button
                  className="quiet-button"
                  onClick={() => {
                    setFeedback(null);
                    setAnswer("");
                  }}
                  type="button"
                >
                  Försök igen
                </button>
              )}
            </div>
          </div>
        )}
        {requestError && <p className="check-in-error" role="alert">{requestError}</p>}
        {requestError && (
          <button className="text-button entry-check-continue" onClick={onComplete} type="button">
            Fortsätt utan AI-återkoppling
          </button>
        )}
        <div className="check-in-actions">
          <p className="ai-action-note">Ditt svar skickas till OpenAI när du skickar in det.</p>
          {feedback?.kind === "on_track" ? (
            <button className="primary-button" onClick={onComplete} type="button">Börja momentet</button>
          ) : feedback?.kind === "retry" ? (
            <button className="primary-button" onClick={onComplete} type="button">Gå vidare till modellen</button>
          ) : !feedback && attempt >= maxAttempts ? (
            <button className="primary-button" onClick={onComplete} type="button">
              Fortsätt till modellen utan fler försök
            </button>
          ) : (
              <button className="primary-button check-in-submit" disabled={!answer.trim() || isSubmitting || attempt >= maxAttempts} type="submit">
              {isSubmitting ? "Skickar …" : attempt > 0 ? "Svara igen" : "Svara"}
            </button>
          )}
        </div>
      </form>
      {!feedback && (
        <p className="entry-check-note">
          Om det känns svårt får du ett kort exempel efter ditt försök.
        </p>
      )}
    </section>
  );
}
