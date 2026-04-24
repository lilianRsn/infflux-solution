import { Rng } from "./rng";

const STREET_NAMES = [
  "rue de la Paix", "avenue des Champs-Élysées", "boulevard Haussmann", "rue de Rivoli",
  "avenue Victor Hugo", "rue de la République", "boulevard Saint-Germain", "rue de Rennes",
  "rue Lafayette", "avenue de Wagram", "boulevard Magenta", "rue de Crimée"
];

const CITIES = [
  "Paris", "Lyon", "Marseille", "Toulouse", "Nice", "Nantes", "Strasbourg", "Montpellier",
  "Bordeaux", "Lille", "Rennes", "Reims"
];

const COMPANY_PREFIXES = ["Logistique", "Transport", "Solutions", "Global", "Express", "Sud", "Nord"];
const COMPANY_SUFFIXES = ["SA", "SARL", "SAS", "International", "Services", "Pro"];

export function generateRandomAddress(rng: Rng): string {
  const num = rng.intBetween(1, 200);
  const street = rng.pick(STREET_NAMES);
  const zip = rng.intBetween(10000, 95000).toString().padStart(5, '0');
  const city = rng.pick(CITIES);
  return `${num} ${street}, ${zip} ${city}`;
}

export function generateRandomCompanyName(rng: Rng): string {
  return `${rng.pick(COMPANY_PREFIXES)} ${rng.pick(COMPANY_SUFFIXES)} ${rng.intBetween(100, 999)}`;
}

export function generateRandomContactName(rng: Rng): string {
  const firstNames = ["Jean", "Pierre", "Marie", "Sophie", "Thomas", "Nicolas", "Isabelle", "Julien"];
  const lastNames = ["Dupont", "Martin", "Bernard", "Thomas", "Petit", "Robert", "Richard", "Durand"];
  return `${rng.pick(firstNames)} ${rng.pick(lastNames)}`;
}

export function generateRandomPhone(rng: Rng): string {
  return `06${rng.intBetween(10000000, 99999999)}`;
}
