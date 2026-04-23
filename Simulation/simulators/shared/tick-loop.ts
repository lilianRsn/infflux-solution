export interface TickContext {
  tick: number;
  elapsedMs: number;
}

export interface TickLoopOptions {
  nbTicks: number;
  tickRateMs: number;
  onTick: (ctx: TickContext) => Promise<void> | void;
}

export async function runTicks(opts: TickLoopOptions): Promise<void> {
  const start = Date.now();
  for (let tick = 1; tick <= opts.nbTicks; tick++) {
    await opts.onTick({ tick, elapsedMs: Date.now() - start });
    if (tick < opts.nbTicks) {
      await sleep(opts.tickRateMs);
    }
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
