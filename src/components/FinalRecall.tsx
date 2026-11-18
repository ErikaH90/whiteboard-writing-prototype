import { finalRecallQuestions } from "../data/lessons";

type Props = {
  index: number;
  answers: string[];
  onAnswer: (index: number, answer: string) => void;
  onPrevious: () => void;
  onNext: () => void;
  onComplete: () => void;
};

export default function FinalRecall({ index, answers, onAnswer, onPrevious, onNext, onComplete }: Props) {
  const question = finalRecallQuestions[index];
  const answer = answers[index] ?? "";
  const isLastQuestion = index === finalRecallQuestions.length - 1;

  return (
    <section className="final-recall" aria-labelledby="final-recall-title">
      <p className="board-kicker">ÅTERKALLA FRÅN ALLA MOMENT · {index + 1} AV {finalRecallQuestions.length}</p>
      <h2 className="board-prompt" id="final-recall-title">{question.title}</h2>
      <p className="entry-check-question">{question.question}</p>
      <label className="check-in-answer-label" htmlFor="final-recall-answer">Ditt svar, utan stöd</label>
      <textarea
        className="check-in-answer final-recall-answer"
        id="final-recall-answer"
        maxLength={2_000}
        onChange={(event) => onAnswer(index, event.target.value)}
        placeholder={question.placeholder}
        rows={3}
        value={answer}
      />
      <p className="request-disclosure">Svaren stannar i den här sessionen och skickas inte till AI.</p>
      <div className="final-recall-actions">
        {index > 0 && (
          <button className="quiet-button" onClick={onPrevious} type="button">Föregående</button>
        )}
        {isLastQuestion ? (
          <button className="primary-button" disabled={!answer.trim()} onClick={onComplete} type="button">
            Starta slutdiagnosen
          </button>
        ) : (
          <button className="primary-button" disabled={!answer.trim()} onClick={onNext} type="button">
            Nästa fråga
          </button>
        )}
      </div>
    </section>
  );
}
