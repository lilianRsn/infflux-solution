import { defaultScenario } from "./scenarios/default";
import { runMerchant } from "./runner";
import { ApiError } from "../shared/api-client";

async function main() {
  const report = await runMerchant(defaultScenario);
  if (report.commandes_echecs > 0) {
    process.exitCode = 1;
  }
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
