import { useId, useState, type FormEvent } from "react";
import type { Lesson } from "../data/lessons";
import { submitCheckIn, type CheckInFeedback } from "../lib/coachApi";

type Props = {
  lesson: Lesson;
};

export default function ChapterExitTicket({ lesson }: Props) {
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<CheckInFeedback | null>(null);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const answerId = useId();
  const step = lesson.exitTicket[stepIndex];
  const answer = answers[stepIndex] ?? "";
  const isLastStep = stepIndex === lesson.exitTicket.length - 1;

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
      setFeedback(await submitCheckIn({
        mode: "text",
        question: step.question,
        answer: answer.trim(),
        focus: step.focus,
      }));
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
          {lesson.exitTicket.map((item, index) => (
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
        <span>Exit ticket · {stepIndex + 1} av {lesson.exitTicket.length}</span>
        <span>{step.learningProcess}</span>
        <progress aria-label={`Exit ticket ${stepIndex + 1} av ${lesson.exitTicket.length}`} max={lesson.exitTicket.length} value={stepIndex + 1} />
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
      <p className="check-in-privacy">Frågan och ditt svar skickas till OpenAI när du väljer Svara.</p>
      {requestError && <p className="check-in-error" role="alert">{requestError}</p>}
      {feedback && (
        <div className={`check-in-feedback is-${feedback.kind === "on_track" ? "on-track" : "retry"}`} role="status">
          <strong>AI-coach</strong>
          <span>{feedback.feedback}</span>
        </div>
      )}
      <div className="check-in-actions exit-ticket-actions">
        {stepIndex > 0 && (
          <button className="quiet-button" onClick={() => moveToStep(stepIndex - 1)} type="button">
            Föregående
          </button>
        )}
        {feedback ? (
          <button
            className="primary-button check-in-submit"
            onClick={() => isLastStep ? setIsComplete(true) : moveToStep(stepIndex + 1)}
            type="button"
          >
            {isLastStep ? "Avsluta exit ticket" : "Nästa fråga"}
          </button>
        ) : (
          <button className="primary-button check-in-submit" disabled={!answer.trim() || isSubmitting} type="submit">
            {isSubmitting ? "Skickar …" : "Svara"}
          </button>
        )}
      </div>
    </form>
  );
}
