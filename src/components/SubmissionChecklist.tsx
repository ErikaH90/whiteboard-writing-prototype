import { useState } from "react";
import { finalDiagnosisChecklist } from "../data/finalDiagnosisChecklist";
import { AfterWriting, Written } from "./BoardWriting";

const totalItems = finalDiagnosisChecklist.reduce((total, section) => total + section.items.length, 0);

/**
 * The student's own checklist before the final diagnosis. The student goes through the text and
 * ticks off each point; nothing is sent anywhere and nothing is judged.
 */
export default function SubmissionChecklist() {
  const [done, setDone] = useState<string[]>([]);
  const [openSection, setOpenSection] = useState(0);
  const section = finalDiagnosisChecklist[openSection];

  function toggle(item: string) {
    setDone((current) => current.includes(item) ? current.filter((entry) => entry !== item) : [...current, item]);
  }

  return (
    <div className="board-activity submission-checklist">
      <p className="board-prompt"><Written byHand>Checklista inför inlämning</Written></p>
      <p className="board-small-note"><Written>Gå igenom punkterna i din text till höger. Klicka för att bocka av när du är klar med en punkt.</Written></p>
      <AfterWriting>
        <p className="checklist-count" role="status">{done.length} av {totalItems} avklarade</p>
        <div className="checklist-sections" role="group" aria-label="Checklistans delar">
          {finalDiagnosisChecklist.map((entry, index) => {
            const doneHere = entry.items.filter((item) => done.includes(item)).length;
            return (
              <button
                aria-pressed={index === openSection}
                className={`checklist-section ${index === openSection ? "is-open" : ""} ${doneHere === entry.items.length ? "is-complete" : ""}`}
                key={entry.title}
                onClick={() => setOpenSection(index)}
                type="button"
              >
                <span>{entry.title}</span>
                <span className="checklist-section-count">{doneHere}/{entry.items.length}</span>
              </button>
            );
          })}
        </div>
        <ul className="checklist-items" aria-label={section.title}>
          {section.items.map((item) => {
            const isDone = done.includes(item);
            return (
              <li key={item}>
                <button
                  aria-pressed={isDone}
                  className={`checklist-item ${isDone ? "is-done" : ""}`}
                  onClick={() => toggle(item)}
                  type="button"
                >
                  <span aria-hidden="true" className="checklist-box">{isDone ? "✓" : ""}</span>
                  <span className="checklist-text">{item}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </AfterWriting>
    </div>
  );
}
