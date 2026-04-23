export interface Rng {
  next(): number;
  intBetween(minInclusive: number, maxInclusive: number): number;
  pick<T>(items: readonly T[]): T;
  bernoulli(probability: number): boolean;
}

export function makeRng(seed: number): Rng {
  let state = seed >>> 0;

  const next = (): number => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const intBetween = (minInclusive: number, maxInclusive: number): number => {
    if (maxInclusive < minInclusive) {
      throw new RangeError("maxInclusive must be >= minInclusive");
    }
    return Math.floor(next() * (maxInclusive - minInclusive + 1)) + minInclusive;
  };

  const pick = <T>(items: readonly T[]): T => {
    if (items.length === 0) {
      throw new RangeError("cannot pick from empty list");
    }
    return items[intBetween(0, items.length - 1)];
  };

  const bernoulli = (probability: number): boolean => {
    if (probability < 0 || probability > 1) {
      throw new RangeError("probability must be in [0, 1]");
    }
    return next() < probability;
  };

  return { next, intBetween, pick, bernoulli };
}
