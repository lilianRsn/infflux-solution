import { runMerchant } from "./runner";
import { defaultScenario } from "./scenarios/default";
import { BuildStockParams } from "./storage/build";
import { loadEnv } from "../shared/config";

/**
 * Ce script permet de lancer un marchand spécifique via la ligne de commande.
 * Usage: npx tsx merchant/spawn.ts --email=test@example.com --name="Test Corp" --interval=15000
 */

function getArg(name: string): string | undefined {
  const prefix = `--${name}=`;
  // On cherche l'argument soit tel quel, soit dans une chaîne concaténée
  const arg = process.argv.find(a => a.includes(prefix));
  if (arg) {
    const value = arg.split('=')[1];
    return value ? value.replace(/['"]/g, '') : undefined;
  }
  return undefined;
}

async function main() {
  const env = loadEnv();
  const email = getArg("email") || `merchant-${Math.floor(Math.random() * 1000)}@example.com`;
  const name = getArg("name") || `Marchand ${email.split('@')[0]}`;
  const interval = parseInt(getArg("interval") || "15000", 10);

  const scenario = {
    ...defaultScenario,
    nom: `spawned-${email}`,
    seed: Math.floor(Math.random() * 1000000),
    tick_rate_ms: interval,
    credentials: {
      email: email,
      password: "Pass1234!"
    },
    identity: {
      ...defaultScenario.identity,
      company_name: name,
      main_contact_email: email
    },
    stock_init: {
      ...defaultScenario.stock_init,
      marchand_id: email.replace(/[^a-zA-Z0-9]/g, '-'),
      catalogue: pickRandomProducts(defaultScenario.stock_init.catalogue, 3)
    } as BuildStockParams
  };

  console.log(`🚀 Spawning merchant: ${name} (${email})`);
  console.log(`⏱️  Interval: ${interval/1000}s`);
  console.log(`🔗 Backend: ${env.backendUrl}`);
  
  await runMerchant(scenario);
}

function pickRandomProducts(fullCatalogue: string[], count: number): string[] {
  const shuffled = [...fullCatalogue].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

main().catch(err => {
  console.error("Fatal error in spawned merchant:", err);
  process.exit(1);
});
