import { useState } from "react";
import { finalDiagnosisChecklist } from "../data/finalDiagnosisChecklist";

type Props = {
  isRevision: boolean;
  onStartRevision: () => void;
};

export default function FinalDiagnosisChecklist({ isRevision, onStartRevision }: Props) {
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
          <p className="board-kicker">EFTER INLÄMNING</p>
          <h2>Självkontroll</h2>
        </div>
        <span>{checked.length} av {totalItems} markerade</span>
      </div>
      <p className="final-self-check-note">
        Originaldiagnosen är låst och inlämnad. Checklistan ändrar inte den text läraren fått.
      </p>
      <div className="final-self-check-sections">
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
      </div>
      {!isRevision && (
        <button className="text-button" onClick={onStartRevision} type="button">
          Börja en separat bearbetad version
        </button>
      )}
    </section>
  );
}
