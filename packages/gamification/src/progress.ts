/**
 * Motivation derived from attempt evidence (ADR-0014). Everything here is a pure function
 * of the attempts and the current time, so the numbers can be recomputed on any device and
 * never drift from the evidence. Nothing here decides what a learner may understand: hearts
 * limit practice attempts, never explanations.
 */

export interface Attempt {
  /** Epoch milliseconds when the answer was given. */
  at: number;
  correct: boolean;
}

export const XP = { correct: 10, wrong: 2 } as const;
export const HEARTS = { max: 5, regenMs: 30 * 60_000 } as const;

const DAY_MS = 86_400_000;

export function xpFor(attempts: readonly Attempt[]): number {
  return attempts.reduce((sum, a) => sum + (a.correct ? XP.correct : XP.wrong), 0);
}

/** XP at which a level starts: level 1 at 0, 2 at 50, 3 at 200, 4 at 450, ... */
function threshold(level: number): number {
  return 50 * (level - 1) ** 2;
}

export function levelFor(xp: number): { level: number; intoLevel: number; toNext: number } {
  const x = Math.max(0, Math.floor(xp));
  const level = 1 + Math.floor(Math.sqrt(x / 50));
  return { level, intoLevel: x - threshold(level), toNext: threshold(level + 1) - x };
}

/** Calendar day of an instant in the learner's time zone, as YYYY-MM-DD. */
export function dayKey(at: number, timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(at));
}

/** Days since the epoch for a YYYY-MM-DD key (exact: the key carries no time of day). */
function dayNumber(key: string): number {
  const [y, m, d] = key.split("-").map(Number) as [number, number, number];
  return Date.UTC(y, m - 1, d) / DAY_MS;
}

/**
 * Consecutive learning days. The current streak still counts when today has no answer
 * yet: it ends only after a full day with none. Days are the learner's own calendar days.
 */
export function streakFor(attempts: readonly Attempt[], now: number, timeZone: string): { current: number; longest: number } {
  const days = [...new Set(attempts.map((a) => dayKey(a.at, timeZone)))].map(dayNumber).sort((a, b) => a - b);
  if (days.length === 0) return { current: 0, longest: 0 };

  let longest = 1;
  let run = 1;
  for (let i = 1; i < days.length; i++) {
    const prev = days[i - 1];
    const cur = days[i];
    run = prev !== undefined && cur === prev + 1 ? run + 1 : 1;
    longest = Math.max(longest, run);
  }

  const active = new Set(days);
  const today = dayNumber(dayKey(now, timeZone));
  const start = active.has(today) ? today : active.has(today - 1) ? today - 1 : null;
  let current = 0;
  if (start !== null) {
    for (let d = start; active.has(d); d--) current++;
  }
  return { current, longest };
}

export interface Hearts {
  hearts: number;
  /** When the next heart comes back; null when the bar is full. */
  nextHeartAt: number | null;
}

/**
 * Hearts: a wrong answer costs one; one comes back every HEARTS.regenMs while below the
 * maximum. Correct answers cost nothing. The timer runs from the moment the bar first dropped
 * below full, so a heart is never lost or gained by reloading the page.
 */
export function heartsAt(attempts: readonly Attempt[], now: number): Hearts {
  const ordered = [...attempts].sort((a, b) => a.at - b.at);
  let hearts: number = HEARTS.max;
  let anchor = 0;

  const advance = (t: number) => {
    if (hearts >= HEARTS.max) {
      anchor = t;
      return;
    }
    const gained = Math.floor((t - anchor) / HEARTS.regenMs);
    if (gained > 0) {
      hearts = Math.min(HEARTS.max, hearts + gained);
      anchor += gained * HEARTS.regenMs;
      if (hearts >= HEARTS.max) anchor = t;
    }
  };

  for (const a of ordered) {
    advance(a.at);
    if (!a.correct) {
      if (hearts >= HEARTS.max) anchor = a.at;
      hearts = Math.max(0, hearts - 1);
    }
  }
  advance(now);
  return { hearts, nextHeartAt: hearts < HEARTS.max ? anchor + HEARTS.regenMs : null };
}

export interface Summary {
  answers: number;
  xp: number;
  level: number;
  intoLevel: number;
  toNext: number;
  streak: number;
  longestStreak: number;
  hearts: number;
  nextHeartAt: number | null;
}

export function summarize(attempts: readonly Attempt[], now: number, timeZone: string): Summary {
  const xp = xpFor(attempts);
  const { level, intoLevel, toNext } = levelFor(xp);
  const streak = streakFor(attempts, now, timeZone);
  const hearts = heartsAt(attempts, now);
  return {
    answers: attempts.length,
    xp,
    level,
    intoLevel,
    toNext,
    streak: streak.current,
    longestStreak: streak.longest,
    hearts: hearts.hearts,
    nextHeartAt: hearts.nextHeartAt,
  };
}

/** Whole minutes until an instant, rounded up and never below 1 while the instant is ahead. */
export function minutesUntil(at: number, now: number): number {
  return Math.max(1, Math.ceil((at - now) / 60_000));
}

/**
 * Hearts belong to practice, never to learning (ADR-0014 amendment, owner decision Q3):
 * only answers marked as practice cost hearts. First passes through a lesson are learning
 * and never pause, so their answers are left out of the hearts count; everything else in
 * the summary still counts every answer.
 */
export function summarizeScoped(
  attempts: readonly (Attempt & { practice?: boolean })[],
  now: number,
  timeZone: string,
): Summary {
  const summary = summarize(attempts, now, timeZone);
  const hearts = heartsAt(attempts.filter((a) => a.practice === true), now);
  return { ...summary, hearts: hearts.hearts, nextHeartAt: hearts.nextHeartAt };
}
