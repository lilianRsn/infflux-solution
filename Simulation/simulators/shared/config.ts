export interface SimulatorEnv {
  backendUrl: string;
}

export function loadEnv(): SimulatorEnv {
  const backendUrl = process.env.BACKEND_URL ?? "http://localhost:3000";
  return { backendUrl };
}
