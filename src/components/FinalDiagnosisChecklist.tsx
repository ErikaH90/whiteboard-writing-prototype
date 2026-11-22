import { useState } from "react";
import { finalDiagnosisChecklist } from "../data/finalDiagnosisChecklist";

type Props = {
  /**
   * `writing`: the diagnosis can still be changed, and the checklist is the student's own check before
   * handing in. `locked`: the original is handed in. `revision`: a separate copy is being worked on.
   */
  stage: "writing" | "locked" | "revision";
  onStartRevision: () => void;
};

const headings = {
  writing: { kicker: "INFÖR INLÄMNING", note: "Stäm av din text mot punkterna innan du lämnar in. Det du bockar av stannar hos dig." },
  locked: { kicker: "EFTER INLÄMNING", note: "Originaldiagnosen är låst och inlämnad." },
  revision: { kicker: "SEPARAT BEARBETNING", note: "Checklistan ändrar inte den text läraren fått." },
};

export default function FinalDiagnosisChecklist({ stage, onStartRevision }: Props) {
  const [checked, setChecked] = useState<string[]>([]);
  const totalItems = finalDiagnosisChecklist.reduce((total, section) => total + section.items.length, 0);

  function toggle(itemId: string) {
    setChecked((current) => current.includes(itemId)
      ? current.filter((entry) => entry !== itemId)
      : [...current, itemId]);
  }

  return (
    <section className="final-self-check" aria-label="Slutdiagnosens självkontroll">
      <div className="final-self-check-heading">
        <div>
          <p className="board-kicker">{headings[stage].kicker}</p>
          <h2>Självkontroll</h2>
        </div>
        <span>{checked.length} av {totalItems} markerade</span>
      </div>
      <p className="final-self-check-note">{headings[stage].note}</p>
      {/* The checklist is used while the text can still be changed, not on the locked original. */}
      {stage !== "locked" && <div className="final-self-check-sections">
        {finalDiagnosisChecklist.map((section) => (
          <details className="final-self-check-section" key={section.title}>
            <summary>{section.title}</summary>
            <ul>
              {section.items.map((item, index) => {
                const itemId = `${section.title}-${index}`;
                return (
                  <li key={itemId}>
                    <label>
                      <input
                        checked={checked.includes(itemId)}
                        onChange={() => toggle(itemId)}
                        type="checkbox"
                      />
                      <span>{item}</span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </details>
        ))}
      </div>}
      {stage === "locked" && (
        <button className="text-button" onClick={onStartRevision} type="button">
          Börja en separat bearbetad version
        </button>
      )}
    </section>
  );
}
