import { useId, useState, type FormEvent } from "react";
import EddaFeedback, { EddaMark } from "./EddaFeedback";
import type { ExitTicketStep, LearningEvidence, Lesson, SkillId } from "../data/lessons";
import { AfterWriting, Written } from "./BoardWriting";
import { submitCheckIn, type CheckInFeedback, type LearningContext } from "../lib/coachApi";

type Props = {
  lesson: Lesson;
  exitTicket: ExitTicketStep[];
  priorEvidence: LearningContext["priorEvidence"];
  onEvidence: (skillIds: SkillId[], evidence: LearningEvidence) => void;
  /** What the student has shown they can do in this lesson. */
  achievements?: string[];
  /** The student's answer when the lesson began, shown beside their answer now. */
  firstAnswer?: string | null;
  /** Called when the student has finished the exit ticket, or cannot because the service failed. */
  onDone?: () => void;
};
const maxAttempts = 10;

export default function ChapterExitTicket({ lesson, exitTicket, priorEvidence, onEvidence, achievements = [], firstAnswer = null, onDone }: Props) {
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [attempts, setAttempts] = useState<number[]>([]);
  const [feedback, setFeedback] = useState<CheckInFeedback | null>(null);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const answerId = useId();
  const step = exitTicket[stepIndex];
  const answer = answers[stepIndex] ?? "";
  const isLastStep = stepIndex === exitTicket.length - 1;

  function updateAnswer(value: string) {
    setAnswers((current) => {
      const next = [...current];
      next[stepIndex] = value;
      return next;
    });
    setFeedback(null);
    setRequestError(null);
  }

  async function submitAnswer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setRequestError(null);
    setFeedback(null);
    setIsSubmitting(true);

    try {
      const attempt = (attempts[stepIndex] ?? 0) + 1;
      const result = await submitCheckIn({
        mode: "text",
        question: step.question,
        answer: answer.trim(),
        focus: step.focus,
        learningContext: {
          attempt,
          supportLevel: attempt > 1 ? 1 : 0,
          priorEvidence,
        },
      });
      setAttempts((current) => {
        const next = [...current];
        next[stepIndex] = attempt;
        return next;
      });
      setFeedback(result);
      onEvidence(lesson.skillIds, result.kind === "retry"
        ? "needs_support"
        : attempt === 1 ? "independent" : "supported");
    } catch (error) {
      setRequestError(error instanceof Error ? error.message : "AI-återkopplingen misslyckades. Försök igen.");
      onDone?.();
    } finally {
      setIsSubmitting(false);
    }
  }

  function finish() {
    setIsComplete(true);
    onDone?.();
  }

  function moveToStep(index: number) {
    setStepIndex(index);
    setFeedback(null);
    setRequestError(null);
  }

  if (isComplete) {
    return (
      <section className="exit-ticket-complete" aria-label="Exit ticket klar">
        <p className="board-prompt">Det här kan du nu</p>
        <p className="exit-ticket-goal"><strong>Målet med lektionen</strong>{lesson.learnerGoal}</p>
        {achievements.length > 0 && (
          <ul className="can-do-list">
            {achievements.map((skill) => (
              <li key={skill}><EddaMark />{skill}</li>
            ))}
          </ul>
        )}
        {firstAnswer && answers[0] && (
          <div className="growth-compare" role="group" aria-label="Din utveckling under lektionen">
            <p><strong>När du började</strong><q>{firstAnswer}</q></p>
            <p className="growth-now"><strong>Nu</strong><q>{answers[0]}</q></p>
          </div>
        )}
        <p className="exit-ticket-complete-note">
          {firstAnswer && answers[0] ? "Jämför dina två svar. Vad kan du förklara nu som du inte kunde då?" : "Visar dina svar att du har nått målet?"}
        </p>
        <button className="text-button" onClick={() => {
          setIsComplete(false);
          moveToStep(0);
        }} type="button">
          Gå tillbaka till första frågan
        </button>
      </section>
    );
  }

  return (
    <form className="check-in exit-ticket" onSubmit={submitAnswer}>
      <div className="exit-ticket-progress">
        <span>Exit ticket · {stepIndex + 1} av {exitTicket.length}</span>
        <span>{step.learningProcess}</span>
        <progress aria-label={`Exit ticket ${stepIndex + 1} av ${exitTicket.length}`} max={exitTicket.length} value={stepIndex + 1} />
      </div>
      <h3 className="exit-ticket-title"><Written>{step.title}</Written></h3>
      <p className="check-in-question"><Written>{step.question}</Written></p>
      <AfterWriting>
      <label className="check-in-answer-label" htmlFor={answerId}>Ditt svar</label>
      <textarea
        className="check-in-answer"
        id={answerId}
        maxLength={2_000}
        onChange={(event) => updateAnswer(event.target.value)}
        placeholder={step.placeholder}
        rows={3}
        value={answer}
      />
      {requestError && <p className="check-in-error" role="alert">{requestError}</p>}
      {feedback && (
        <EddaFeedback feedback={feedback} />
      )}
      <div className="check-in-actions exit-ticket-actions">
        {stepIndex > 0 && (
          <button className="quiet-button" onClick={() => moveToStep(stepIndex - 1)} type="button">
            Föregående
          </button>
        )}
        {feedback?.kind === "on_track" ? (
          <button
            className="primary-button check-in-submit"
            onClick={() => isLastStep ? finish() : moveToStep(stepIndex + 1)}
            type="button"
          >
            {isLastStep ? "Avsluta exit ticket" : "Nästa fråga"}
          </button>
        ) : feedback?.kind === "retry" ? (
          <>
            {attempts[stepIndex] < maxAttempts && (
              <button className="quiet-button" onClick={() => setFeedback(null)} type="button">Försök igen</button>
            )}
            {attempts[stepIndex] >= 2 && (
              <button
                className="primary-button check-in-submit"
                onClick={() => isLastStep ? finish() : moveToStep(stepIndex + 1)}
                type="button"
              >
                Gå vidare ändå
              </button>
            )}
          </>
        ) : (
          <>
            {attempts[stepIndex] >= maxAttempts && (
              <button
                className="quiet-button"
                onClick={() => isLastStep ? finish() : moveToStep(stepIndex + 1)}
                type="button"
              >
                Gå vidare ändå
              </button>
            )}
            <button
              className="primary-button check-in-submit"
              disabled={!answer.trim() || isSubmitting || (attempts[stepIndex] ?? 0) >= maxAttempts}
              type="submit"
            >
              {isSubmitting ? "Skickar …" : "Svara"}
            </button>
          </>
        )}
      </div>
      </AfterWriting>
    </form>
  );
}
