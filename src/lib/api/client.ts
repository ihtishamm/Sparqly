import { useAuthStore } from '@/store/auth-store';
import { ApiError, toApiError } from './errors';

export const API_URL = (
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'
).replace(/\/$/, '');

/** Refresh this long before the access token actually expires. */
const REFRESH_MARGIN_MS = 60_000;
const DEFAULT_TIMEOUT_MS = 30_000;

type Params = Record<string, string | number | boolean | null | undefined>;

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  params?: Params;
  signal?: AbortSignal;
  /** Send without a token (sign-in, sign-up, password reset). */
  anonymous?: boolean;
  timeoutMs?: number;
};

let refreshing: Promise<string | null> | null = null;

/**
 * Exchanges the refresh token for a new pair. Concurrent callers share one
 * request, so a burst of 401s triggers a single refresh.
 */
function refreshSession(): Promise<string | null> {
  if (refreshing) return refreshing;

  refreshing = (async () => {
    const { refreshToken, setSession } = useAuthStore.getState();
    if (!refreshToken) return null;
    try {
      const response = await fetch(`${API_URL}/v1/auth/refresh`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${refreshToken}` }
      });
      if (!response.ok) return null;
      const session = await response.json();
      setSession(session);
      return session.token as string;
    } catch {
      return null;
    }
  })().finally(() => {
    refreshing = null;
  });

  return refreshing;
}

/** Ends the local session and sends the user to sign in, keeping their place. */
function endSession() {
  useAuthStore.getState().clear();
  if (typeof window === 'undefined') return;
  if (window.location.pathname.startsWith('/auth')) return;
  const callbackUrl = window.location.pathname + window.location.search;
  window.location.assign(
    `/auth/sign-in?expired=1&callbackUrl=${encodeURIComponent(callbackUrl)}`
  );
}

async function validToken(): Promise<string | null> {
  const { token, tokenExpires } = useAuthStore.getState();
  if (!token) return null;
  if (tokenExpires && tokenExpires - Date.now() < REFRESH_MARGIN_MS) {
    return (await refreshSession()) ?? token;
  }
  return token;
}

function buildUrl(path: string, params?: Params) {
  const url = new URL(`${API_URL}${path}`);
  for (const [key, value] of Object.entries(params ?? {})) {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

async function send(
  path: string,
  options: RequestOptions,
  token: string | null
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(new DOMException('Timed out', 'TimeoutError')),
    options.timeoutMs ?? DEFAULT_TIMEOUT_MS
  );
  const onAbort = () => controller.abort(options.signal?.reason);
  options.signal?.addEventListener('abort', onAbort);

  try {
    return await fetch(buildUrl(path, options.params), {
      method: options.method ?? 'GET',
      headers: {
        ...(options.body !== undefined
          ? { 'Content-Type': 'application/json' }
          : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body:
        options.body !== undefined ? JSON.stringify(options.body) : undefined,
      signal: controller.signal
    });
  } catch (error) {
    if (options.signal?.aborted) throw error;
    if (controller.signal.aborted) {
      throw new ApiError('The server took too long to respond.', 0);
    }
    throw new ApiError(
      'Can’t reach Sparqly. Check your connection and try again.',
      0
    );
  } finally {
    clearTimeout(timeout);
    options.signal?.removeEventListener('abort', onAbort);
  }
}

async function parse(response: Response): Promise<unknown> {
  if (response.status === 204) return undefined;
  const text = await response.text();
  if (!text) return undefined;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export async function request<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const token = options.anonymous ? null : await validToken();
  let response = await send(path, options, token);

  if (response.status === 401 && !options.anonymous && token) {
    const fresh = await refreshSession();
    if (!fresh) {
      endSession();
      throw toApiError(401, await parse(response));
    }
    response = await send(path, options, fresh);
    if (response.status === 401) {
      endSession();
    }
  }

  const body = await parse(response);
  if (!response.ok) throw toApiError(response.status, body);
  return body as T;
}

export const api = {
  get: <T>(path: string, params?: Params, signal?: AbortSignal) =>
    request<T>(path, { params, signal }),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'POST', body }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PUT', body }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PATCH', body }),
  delete: <T = void>(path: string) => request<T>(path, { method: 'DELETE' })
};

/** Best-effort server logout, then clears the local session. */
export async function signOut() {
  const { token } = useAuthStore.getState();
  if (token) {
    await send('/v1/auth/logout', { method: 'POST' }, token).catch(
      () => undefined
    );
  }
  useAuthStore.getState().clear();
}
