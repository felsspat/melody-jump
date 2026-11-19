// Campaign progress (stars and best score per level), saved in the browser.
// Works without storage too – progress then only lasts for the session.

export interface Progress {
  version: 1;
  stars: Record<string, number>;
  best: Record<string, number>;
}

const STORAGE_KEY = 'melody-jump-campaign';

function empty(): Progress {
  return { version: 1, stars: {}, best: {} };
}

export function loadProgress(): Progress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return empty();
    const data = JSON.parse(raw) as Partial<Progress>;
    if (data.version !== 1) return empty();
    return { version: 1, stars: data.stars ?? {}, best: data.best ?? {} };
  } catch {
    return empty();
  }
}

export function saveProgress(p: Progress): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
  } catch {
    /* storage unavailable: keep progress in memory only */
  }
}

/** Keeps the best result per level. */
export function recordResult(p: Progress, levelId: string, stars: number, score: number): void {
  p.stars[levelId] = Math.max(p.stars[levelId] ?? 0, stars);
  p.best[levelId] = Math.max(p.best[levelId] ?? 0, Math.floor(score));
}

/**
 * Stars for a finished level: 1 for finishing, 2 for a good average
 * resonance, 3 for a great one with at most one life lost.
 */
export function starsFor(avgResonance: number, livesLost: number): number {
  if (avgResonance >= 65 && livesLost <= 1) return 3;
  if (avgResonance >= 45) return 2;
  return 1;
}
