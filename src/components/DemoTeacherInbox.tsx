import type { DemoSubmission } from "../lib/demoSubmissions";

type Props = {
  submissions: DemoSubmission[];
  onClose: () => void;
  onClear: () => void;
};

export default function DemoTeacherInbox({ submissions, onClose, onClear }: Props) {
  return (
    <section className="demo-teacher-inbox" aria-label="Lärarvy i demoläge">
      <div className="demo-teacher-heading">
        <div>
          <p className="board-kicker">LOKALT DEMO</p>
          <h2>Lärarvy</h2>
        </div>
        <button className="quiet-button" onClick={onClose} type="button">Stäng</button>
      </div>
      <p className="demo-teacher-warning">
        Endast syntetiska texter. Den här vyn är i samma webbläsare och är inte en säker överföring till en verklig lärare.
      </p>
      {submissions.length === 0 ? (
        <p>Inga diagnoser har lämnats in i demoläget ännu.</p>
      ) : (
        <ol className="demo-submission-list">
          {submissions.map((submission) => (
            <li key={submission.id}>
              <article className="demo-submission">
                <div className="demo-submission-meta">
                  <strong>{submission.studentLabel}</strong>
                  <time dateTime={submission.submittedAt}>
                    {new Date(submission.submittedAt).toLocaleString("sv-SE")}
                  </time>
                </div>
                <p className="demo-submission-prompt">{submission.prompt}</p>
                <pre>{submission.draft}</pre>
                {submission.feedback && (
                  <div className="demo-submission-feedback">
                    <h3>Vägledande AI-återkoppling</h3>
                    <p><strong>Framgång:</strong> {submission.feedback.success.message} <q>{submission.feedback.success.quote}</q></p>
                    <p><strong>Nästa steg:</strong> {submission.feedback.nextStep}</p>
                    <ul>
                      {submission.feedback.findings.map((finding) => (
                        <li key={finding.id}><strong>{finding.title}:</strong> {finding.message}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </article>
            </li>
          ))}
        </ol>
      )}
      <button
        className="text-button"
        disabled={submissions.length === 0}
        onClick={onClear}
        type="button"
      >
        Rensa lokala demo-inlämningar
      </button>
    </section>
  );
}
