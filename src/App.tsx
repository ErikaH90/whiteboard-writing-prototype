import { useEffect, useMemo, useState } from "react";
import LessonCheckIn from "./components/LessonCheckIn";
import { lessons, phases } from "./data/lessons";
import { reviewDraft, type Finding } from "./lib/coachApi";

const storageKey = "skrivcoach-argumenterande-draft";

function readSavedDraft(): { draft: string; error: boolean } {
  try {
    return { draft: window.localStorage.getItem(storageKey) ?? "", error: false };
  } catch {
    return { draft: "", error: true };
  }
}

function App() {
  const [lessonIndex, setLessonIndex] = useState(0);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [savedDraft] = useState(readSavedDraft);
  const [draft, setDraft] = useState(savedDraft.draft);
  const [showHint, setShowHint] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [findings, setFindings] = useState<Finding[] | null>(null);
  const [activeFinding, setActiveFinding] = useState<string | null>(null);
  const [checkedItems, setCheckedItems] = useState<string[]>([]);
  const [saveError, setSaveError] = useState(savedDraft.error);

  const lesson = lessons[lessonIndex];
  const phase = phases[phaseIndex];
  const wordCount = useMemo(() => draft.trim().split(/\s+/).filter(Boolean).length, [draft]);

  useEffect(() => {
    try {
      window.localStorage.setItem(storageKey, draft);
      setSaveError(false);
    } catch {
      setSaveError(true);
    }
  }, [draft]);

  function updateDraft(value: string) {
    setDraft(value);
    setFindings(null);
    setReviewOpen(false);
    setActiveFinding(null);
    setReviewError(null);
  }

  function selectLesson(index: number) {
    setLessonIndex(index);
    setPhaseIndex(0);
    setShowHint(false);
    setCheckedItems([]);
    setFindings(null);
    setReviewOpen(false);
  }

  function movePhase(index: number) {
    setPhaseIndex(index);
    setShowHint(false);
    setCheckedItems([]);
    setFindings(null);
    setReviewOpen(false);
  }

  async function runReview() {
    setReviewOpen(true);
    setReviewLoading(true);
    setReviewError(null);
    setFindings(null);
    setActiveFinding(null);

    try {
      const result = await reviewDraft({
        draft,
        lessonTitle: lesson.title,
        goal: lesson.goal,
        criteria: lesson.criteria,
      });
      setFindings(result);
    } catch (error) {
      setReviewError(error instanceof Error ? error.message : "AI-granskningen misslyckades. Försök igen.");
    } finally {
      setReviewLoading(false);
    }
  }

  const highlightedText = findings?.length ? renderHighlightedText(draft, findings, setActiveFinding, activeFinding) : null;

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="topbar-main">
          <h1 className="page-title">Argumenterande text</h1>
          <div className="lesson-counter">
            <span className="status-dot" />
            <span>Moment {lessonIndex + 1} av {lessons.length}</span>
          </div>
        </div>

        <nav className="lesson-progress" aria-label="Lektionens moment">
          {lessons.map((item, index) => (
            <button
              className={`lesson-chip ${index === lessonIndex ? "is-current" : ""} ${index < lessonIndex ? "is-complete" : ""}`}
              key={item.shortTitle}
              onClick={() => selectLesson(index)}
              aria-current={index === lessonIndex ? "step" : undefined}
              title={item.title}
            >
              <span className="chip-number">{index < lessonIndex ? "✓" : index + 1}</span>
              <span>{item.shortTitle}</span>
            </button>
          ))}
        </nav>
      </header>

      <section className="phase-track" aria-label="Lektionssteg">
        <span className="phase-label">DEL {lessonIndex + 1}: {lesson.shortTitle.toUpperCase()}</span>
        <div className="phase-list">
          {phases.map((item, index) => (
            <div className="phase-item-wrap" key={item}>
              <button
                className={`phase-chip ${index === phaseIndex ? "is-current" : ""} ${index < phaseIndex ? "is-done" : ""}`}
                onClick={() => movePhase(index)}
                aria-current={index === phaseIndex ? "step" : undefined}
              >
                {item}
              </button>
              {index < phases.length - 1 && <span className="phase-arrow" aria-hidden="true">›</span>}
            </div>
          ))}
        </div>
      </section>

      <section className="workspace-grid" aria-label="Skrivcoachens arbetsyta">
        <section className="board-frame" aria-labelledby="board-title">
          <span className="frame-corner corner-top-left" aria-hidden="true" />
          <span className="frame-corner corner-top-right" aria-hidden="true" />
          <span className="frame-corner corner-bottom-left" aria-hidden="true" />
          <span className="frame-corner corner-bottom-right" aria-hidden="true" />
          <div className="board-surface">
            <div className="board-progress-track" aria-label={`Del ${lessonIndex + 1} av ${lessons.length}`}>
              <span style={{ width: `${((lessonIndex + 1) / lessons.length) * 100}%` }} />
            </div>
            <div className="board-content">
              <p className="board-kicker">DEL {lessonIndex + 1}: {lesson.shortTitle.toUpperCase()}</p>
              <h2 id="board-title">{phase}</h2>
              <p className="board-goal"><strong>Mål:</strong> {lesson.goal}</p>
              <div className="board-divider" />
              {phaseIndex === 0 && (
                <div className="teaching-content">
                  <p className="board-prompt">Jämför exemplen</p>
                  <div className="example-pair">
                    <article className="example-card example-needs-work">
                      <span className="example-label">MINDRE TYDLIGT</span>
                      <p>{lesson.model.needsWork}</p>
                    </article>
                    <article className="example-card example-strong">
                      <span className="example-label">MER UTVECKLAT</span>
                      <p>{lesson.model.strong}</p>
                    </article>
                  </div>
                  <p className="board-question">{lesson.model.question}</p>
                </div>
              )}
              {phaseIndex === 1 && (
                <div className="board-activity">
                  <p className="board-prompt">Din övning</p>
                  <p className="activity-instruction">{lesson.practice}</p>
                  {showHint && <p className="hint-card"><span aria-hidden="true">✦</span> {lesson.hint}</p>}
                  <button className="text-button" onClick={() => setShowHint((visible) => !visible)}>
                    {showHint ? "Dölj ledtråd" : "Visa en ledtråd"}
                  </button>
                  <p className="board-small-note">Skriv i din egen textyta till höger.</p>
                </div>
              )}
              {phaseIndex === 2 && (
                <div className="board-activity recall-activity">
                  <p className="board-prompt">Försök utan stöd</p>
                  <p className="activity-instruction">{lesson.recall}</p>
                  <p className="board-small-note">Titta inte på exemplen medan du tänker efter.</p>
                </div>
              )}
              {phaseIndex === 3 && (
                <div className="board-activity">
                  <p className="board-prompt">Din egenkontroll</p>
                  <div className="checklist">
                    {lesson.checklist.map((item) => (
                      <label className="check-item" key={item}>
                        <input
                          type="checkbox"
                          checked={checkedItems.includes(item)}
                          onChange={() => setCheckedItems((current) => current.includes(item) ? current.filter((entry) => entry !== item) : [...current, item])}
                        />
                        <span>{item}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
              {phaseIndex === 4 && (
                <div className="board-activity">
                  <p className="board-prompt">Det här granskar du</p>
                  <ul className="criteria-list">
                    {lesson.criteria.map((criterion) => <li key={criterion}>{criterion}</li>)}
                  </ul>
                  <p className="assessment-note">Detta är stöd för din bearbetning – inte ett officiellt betyg.</p>
                </div>
              )}
              <LessonCheckIn key={`${lessonIndex}-${phaseIndex}`} lesson={lesson} phaseIndex={phaseIndex} />
              <div className="board-footer">
                <div className="phase-controls">
                  <button className="quiet-button" onClick={() => movePhase(Math.max(0, phaseIndex - 1))} disabled={phaseIndex === 0}>Tillbaka</button>
                  {phaseIndex < phases.length - 1 ? (
                    <button className="primary-button" onClick={() => movePhase(phaseIndex + 1)}>Nästa steg <span aria-hidden="true">→</span></button>
                  ) : lessonIndex < lessons.length - 1 ? (
                    <button className="primary-button" onClick={() => selectLesson(lessonIndex + 1)}>Nästa moment <span aria-hidden="true">→</span></button>
                  ) : <span className="finish-label">Sista momentet</span>}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="writing-card" aria-label="Elevens skrivyta">
          <div className="writing-prompt">
            <span className="prompt-label">SKRIVUPPGIFT</span>
            <p>Ta ställning: Borde skoldagen börja senare för elever i högstadiet?</p>
          </div>

          <div className="editor-toolbar">
            <div className="editor-tabs" role="tablist" aria-label="Textläge">
              <button
                className={`editor-tab ${!reviewOpen ? "is-active" : ""}`}
                role="tab"
                aria-selected={!reviewOpen}
                onClick={() => setReviewOpen(false)}
              >Skriv</button>
              <button
                className={`editor-tab ${reviewOpen ? "is-active" : ""}`}
                role="tab"
                aria-selected={reviewOpen}
                onClick={runReview}
                disabled={!draft.trim() || reviewLoading}
              >Granska{findings ? <span className="tab-count">{findings.length}</span> : null}</button>
            </div>
            <div className="editor-status">
              <span className="word-count">{wordCount} ord</span>
              {saveError && <span className="save-status has-error" role="status">Kunde inte spara lokalt</span>}
            </div>
          </div>
          <p className="ai-privacy-note">Text skickas till OpenAI när du väljer Granska.</p>

          {!reviewOpen ? (
            <div className="editor-wrap">
              <textarea
                className="text-editor"
                value={draft}
                onChange={(event) => updateDraft(event.target.value)}
                placeholder={"Skriv din rubrik här …\n\nBörja sedan med att presentera din ståndpunkt. Du kan alltid ändra texten senare."}
                aria-label="Din argumenterande text"
                spellCheck
              />
            </div>
          ) : (
            <div className="review-panel" role="tabpanel">
              <div className="demo-notice">
                <span className="notice-icon" aria-hidden="true">i</span>
                <p><strong>AI-återkoppling</strong> · Förslagen är vägledande och kan missa saker.</p>
              </div>
              {draft.trim() ? (
                <>
                  {reviewLoading && <p className="review-state" role="status">AI:n granskar din text …</p>}
                  {reviewError && <p className="review-error" role="alert">{reviewError}</p>}
                  {findings && (
                    <>
                      <div className="review-text" aria-label="Text med möjliga förbättringsområden">
                        {highlightedText ?? draft}
                      </div>
                      {findings.length > 0 ? (
                        <div className="feedback-list">
                          <p className="feedback-heading">{findings.length} sak{findings.length === 1 ? "" : "er"} att undersöka</p>
                          {findings.map((finding) => (
                            <button
                              className={`feedback-card ${activeFinding === finding.id ? "is-selected" : ""}`}
                              key={finding.id}
                              onClick={() => setActiveFinding(finding.id)}
                            >
                              <span className="feedback-quote">”{finding.quote}”</span>
                              <strong>{finding.title}</strong>
                              <span>{finding.message}</span>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="empty-review">
                          <span aria-hidden="true">✓</span>
                          <p>AI:n hittade inga tydliga utvecklingsområden i den här granskningen. Läs ändå igenom texten själv; AI kan missa saker.</p>
                        </div>
                      )}
                    </>
                  )}
                  {!reviewLoading && !reviewError && findings && (
                    <button className="text-button recheck-button" onClick={runReview}>Granska igen</button>
                  )}
                </>
              ) : (
                <div className="empty-review"><p>Skriv lite text innan du granskar den.</p></div>
              )}
            </div>
          )}
        </section>
      </section>
      <footer className="page-footer">
        <span>Formativt skrivstöd · Svenska årskurs 9</span>
        <span>Kursplansanknytning är vägledande, inte ett automatiskt betyg.</span>
      </footer>
    </main>
  );
}

function renderHighlightedText(
  text: string,
  findings: Finding[],
  onSelect: (id: string) => void,
  activeId: string | null,
) {
  const pieces = [];
  let cursor = 0;
  for (const finding of findings) {
    if (finding.start > cursor) pieces.push(text.slice(cursor, finding.start));
    pieces.push(
      <mark
        className={`text-highlight ${activeId === finding.id ? "is-active" : ""}`}
        key={finding.id}
        onClick={() => onSelect(finding.id)}
        title={finding.title}
      >{text.slice(finding.start, finding.end)}</mark>,
    );
    cursor = finding.end;
  }
  if (cursor < text.length) pieces.push(text.slice(cursor));
  return pieces;
}

export default App;
