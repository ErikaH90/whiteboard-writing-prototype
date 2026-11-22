/**
 * How long the student has worked on a question before help can be asked for. Help is meant for
 * the moment when own effort turns into frustration, not as a way to click past the work:
 * a few quick clicks do not bring it out, but trying for a while does.
 */
export const effortTimes = {
  /** A hint: after a first try and this long on the question (milliseconds). */
  hint: 15_000,
  /** Letting Edda show the place: after a second try and this long on the question. */
  reveal: 40_000,
};

/** The writing task is handed in when the student has written this many words and changed the text. */
export const minTaskWords = 4;
