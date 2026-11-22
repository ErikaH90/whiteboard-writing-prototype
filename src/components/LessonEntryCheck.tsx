import { useState, type FormEvent } from "react";
import EddaFeedback from "./EddaFeedback";
import type { LearningEvidence, Lesson } from "../data/lessons";
import { submitCheckIn, type CheckInFeedback, type LearningContext } from "../lib/coachApi";
import { AfterWriting, BoardSequence, BoardStep, Written } from "./BoardWriting";

type Props = {
  lesson: Lesson;
  learningEvidence: Partial<Record<LearningEvidenceKey, LearningEvidence>>;
  priorEvidence: LearningContext["priorEvidence"];
  onEvidence: (skillIds: Lesson["skillIds"], evidence: LearningEvidence) => void;
  /** Called with the answer the student last submitted, if any. */
  onComplete: (answer: string | null) => void;
};

type LearningEvidenceKey = Lesson["skillIds"][number];
const maxAttempts = 10;

export default function LessonEntryCheck({
  lesson,
  learningEvidence,
  priorEvidence,
  onEvidence,
  onComplete,
}: Props) {
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState<CheckInFeedback | null>(null);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [supportLevel, setSupportLevel] = useState<0 | 1 | 2>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [firstSubmitted, setFirstSubmitted] = useState<string | null>(null);
  const complete = () => onComplete(firstSubmitted);
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
      setFirstSubmitted((current) => current ?? answer.trim());
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
      <BoardSequence>
      {/* The lesson opens by catching attention and stating the goal, before prior knowledge is recalled. */}
      <BoardStep pause>
        <p className="board-hook"><Written byHand>{lesson.hook}</Written></p>
      </BoardStep>
      <BoardStep pause>
        <h2 className="board-prompt"><Written byHand>Målet med lektionen</Written></h2>
        <p className="activity-instruction"><Written keys={lesson.goalKeys} spoken>{lesson.learnerGoal}</Written></p>
        {/* Why it is worth the effort: for the student's own text now, and for the grade in Swedish in the long run. */}
        <p className="board-worth"><Written>{lesson.worth}</Written></p>
      </BoardStep>
      <BoardStep>
      <p className="board-kicker"><Written>{lesson.entryCheck.previousTopic}</Written></p>
      <h2 className="board-prompt" id="entry-check-title">
        <Written byHand>{lesson.entryCheck.previousTopic === "Dina förkunskaper" ? "Hämta fram det du redan vet" : "Börja med att återkalla"}</Written>
      </h2>
      <p className="entry-check-question"><Written spoken>{question}</Written></p>
      <AfterWriting>

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
          <EddaFeedback feedback={feedback} />
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
          <button className="text-button entry-check-continue" onClick={complete} type="button">
            Fortsätt utan AI-återkoppling
          </button>
        )}
        <div className="check-in-actions">
          {feedback?.kind === "on_track" ? (
            <button className="primary-button" onClick={complete} type="button">Börja momentet</button>
          ) : feedback?.kind === "retry" ? (
            <button className="primary-button" onClick={complete} type="button">Gå vidare till modellen</button>
          ) : !feedback && attempt >= maxAttempts ? (
            <button className="primary-button" onClick={complete} type="button">
              Fortsätt till modellen utan fler försök
            </button>
          ) : (
              <button className="primary-button check-in-submit" disabled={!answer.trim() || isSubmitting || attempt >= maxAttempts} type="submit">
              {isSubmitting ? "Skickar …" : attempt > 0 ? "Svara igen" : "Svara"}
            </button>
          )}
        </div>
      </form>
      </AfterWriting>
      </BoardStep>
      </BoardSequence>
    </section>
  );
}
