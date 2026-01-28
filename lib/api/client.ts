export const HttpMethod = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  PATCH: 'PATCH',
  DELETE: 'DELETE',
} as const;

export type HttpMethod = (typeof HttpMethod)[keyof typeof HttpMethod];

export interface RequestOptions {
  /**
   * Optional base URL used to resolve relative endpoints like `api/foo`.
   * Example: `https://api.example.com`
   */
  baseUrl?: string;
  /**
   * Optional bearer token. If provided, sent as `Authorization: Bearer <token>`.
   */
  authToken?: string;
  /**
   * Additional headers to send with the request.
   */
  headers?: Record<string, string>;
  /**
   * Optional signal to cancel the request.
   */
  signal?: AbortSignal;
}

export interface StreamPlainTextOptions extends RequestOptions {
  onOpen?: () => void;
  onChunk?: (chunk: string) => void;
  onDone?: () => void;
  onError?: (err: unknown) => void;
}

export interface StreamHandle {
  close: () => void;
  /**
   * Resolves when streaming completes (or errors/aborts).
   * Not required by current call sites, but useful for tests/awaiting completion.
   */
  done: Promise<void>;
}

const isAbsoluteUrl = (url: string) => /^[a-z][a-z0-9+.-]*:\/\//i.test(url);

const buildUrl = (path: string, baseUrl?: string) => {
  if (isAbsoluteUrl(path)) return path;
  if (!baseUrl) return path;
  return new URL(path, baseUrl).toString();
};

const buildHeaders = (options: RequestOptions, extra?: Record<string, string>) => {
  const headers: Record<string, string> = {
    ...(options.headers ?? {}),
    ...(extra ?? {}),
  };
  if (options.authToken) {
    headers.Authorization = `Bearer ${options.authToken}`;
  }
  return headers;
};

const errorFromResponse = async (res: Response, method: string, url: string) => {
  const text = await res.text().catch(() => '');
  const snippet = text ? text.slice(0, 300) : '';
  return new Error(`[apiClient] ${method} ${url} failed: ${res.status} ${res.statusText}${snippet ? ` — ${snippet}` : ''}`);
};

const parseJsonBody = async <T>(res: Response, method: string, url: string): Promise<T> => {
  // Handle "no content" responses (common for DELETE).
  if (res.status === 204) return undefined as T;

  const text = await res.text().catch(() => '');
  if (!text) return undefined as T;

  try {
    return JSON.parse(text) as T;
  } catch {
    const snippet = text.slice(0, 300);
    throw new Error(
      `[apiClient] ${method} ${url} returned non-JSON response${snippet ? ` — ${snippet}` : ''}`,
    );
  }
};

const requestJson = async <T>(
  method: HttpMethod,
  path: string,
  body: unknown | undefined,
  options: RequestOptions,
): Promise<T> => {
  const url = buildUrl(path, options.baseUrl);
  const res = await fetch(url, {
    method,
    headers: buildHeaders(options, {
      Accept: 'application/json',
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
    }),
    body: body !== undefined ? JSON.stringify(body) : undefined,
    signal: options.signal,
  });

  if (!res.ok) throw await errorFromResponse(res, method, url);
  return await parseJsonBody<T>(res, method, url);
};

export const apiClient = {
  get: async <T>(path: string, options: RequestOptions): Promise<T> =>
    requestJson<T>(HttpMethod.GET, path, undefined, options),

  post: async <T>(path: string, body: unknown, options: RequestOptions): Promise<T> =>
    requestJson<T>(HttpMethod.POST, path, body, options),

  put: async <T>(path: string, body: unknown, options: RequestOptions): Promise<T> =>
    requestJson<T>(HttpMethod.PUT, path, body, options),

  patch: async <T>(path: string, body: unknown, options: RequestOptions): Promise<T> =>
    requestJson<T>(HttpMethod.PATCH, path, body, options),

  delete: async <T>(path: string, options: RequestOptions): Promise<T> =>
    requestJson<T>(HttpMethod.DELETE, path, undefined, options),

  streamPlainText: async (
    method: HttpMethod,
    path: string,
    body: unknown,
    options: StreamPlainTextOptions,
  ): Promise<StreamHandle> => {
    const url = buildUrl(path, options.baseUrl);

    const controller = new AbortController();
    if (options.signal) {
      if (options.signal.aborted) controller.abort();
      else options.signal.addEventListener('abort', () => controller.abort(), { once: true });
    }

    let closed = false;
    const close = () => {
      if (closed) return;
      closed = true;
      controller.abort();
    };

    const done = (async () => {
      try {
        const res = await fetch(url, {
          method,
          headers: buildHeaders(options, {
            Accept: 'text/plain',
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify(body),
          signal: controller.signal,
        });

        if (!res.ok) throw await errorFromResponse(res, method, url);

        options.onOpen?.();

        const reader = res.body?.getReader();
        if (!reader) {
          options.onDone?.();
          return;
        }

        const decoder = new TextDecoder();
        while (true) {
          const { value, done: isDone } = await reader.read();
          if (isDone) break;
          if (value) {
            const chunk = decoder.decode(value, { stream: true });
            if (chunk) options.onChunk?.(chunk);
          }
        }
        const flush = decoder.decode();
        if (flush) options.onChunk?.(flush);
        options.onDone?.();
      } catch (err) {
        // If aborted, treat as a normal termination.
        if ((err as { name?: string }).name === 'AbortError' || controller.signal.aborted) {
          options.onDone?.();
          return;
        }
        options.onError?.(err);
      }
    })();

    return { close, done };
  },
};