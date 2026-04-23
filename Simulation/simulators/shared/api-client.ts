export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: unknown,
    message: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export interface ApiClientOptions {
  baseUrl: string;
  retries?: number;
  retryDelayMs?: number;
}

export class ApiClient {
  private token: string | null = null;

  constructor(private readonly opts: ApiClientOptions) {}

  setToken(token: string): void {
    this.token = token;
  }

  clearToken(): void {
    this.token = null;
  }

  async get<T>(path: string): Promise<T> {
    return this.request<T>("GET", path);
  }

  async post<T>(path: string, body: unknown): Promise<T> {
    return this.request<T>("POST", path, body);
  }

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const url = `${this.opts.baseUrl}${path}`;
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    const maxAttempts = (this.opts.retries ?? 2) + 1;
    const delay = this.opts.retryDelayMs ?? 300;

    let lastError: unknown;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const res = await fetch(url, {
          method,
          headers,
          body: body === undefined ? undefined : JSON.stringify(body)
        });

        const text = await res.text();
        const parsed = text ? safeJsonParse(text) : undefined;

        if (res.ok) {
          return parsed as T;
        }

        // On retry seulement les 5xx ; les 4xx sont des erreurs métier définitives.
        if (res.status < 500 || attempt === maxAttempts) {
          throw new ApiError(res.status, parsed, `${method} ${path} → ${res.status}`);
        }

        lastError = new ApiError(res.status, parsed, `${method} ${path} → ${res.status}`);
      } catch (err) {
        if (err instanceof ApiError && err.status < 500) {
          throw err;
        }
        lastError = err;
        if (attempt === maxAttempts) break;
      }

      await sleep(delay * attempt);
    }

    throw lastError instanceof Error ? lastError : new Error(String(lastError));
  }
}

function safeJsonParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
