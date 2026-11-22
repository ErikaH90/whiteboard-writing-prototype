import type { KeyboardEvent } from "react";
import type { MapPart, MapSkill } from "../lib/coachApi";
import { AfterWriting, Written } from "./BoardWriting";

export const mapSkills: { skill: MapSkill; label: string }[] = [
  { skill: "structure", label: "Struktur" },
  { skill: "reasoning", label: "Resonemang" },
  { skill: "cohesion", label: "Textbindning" },
  { skill: "sentence", label: "Meningar" },
  { skill: "language", label: "Språk" },
];

export const levelNames = ["inte påbörjad", "grundläggande", "utvecklad", "välutvecklad"] as const;

/** A part is ready for the final diagnosis when it is at least developed. */
export const readyLevel = 2;

type Props = {
  /** The parts Edda has gone through so far; later parts are shown as still to come. */
  taught: MapSkill[];
  /** Edda's latest reading of the student's text, or null before the student has asked for it. */
  parts: MapPart[] | null;
  selected: MapSkill | null;
  onSelect: (skill: MapSkill) => void;
  onAssess: () => void;
  loading: boolean;
  error: string | null;
  /** The text is empty, so there is nothing for Edda to read yet. */
  isEmpty: boolean;
  /** The student has changed the text since Edda read it. */
  isOutdated: boolean;
};

const rings: [number, number][] = [[26, 62], [62, 98], [98, 134]];
const gap = 2.2;

function point(radius: number, angle: number): string {
  const radians = ((angle - 90) * Math.PI) / 180;
  return `${(radius * Math.cos(radians)).toFixed(1)},${(radius * Math.sin(radians)).toFixed(1)}`;
}

function sector(inner: number, outer: number, from: number, to: number): string {
  return `M${point(outer, from)} A${outer},${outer} 0 0 1 ${point(outer, to)} L${point(inner, to)} A${inner},${inner} 0 0 0 ${point(inner, from)} Z`;
}

/**
 * The student's writing map: a wheel with one slice for each part of an argumentative text.
 * Each slice fills from the centre outwards in three steps as that part of the student's own
 * text develops. The levels are guidance from Edda, never a grade.
 */
export default function ProgressMap({ taught, parts, selected, onSelect, onAssess, loading, error, isEmpty, isOutdated }: Props) {
  const levelOf = (skill: MapSkill) => parts?.find((part) => part.skill === skill)?.level ?? null;
  const isReady = parts !== null && mapSkills.every(({ skill }) => (levelOf(skill) ?? 0) >= readyLevel);
  const chosen = parts?.find((part) => part.skill === selected) ?? null;
  const chosenLabel = mapSkills.find(({ skill }) => skill === selected)?.label ?? "";

  function onKey(event: KeyboardEvent<SVGGElement>, skill: MapSkill) {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    onSelect(skill);
  }

  return (
    <div className="board-activity progress-map">
      <p className="board-kicker">MIN SKRIVKARTA</p>
      <p className="board-prompt"><Written byHand>Så här långt har du kommit</Written></p>
      <AfterWriting>
        {parts === null ? (
          <>
            <p className="board-small-note">Edda läser din text till höger och visar hur långt varje del har kommit.</p>
            {isEmpty && <p className="self-check-note" role="status">Skriv i din text till höger först.</p>}
            {error && <p className="check-in-error" role="alert">{error}</p>}
            <button className="primary-button" disabled={loading || isEmpty} onClick={onAssess} type="button">
              {loading ? "Edda läser din text …" : "Visa min skrivkarta"}
            </button>
          </>
        ) : (
          <>
            <div className="map-row">
              <svg aria-label="Din skrivkarta" className="map-wheel" role="group" viewBox="-240 -168 480 336">
                {mapSkills.map(({ skill, label }, index) => {
                  const from = index * 60 + gap;
                  const to = (index + 1) * 60 - gap;
                  const isTaught = taught.includes(skill);
                  const level = isTaught ? levelOf(skill) ?? 0 : 0;
                  const [labelX, labelY] = point(150, (from + to) / 2).split(",").map(Number);
                  const anchor = Math.abs(labelX) < 40 ? "middle" : labelX > 0 ? "start" : "end";
                  const state = !isTaught ? "kommer senare" : levelNames[level];
                  return (
                    <g
                      aria-disabled={!isTaught}
                      aria-label={`${label}: ${state}`}
                      aria-pressed={selected === skill}
                      className={`map-slice is-level-${level} ${level >= readyLevel ? "is-ready" : ""} ${isTaught ? "" : "is-later"} ${selected === skill ? "is-selected" : ""}`}
                      key={skill}
                      onClick={isTaught ? () => onSelect(skill) : undefined}
                      onKeyDown={isTaught ? (event) => onKey(event, skill) : undefined}
                      role="button"
                      tabIndex={isTaught ? 0 : -1}
                    >
                      {rings.map(([inner, outer], ring) => (
                        <path
                          className={ring < level ? "map-ring is-filled" : "map-ring"}
                          d={sector(inner + 1.5, outer - 1.5, from, to)}
                          key={inner}
                        />
                      ))}
                      {selected === skill && <path className="map-selection" d={sector(22, 139, from - 1, to + 1)} />}
                      <text textAnchor={anchor} x={labelX} y={labelY + 6}>{label}</text>
                    </g>
                  );
                })}
                <g aria-label={isReady ? "Redo för slutdiagnos" : "Redo för slutdiagnos: inte än"} className={`map-ready ${isReady ? "is-ready" : ""}`} role="img">
                  <path d={sector(27.5, 132.5, 300 + gap, 360 - gap)} />
                  <text textAnchor="middle" x={-76} y={-48}>Redo för</text>
                  <text textAnchor="middle" x={-76} y={-30}>slutdiagnos</text>
                </g>
                <circle className="map-centre" r="22" />
                <rect className="map-eye" height="11" rx="2.5" width="5" x="-9" y="-6" />
                <rect className="map-eye" height="11" rx="2.5" width="5" x="4" y="-6" />
              </svg>
              <div className="map-legend">
                                <ol>
                  <li><span className="map-key is-level-1" />grundläggande</li>
                  <li><span className="map-key is-level-2" />utvecklad</li>
                  <li><span className="map-key is-level-3" />välutvecklad</li>
                </ol>
                <p className="map-legend-note">Grön betyder redo. Klicka på en del om du vill ha tips av Edda.</p>
              </div>
            </div>
            {isReady && (
              <p className="map-ready-note" role="status">Alla delar är gröna. Du är redo för slutdiagnosen.</p>
            )}
            {/* Only the map is shown until the student chooses a part: then Edda says more about it. */}
            {chosen && (
              <div className="map-detail" role="status">
                <div className="edda-says is-on-track">
                  <span aria-hidden="true" className="edda-face" />
                  <div className="edda-bubble-wrap">
                    <strong className="edda-name">{`Edda · ${chosenLabel}: ${levelNames[chosen.level]}`}</strong>
                    <div className="edda-bubble">
                      {chosen.level === 0
                        ? <span>Den här delen syns inte i din text än.</span>
                        : <span>{chosen.strength} <q>{chosen.quote}</q></span>}
                    </div>
                  </div>
                </div>
                {chosen.next && (
                  <p className="develop-note">
                    <span className="compare-label">Att pröva för nästa steg</span>
                    {chosen.next}
                  </p>
                )}
                <p className="assessment-note">Kartan är Eddas stöd för din bearbetning, inte ett betyg.</p>
              </div>
            )}
            {error && <p className="check-in-error" role="alert">{error}</p>}
            {isOutdated && (
              <button className="quiet-button map-again" disabled={loading || isEmpty} onClick={onAssess} type="button">
                {loading ? "Edda läser din text …" : "Jag har ändrat i min text – låt Edda titta igen"}
              </button>
            )}
          </>
        )}
      </AfterWriting>
    </div>
  );
}
