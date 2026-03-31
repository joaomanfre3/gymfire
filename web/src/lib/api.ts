export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('access_token');
}

export function getUser(): { id: string; username: string; displayName: string; email: string } | null {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem('user_info');
  if (!stored) return null;
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

export function logout() {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user_info');
  window.location.href = '/login';
}

export async function apiFetch(url: string, options?: RequestInit) {
  const token = getToken();
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });
  return res;
}
