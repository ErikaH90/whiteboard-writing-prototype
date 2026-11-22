/**
 * How long the student has worked before Edda's help comes by itself. Help is meant for the
 * moment when own effort turns into frustration, not as a way to click past the work: a few
 * quick clicks do not bring it out, but trying for a while, or standing still, does.
 */
export const effortTimes = {
  /** A hint: after a first try and this long on the question (milliseconds). */
  hint: 20_000,
  /** Edda shows the place: after a second try and this long on the question. */
  reveal: 60_000,
  /** A first step is offered when nothing at all has happened for this long. */
  idle: 45_000,
  /** In the writing task: a first step when the text has stood still for this long. */
  writingIdle: 90_000,
};

/** The writing task is handed in when the student has written this many words and changed the text. */
export const minTaskWords = 4;
