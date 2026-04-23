export interface SimulatorEnv {
  backendUrl: string;
}

export function loadEnv(): SimulatorEnv {
  const backendUrl = process.env.BACKEND_URL ?? "http://127.0.0.1:3001";
  return { backendUrl };
}
