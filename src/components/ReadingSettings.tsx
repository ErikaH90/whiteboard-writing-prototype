import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from "react";
import { createPortal } from "react-dom";
import {
  isChanged,
  papers,
  resetReadingSettings,
  rulerHeight,
  setReadingSettings,
  useReadingSettings,
} from "../lib/readingSettings";

const sizeLabels = ["Normal", "Större", "Störst"];
const lineLabels = ["Normalt", "Större", "Störst"];
const letterLabels = ["Normalt", "Glesare"];

/**
 * One button that opens the student's reading settings. The panel is closed until the student
 * asks for it, so the settings add nothing to read for those who do not need them.
 */
export default function ReadingSettings() {
  const settings = useReadingSettings();
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // The panel is drawn on top of the page, under the button, wherever the button sits.
  useLayoutEffect(() => {
    if (!isOpen) return;
    function place() {
      const button = rootRef.current?.getBoundingClientRect();
      const panel = panelRef.current;
      if (!button || !panel) return;
      const left = Math.min(Math.max(button.right - panel.offsetWidth, 8), window.innerWidth - panel.offsetWidth - 8);
      panel.style.left = `${Math.max(left, 8)}px`;
      panel.style.top = `${button.bottom + 8}px`;
    }
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    function closeOutside(event: PointerEvent) {
      const target = event.target as Node;
      if (!rootRef.current?.contains(target) && !panelRef.current?.contains(target)) setIsOpen(false);
    }
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setIsOpen(false);
    }
    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isOpen]);

  return (
    <div className="reading-settings" ref={rootRef}>
      <button
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        className={`sound-toggle reading-settings-button ${isChanged(settings) ? "is-changed" : ""}`}
        onClick={() => setIsOpen(!isOpen)}
        type="button"
      >
        <span aria-hidden="true" className="reading-settings-icon">Aa</span> Textformat
      </button>
      {isOpen && createPortal(
        <div aria-label="Textformat" className="reading-settings-panel" ref={panelRef} role="dialog">
          <Choice
            label="Textstorlek"
            options={sizeLabels}
            value={settings.size}
            onChoose={(size) => setReadingSettings({ size: size as 0 | 1 | 2 })}
          />
          <Choice
            label="Radavstånd"
            options={lineLabels}
            value={settings.lineSpacing}
            onChoose={(lineSpacing) => setReadingSettings({ lineSpacing: lineSpacing as 0 | 1 | 2 })}
          />
          <Choice
            label="Avstånd mellan bokstäver"
            options={letterLabels}
            value={settings.letterSpacing}
            onChoose={(letterSpacing) => setReadingSettings({ letterSpacing: letterSpacing as 0 | 1 })}
          />
          <div className="reading-choice" role="group" aria-label="Bakgrund">
            <span className="reading-choice-label">Bakgrund</span>
            <div className="reading-choice-options">
              {papers.map((paper) => (
                <button
                  aria-label={paper.label}
                  aria-pressed={settings.paper === paper.id}
                  className="reading-paper"
                  key={paper.id}
                  onClick={() => setReadingSettings({ paper: paper.id })}
                  style={{ background: paper.color }}
                  title={paper.label}
                  type="button"
                />
              ))}
            </div>
          </div>
          <Choice
            label="Läslinjal"
            options={["Av", "På"]}
            value={settings.ruler ? 1 : 0}
            onChoose={(ruler) => setReadingSettings({ ruler: ruler === 1 })}
          />
          {isChanged(settings) && (
            <button className="reading-reset" onClick={resetReadingSettings} type="button">Återställ</button>
          )}
        </div>,
        document.body,
      )}
    </div>
  );
}

function Choice({ label, options, value, onChoose }: {
  label: string;
  options: string[];
  value: number;
  onChoose: (value: number) => void;
}) {
  return (
    <div className="reading-choice" role="group" aria-label={label}>
      <span className="reading-choice-label">{label}</span>
      <div className="reading-choice-options">
        {options.map((option, index) => (
          <button aria-pressed={value === index} key={option} onClick={() => onChoose(index)} type="button">
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * The reading ruler: a band that follows the pointer over the writing surface, so the eye keeps
 * to one line. It steps aside while the student types.
 */
export function ReadingRuler({ surface }: { surface: RefObject<HTMLElement | null> }) {
  const settings = useReadingSettings();
  const rulerRef = useRef<HTMLDivElement>(null);
  const height = rulerHeight(settings);

  useEffect(() => {
    const area = surface.current;
    const ruler = rulerRef.current;
    if (!settings.ruler || !area || !ruler) return;

    function hide() {
      ruler!.hidden = true;
    }
    function follow(event: PointerEvent) {
      const box = area!.getBoundingClientRect();
      const top = Math.min(Math.max(event.clientY - height / 2, box.top), box.bottom - height);
      ruler!.style.top = `${top}px`;
      ruler!.style.left = `${box.left}px`;
      ruler!.style.width = `${box.width}px`;
      ruler!.hidden = false;
    }

    area.addEventListener("pointermove", follow);
    area.addEventListener("pointerdown", follow);
    area.addEventListener("pointerleave", hide);
    area.addEventListener("keydown", hide);
    window.addEventListener("scroll", hide, true);
    return () => {
      area.removeEventListener("pointermove", follow);
      area.removeEventListener("pointerdown", follow);
      area.removeEventListener("pointerleave", hide);
      area.removeEventListener("keydown", hide);
      window.removeEventListener("scroll", hide, true);
    };
  }, [settings.ruler, surface, height]);

  if (!settings.ruler) return null;
  return <div aria-hidden="true" className="reading-ruler" hidden ref={rulerRef} style={{ height }} />;
}
