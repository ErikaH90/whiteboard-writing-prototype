import { Fragment, useEffect, useMemo, useRef, useState } from "react";
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
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const editorWrapRef = useRef<HTMLDivElement>(null);
  const findingButtonsRef = useRef(new Map<string, HTMLButtonElement>());
  const reviewRequestId = useRef(0);
  const [showHint, setShowHint] = useState(false);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [findings, setFindings] = useState<Finding[] | null>(null);
  const [activeFinding, setActiveFinding] = useState<string | null>(null);
  const [editorScrollTop, setEditorScrollTop] = useState(0);
  const [popoverPosition, setPopoverPosition] = useState({ left: 8, top: 8 });
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
    reviewRequestId.current += 1;
    setDraft(value);
    setFindings(null);
    setActiveFinding(null);
    setReviewError(null);
    setReviewLoading(false);
  }

  function selectLesson(index: number) {
    reviewRequestId.current += 1;
    setLessonIndex(index);
    setPhaseIndex(0);
    setShowHint(false);
    setCheckedItems([]);
    setFindings(null);
    setReviewError(null);
    setReviewLoading(false);
  }

  function movePhase(index: number) {
    reviewRequestId.current += 1;
    setPhaseIndex(index);
    setShowHint(false);
    setCheckedItems([]);
    setFindings(null);
    setReviewError(null);
    setReviewLoading(false);
  }

  async function runReview() {
    const requestId = ++reviewRequestId.current;
    const reviewedDraft = draft;
    const reviewedLesson = lesson;
    const reviewedPhase = phase;
    setReviewLoading(true);
    setReviewError(null);
    setFindings(null);
    setActiveFinding(null);

    try {
      const result = await reviewDraft({
        draft: reviewedDraft,
        lessonTitle: reviewedLesson.title,
        phase: reviewedPhase,
        goal: reviewedLesson.goal,
        criteria: reviewedLesson.criteria,
      });
      if (reviewRequestId.current !== requestId) return;
      setFindings(result);
    } catch (error) {
      if (reviewRequestId.current !== requestId) return;
      setReviewError(error instanceof Error ? error.message : "AI-granskningen misslyckades. Försök igen.");
    } finally {
      if (reviewRequestId.current === requestId) setReviewLoading(false);
    }
  }

  function toggleFinding(finding: Finding, button: HTMLButtonElement) {
    if (activeFinding === finding.id) {
      setActiveFinding(null);
      return;
    }

    const wrapper = editorWrapRef.current;
    if (wrapper) {
      const wrapperRect = wrapper.getBoundingClientRect();
      const buttonRect = button.getBoundingClientRect();
      const popoverWidth = Math.min(280, Math.max(wrapper.clientWidth - 16, 0));
      const left = Math.max(8, Math.min(
        buttonRect.left - wrapperRect.left,
        wrapper.clientWidth - popoverWidth - 8,
      ));
      const below = buttonRect.bottom - wrapperRect.top + 6;
      const top = below + 120 <= wrapper.clientHeight
        ? below
        : Math.max(8, buttonRect.top - wrapperRect.top - 126);
      setPopoverPosition({ left, top });
    }

    setActiveFinding(finding.id);
  }

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
                  <p className="board-small-note">Du kan börja skriva ditt eget utkast till höger redan nu.</p>
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
                  <p className="board-small-note">Använd kriterierna när du granskar ditt utkast till höger.</p>
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
            <div className="editor-status">
              <span className="word-count">{wordCount} ord</span>
              {saveError && <span className="save-status has-error" role="status">Kunde inte spara lokalt</span>}
            </div>
            <button className="primary-button coach-review-button" onClick={runReview} disabled={!draft.trim() || reviewLoading} type="button">
              {reviewLoading ? "Tutorn läser …" : findings ? "Få nya tips" : "Få tips på min text"}
            </button>
          </div>
          <p className="ai-privacy-note">När du väljer tips skickas utkastet och lektionsfokuset till OpenAI. Tutorn föreslår frågor – du gör själv alla ändringar.</p>

          {reviewLoading && <p className="review-state" role="status">Tutorn läser texten med fokus på {lesson.shortTitle.toLocaleLowerCase("sv")} …</p>}
          {reviewError && <p className="review-error" role="alert">{reviewError}</p>}
          {findings && findings.length > 0 && <p className="annotation-hint">Klicka på en röd markering för att läsa tutorns kommentar.</p>}
          {findings?.length === 0 && <p className="empty-review" role="status">Tutorn hittade inget tydligt att undersöka just nu. Läs ändå texten själv – AI kan missa saker.</p>}

          <div className="editor-wrap" ref={editorWrapRef}>
            <textarea
              ref={editorRef}
              className={`text-editor ${findings?.length ? "has-inline-findings" : ""}`}
              value={draft}
              onChange={(event) => updateDraft(event.target.value)}
              onFocus={() => setActiveFinding(null)}
              onScroll={(event) => {
                setEditorScrollTop(event.currentTarget.scrollTop);
                setActiveFinding(null);
              }}
              placeholder={"Skriv din rubrik här …\n\nBörja sedan med att presentera din ståndpunkt. Du kan alltid ändra texten senare."}
              aria-label="Din argumenterande text"
              spellCheck
            />
            {findings && findings.length > 0 && (
              <div className="text-highlight-layer">
                <div className="text-highlight-content" style={{ transform: `translateY(-${editorScrollTop}px)` }}>
                  {findings.map((finding, index) => {
                    const previousEnd = index > 0 ? findings[index - 1].end : 0;
                    return (
                      <Fragment key={finding.id}>
                        <span aria-hidden="true">{draft.slice(previousEnd, finding.start)}</span>
                        <button
                          ref={(element) => {
                            if (element) findingButtonsRef.current.set(finding.id, element);
                            else findingButtonsRef.current.delete(finding.id);
                          }}
                          className="finding-mark"
                          type="button"
                          aria-label={`Visa förklaring för markeringen ”${finding.quote}”. ${finding.title}`}
                          aria-expanded={activeFinding === finding.id}
                          aria-controls="finding-feedback-popover"
                          onClick={(event) => toggleFinding(finding, event.currentTarget)}
                          onKeyDown={(event) => {
                            if (event.key === "Escape") setActiveFinding(null);
                          }}
                        >
                          {draft.slice(finding.start, finding.end)}
                        </button>
                      </Fragment>
                    );
                  })}
                  <span aria-hidden="true">{draft.slice(findings[findings.length - 1].end)}</span>
                </div>
                {activeFinding && (() => {
                  const finding = findings.find((item) => item.id === activeFinding);
                  if (!finding) return null;
                  return (
                    <aside
                      className="finding-popover"
                      id="finding-feedback-popover"
                      role="dialog"
                      aria-label={`Förklaring: ${finding.title}`}
                      style={{ left: popoverPosition.left, top: popoverPosition.top }}
                      onKeyDown={(event) => {
                        if (event.key === "Escape") {
                          setActiveFinding(null);
                          findingButtonsRef.current.get(finding.id)?.focus();
                        }
                      }}
                    >
                      <div className="finding-popover-heading">
                        <strong>{finding.title}</strong>
                        <button
                          className="finding-popover-close"
                          type="button"
                          aria-label="Stäng förklaringen"
                          onClick={() => {
                            setActiveFinding(null);
                            findingButtonsRef.current.get(finding.id)?.focus();
                          }}
                        >
                          ×
                        </button>
                      </div>
                      <p>{finding.message}</p>
                    </aside>
                  );
                })()}
              </div>
            )}
          </div>
        </section>
      </section>
      <footer className="page-footer">
        <span>Formativt skrivstöd · Svenska årskurs 9</span>
        <span>Kursplansanknytning är vägledande, inte ett automatiskt betyg.</span>
      </footer>
    </main>
  );
}

export default App;
