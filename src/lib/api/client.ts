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
 * Gets a new access token using the HttpOnly refresh cookie. Concurrent
 * callers share one request, and a Web Lock serialises refreshes across
 * tabs: the refresh token rotates on use, so two tabs sending the same
 * cookie at once would sign one of them out.
 */
function refreshSession(): Promise<string | null> {
  if (refreshing) return refreshing;

  const run = async () => {
    try {
      const response = await fetch(`${API_URL}/v1/auth/refresh`, {
        method: 'POST',
        credentials: 'include'
      });
      if (!response.ok) return null;
      const session = await response.json();
      useAuthStore.getState().setSession({
        token: session.token,
        tokenExpires: session.tokenExpires
      });
      return session.token as string;
    } catch {
      return null;
    }
  };

  const locks = typeof navigator !== 'undefined' ? navigator.locks : undefined;
  refreshing = (locks ? locks.request('sparqly-refresh', run) : run()).finally(
    () => {
      refreshing = null;
    }
  );

  return refreshing;
}

/**
 * Restores the session after a reload. Returns false when the refresh cookie
 * is missing or no longer valid.
 */
export async function restoreSession(): Promise<boolean> {
  if (useAuthStore.getState().token) return true;
  return (await refreshSession()) !== null;
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
  if (!token) return refreshSession();
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
        // FormData sets its own multipart boundary.
        ...(options.body !== undefined && !(options.body instanceof FormData)
          ? { 'Content-Type': 'application/json' }
          : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body:
        options.body instanceof FormData
          ? options.body
          : options.body !== undefined
            ? JSON.stringify(options.body)
            : undefined,
      // Sign-in, refresh and sign-out set or clear the refresh cookie.
      credentials: 'include',
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
  if (!options.anonymous && !token) {
    endSession();
    throw toApiError(401, undefined);
  }
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

/**
 * Uploads a file as multipart form data. Uses XHR because fetch can't report
 * upload progress. `onProgress` gets 0–1.
 */
export async function upload<T>(
  path: string,
  form: FormData,
  options: {
    onProgress?: (fraction: number) => void;
    signal?: AbortSignal;
  } = {}
): Promise<T> {
  const attempt = (token: string) =>
    new Promise<{ status: number; body: unknown }>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', buildUrl(path));
      xhr.withCredentials = true;
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) options.onProgress?.(e.loaded / e.total);
      };
      xhr.onload = () => {
        let body: unknown = xhr.responseText;
        try {
          body = xhr.responseText ? JSON.parse(xhr.responseText) : undefined;
        } catch {
          // Plain-text error body.
        }
        resolve({ status: xhr.status, body });
      };
      xhr.onerror = () =>
        reject(
          new ApiError(
            'The upload failed. Check your connection and try again.',
            0
          )
        );
      xhr.onabort = () =>
        reject(new DOMException('Upload cancelled', 'AbortError'));
      options.signal?.addEventListener('abort', () => xhr.abort());
      xhr.send(form);
    });

  const token = await validToken();
  if (!token) {
    endSession();
    throw toApiError(401, undefined);
  }
  let result = await attempt(token);
  if (result.status === 401) {
    const fresh = await refreshSession();
    if (!fresh) {
      endSession();
      throw toApiError(401, result.body);
    }
    result = await attempt(fresh);
  }
  if (result.status < 200 || result.status >= 300) {
    throw toApiError(result.status, result.body);
  }
  return result.body as T;
}

/**
 * Best-effort server logout (ends the session and clears the refresh
 * cookie), then clears the local session.
 */
export async function signOut() {
  const token = await validToken().catch(() => null);
  if (token) {
    await send('/v1/auth/logout', { method: 'POST' }, token).catch(
      () => undefined
    );
  }
  useAuthStore.getState().clear();
}
