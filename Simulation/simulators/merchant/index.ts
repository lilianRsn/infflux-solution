import { defaultScenario } from "./scenarios/default";
import { runMerchant } from "./runner";

async function main() {
  const report = await runMerchant(defaultScenario);
  if (report.commandes_echecs > 0) {
    process.exitCode = 1;
  }
}

main().catch((err) => {
  process.stderr.write(
    JSON.stringify({
      ts: new Date().toISOString(),
      level: "error",
      action: "fatal",
      message: err instanceof Error ? err.message : String(err)
    }) + "\n"
  );
  process.exitCode = 1;
});
