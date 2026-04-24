import { runMerchant } from "./runner";
import { defaultScenario } from "./scenarios/default";
import { BuildStockParams } from "./storage/build";
import { loadEnv } from "../shared/config";
import { makeRng } from "../shared/rng";
import { 
  generateRandomAddress, 
  generateRandomCompanyName, 
  generateRandomContactName, 
  generateRandomPhone 
} from "../shared/random-data";

/**
 * Ce script permet de lancer un marchand spécifique via la ligne de commande.
 * Usage: npx tsx merchant/spawn.ts --email=test@example.com --name="Test Corp" --interval=15000 --address="123 Rue"
 */

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
  const env = loadEnv();
  const seed = Math.floor(Math.random() * 1000000);
  const rng = makeRng(seed);

  const email = getArg("email") || `merchant-${rng.intBetween(100, 999)}@example.com`;
  const name = getArg("name") || generateRandomCompanyName(rng);
  const interval = parseInt(getArg("interval") || "15000", 10);
  const address = getArg("address") || generateRandomAddress(rng);
  const billingAddress = getArg("billing-address") || address;
  const contactName = getArg("contact-name") || generateRandomContactName(rng);
  const contactPhone = getArg("contact-phone") || generateRandomPhone(rng);

  const scenario = {
    ...defaultScenario,
    nom: `spawned-${email}`,
    seed,
    tick_rate_ms: interval,
    credentials: {
      email: email,
      password: "Pass1234!"
    },
    identity: {
      company_name: name,
      billing_address: billingAddress,
      main_contact_name: contactName,
      main_contact_phone: contactPhone,
      main_contact_email: email
    },
    warehouse: {
      ...defaultScenario.warehouse,
      warehouse_name: `Entrepot ${name}`,
      warehouse_address: address,
    },
    stock_init: {
      ...defaultScenario.stock_init,
      marchand_id: email.replace(/[^a-zA-Z0-9]/g, '-'),
      catalogue: pickRandomProducts(defaultScenario.stock_init.catalogue, 3)
    } as BuildStockParams
  };

  console.log(`🚀 Spawning merchant: ${name} (${email})`);
  console.log(`🏠 Address: ${address}`);
  console.log(`👤 Contact: ${contactName} (${contactPhone})`);
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
