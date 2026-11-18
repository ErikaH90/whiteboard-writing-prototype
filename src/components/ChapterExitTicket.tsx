import { useId, useState, type FormEvent } from "react";
import type { ExitTicketStep, LearningEvidence, Lesson, SkillId } from "../data/lessons";
import { submitCheckIn, type CheckInFeedback, type LearningContext } from "../lib/coachApi";

type Props = {
  lesson: Lesson;
  exitTicket: ExitTicketStep[];
  priorEvidence: LearningContext["priorEvidence"];
  onEvidence: (skillIds: SkillId[], evidence: LearningEvidence) => void;
};
const maxAttempts = 10;

export default function ChapterExitTicket({ lesson, exitTicket, priorEvidence, onEvidence }: Props) {
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
    } finally {
      setIsSubmitting(false);
    }
  }

  function moveToStep(index: number) {
    setStepIndex(index);
    setFeedback(null);
    setRequestError(null);
  }

  if (isComplete) {
    return (
      <section className="exit-ticket-complete" aria-label="Exit ticket klar">
        <p className="board-prompt">Exit ticket genomförd</p>
        <p className="exit-ticket-complete-note">Läs igenom dina svar och fundera på vilken kunskap du vill ta med dig.</p>
        <ol className="exit-ticket-summary">
          {exitTicket.map((item, index) => (
            <li key={item.title}>
              <strong>{item.title}</strong>
              <span>{answers[index]}</span>
            </li>
          ))}
        </ol>
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
      <h3 className="exit-ticket-title">{step.title}</h3>
      <p className="check-in-question">{step.question}</p>
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
        <div className={`check-in-feedback is-${feedback.kind === "on_track" ? "on-track" : "retry"}`} role="status">
          <strong>AI-coach</strong>
          <span>{feedback.feedback}</span>
        </div>
      )}
      <div className="check-in-actions exit-ticket-actions">
        {!feedback && <span className="request-disclosure">Ditt svar och tidigare stödsignaler skickas till OpenAI</span>}
        {stepIndex > 0 && (
          <button className="quiet-button" onClick={() => moveToStep(stepIndex - 1)} type="button">
            Föregående
          </button>
        )}
        {feedback?.kind === "on_track" ? (
          <button
            className="primary-button check-in-submit"
            onClick={() => isLastStep ? setIsComplete(true) : moveToStep(stepIndex + 1)}
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
                onClick={() => isLastStep ? setIsComplete(true) : moveToStep(stepIndex + 1)}
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
                onClick={() => isLastStep ? setIsComplete(true) : moveToStep(stepIndex + 1)}
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
    </form>
  );
}
