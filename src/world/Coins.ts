// Coin counter of a run: note coins and floating coins add up; every 100 give an extra life.

export const COINS_PER_LIFE = 100;

export class CoinCounter {
  count = 0;

  /** Adds coins; returns how many times the count passed a multiple of 100 (usually 0 or 1). */
  add(n = 1): number {
    const before = Math.floor(this.count / COINS_PER_LIFE);
    this.count += n;
    return Math.floor(this.count / COINS_PER_LIFE) - before;
  }

  reset(): void {
    this.count = 0;
  }
}
