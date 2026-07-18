/**
 * Thin fetch client the reference screens use to reach the mock backend
 * (`flexa-ui-kit/mocks`, intercepted by the MSW Service Worker). Requests are plain
 * `/v1/...` calls — the screens are written as if against a real API, which is
 * the point of U11: prove the kit composes against a realistic data layer.
 *
 * Response *types* come straight from `flexa-ui-kit/mocks` (the fixture module IS
 * the doc-09 shape contract), so screens stay strongly typed end to end.
 */

export interface ApiError {
  code: string;
  message: string;
  requestId: string;
}

export class ApiRequestError extends Error {
  constructor(
    public status: number,
    public body: ApiError | null,
  ) {
    super(body?.message ?? `Request failed (${status})`);
    this.name = 'ApiRequestError';
  }
}

async function request<T>(method: string, path: string, init?: { body?: unknown; idempotencyKey?: string }): Promise<T> {
  const headers: Record<string, string> = {};
  if (init?.body !== undefined) headers['Content-Type'] = 'application/json';
  if (init?.idempotencyKey) headers['Idempotency-Key'] = init.idempotencyKey;
  const res = await fetch(path, {
    method,
    headers,
    body: init?.body !== undefined ? JSON.stringify(init.body) : undefined,
  });
  if (!res.ok) {
    let body: ApiError | null = null;
    try {
      const json = (await res.json()) as { error?: ApiError };
      body = json.error ?? null;
    } catch {
      body = null;
    }
    throw new ApiRequestError(res.status, body);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export const api = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body?: unknown, idempotencyKey?: string) =>
    request<T>('POST', path, { body: body ?? {}, idempotencyKey }),
  patch: <T>(path: string, body: unknown) => request<T>('PATCH', path, { body }),
  del: <T>(path: string) => request<T>('DELETE', path),
};
