import { toast } from 'sonner';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

type RequestConfig = RequestInit & {
  params?: Record<string, any>;
};

async function apiRequest<T>(
  endpoint: string,
  { params, ...customConfig }: RequestConfig = {},
  token?: string
): Promise<T> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };

  const config: RequestInit = {
    ...customConfig,
    headers: {
      ...headers,
      ...customConfig.headers
    }
  };

  let url = `${API_URL}${endpoint}`;
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });
    url += `?${searchParams.toString()}`;
  }

  try {
    const response = await fetch(url, config);

    if (response.status === 204) {
      return {} as T;
    }

    const data = await response.json();

    if (response.ok) {
      return data;
    }

    // Handle errors - Throwing will trigger QueryClient/MutationCache onError
    const errorMessage =
      data.message || response.statusText || 'Something went wrong';
    throw new Error(errorMessage);
  } catch (error: any) {
    if (error.message === 'Failed to fetch') {
      throw new Error(
        'Unable to connect to the server. Please check your internet connection or if the backend is running.'
      );
    }
    throw error;
  }
}

export const apiClient = {
  get: <T>(endpoint: string, config?: RequestConfig, token?: string) =>
    apiRequest<T>(endpoint, { ...config, method: 'GET' }, token),

  post: <T>(
    endpoint: string,
    data?: any,
    config?: RequestConfig,
    token?: string
  ) =>
    apiRequest<T>(
      endpoint,
      { ...config, method: 'POST', body: JSON.stringify(data) },
      token
    ),

  patch: <T>(
    endpoint: string,
    data?: any,
    config?: RequestConfig,
    token?: string
  ) =>
    apiRequest<T>(
      endpoint,
      { ...config, method: 'PATCH', body: JSON.stringify(data) },
      token
    ),

  delete: <T>(endpoint: string, config?: RequestConfig, token?: string) =>
    apiRequest<T>(endpoint, { ...config, method: 'DELETE' }, token)
};
