import { defaultScenario } from "./scenarios/default";
import { runFleet } from "./runner";
import { ApiError } from "../shared/api-client";

function getArg(name: string): string | undefined {
  const prefix = `--${name}=`;
  const arg = process.argv.find(a => a.includes(prefix));
  if (arg) {
    const value = arg.split('=')[1];
    return value ? value.replace(/['"]/g, '') : undefined;
  }
  return undefined;
}

async function main() {
  const interval = getArg("interval");
  const dayDuration = getArg("day-duration");

  const scenario = {
    ...defaultScenario,
    tick_rate_ms: interval ? parseInt(interval, 10) : defaultScenario.tick_rate_ms,
    minute_par_jour_ms: dayDuration ? parseInt(dayDuration, 10) : defaultScenario.minute_par_jour_ms
  };

  console.log(`🚛 Starting Fleet Simulation...`);
  console.log(`⏱️  Check Interval: ${scenario.tick_rate_ms / 1000}s`);
  console.log(`📅 Day Duration: ${scenario.minute_par_jour_ms / 1000}s`);

  await runFleet(scenario);
}

main().catch((err) => {
  const payload: Record<string, unknown> = {
    ts: new Date().toISOString(),
    level: "error",
    action: "fatal",
    message: err instanceof Error ? err.message : String(err)
  };
  if (err instanceof ApiError) {
    payload.status = err.status;
    payload.body = err.body;
  }
  process.stderr.write(JSON.stringify(payload) + "\n");
  process.exitCode = 1;
});
