export type LogLevel = "info" | "warn" | "error" | "debug";

export interface LogContext {
  actor: string;
  scenario: string;
  tick?: number;
}

export interface LogEvent extends LogContext {
  ts: string;
  level: LogLevel;
  action: string;
  [key: string]: unknown;
}

export function makeLogger(ctx: LogContext) {
  const emit = (level: LogLevel, action: string, payload: Record<string, unknown> = {}) => {
    const event: LogEvent = {
      ts: new Date().toISOString(),
      level,
      action,
      ...ctx,
      ...payload
    };
    const line = JSON.stringify(event);
    if (level === "error") {
      process.stderr.write(line + "\n");
    } else {
      process.stdout.write(line + "\n");
    }
  };

  return {
    info: (action: string, payload?: Record<string, unknown>) => emit("info", action, payload),
    warn: (action: string, payload?: Record<string, unknown>) => emit("warn", action, payload),
    error: (action: string, payload?: Record<string, unknown>) => emit("error", action, payload),
    debug: (action: string, payload?: Record<string, unknown>) => emit("debug", action, payload),
    withTick: (tick: number) => makeLogger({ ...ctx, tick })
  };
}

export type Logger = ReturnType<typeof makeLogger>;
