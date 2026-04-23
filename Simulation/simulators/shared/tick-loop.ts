export interface TickContext {
  tick: number;
  elapsedMs: number;
}

export interface TickLoopOptions {
  /** Nombre de ticks à exécuter. Passe Infinity pour un mode continu. */
  nbTicks: number;
  tickRateMs: number;
  onTick: (ctx: TickContext) => Promise<void> | void;
  /** Consulté après chaque tick et après chaque attente : retourne true pour arrêter la boucle proprement. */
  shouldStop?: () => boolean;
}

export async function runTicks(opts: TickLoopOptions): Promise<void> {
  const start = Date.now();
  let tick = 0;
  while (tick < opts.nbTicks) {
    tick++;
    await opts.onTick({ tick, elapsedMs: Date.now() - start });
    if (opts.shouldStop?.()) return;
    if (tick < opts.nbTicks) {
      await sleep(opts.tickRateMs);
      if (opts.shouldStop?.()) return;
    }
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
