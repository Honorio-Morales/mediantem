/**
 * lib/api.ts — Wrapper de fetch para todas las llamadas a la API.
 * Agrega automáticamente el header Authorization: Bearer.
 * Si recibe 401, intenta refrescar el token y reintenta.
 * Si el refresh falla, llama logout() en authStore.
 */
import { useAuthStore } from '../stores/authStore';

const API_URL = import.meta.env.PUBLIC_API_URL || 'http://localhost:3001/api';

interface FetchOptions extends RequestInit {
    skipAuth?: boolean;
}

async function refreshAccessToken(): Promise<string | null> {
    try {
        const res = await fetch(`${API_URL}/auth/refresh`, {
            method: 'POST',
            credentials: 'include', // sends HttpOnly cookie
        });

        if (!res.ok) return null;

        const data = await res.json();
        if (data.ok && data.data?.accessToken) {
            useAuthStore.getState().setToken(data.data.accessToken);
            return data.data.accessToken;
        }
        return null;
    } catch {
        return null;
    }
}

export async function api<T = any>(
    endpoint: string,
    options: FetchOptions = {}
): Promise<{ ok: boolean; data?: T; message?: string; meta?: any }> {
    const { skipAuth = false, headers: customHeaders, ...fetchOptions } = options;

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(customHeaders as Record<string, string>),
    };

    // Add auth token if available and not skipped
    if (!skipAuth) {
        const token = useAuthStore.getState().accessToken;
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
    }

    const url = endpoint.startsWith('http') ? endpoint : `${API_URL}${endpoint}`;

    let res = await fetch(url, {
        ...fetchOptions,
        headers,
        credentials: 'include', // always send cookies (refreshToken)
    });

    // If 401, try refreshing
    if (res.status === 401 && !skipAuth) {
        const newToken = await refreshAccessToken();
        if (newToken) {
            headers['Authorization'] = `Bearer ${newToken}`;
            res = await fetch(url, {
                ...fetchOptions,
                headers,
                credentials: 'include',
            });
        } else {
            useAuthStore.getState().logout();
            return { ok: false, message: 'Session expired' };
        }
    }

    const json = await res.json();
    return json;
}

// Convenience methods
export const apiGet = <T = any>(endpoint: string) =>
    api<T>(endpoint, { method: 'GET' });

export const apiPost = <T = any>(endpoint: string, body: any) =>
    api<T>(endpoint, { method: 'POST', body: JSON.stringify(body) });

export const apiPut = <T = any>(endpoint: string, body: any) =>
    api<T>(endpoint, { method: 'PUT', body: JSON.stringify(body) });

export const apiPatch = <T = any>(endpoint: string, body: any) =>
    api<T>(endpoint, { method: 'PATCH', body: JSON.stringify(body) });

export const apiDelete = <T = any>(endpoint: string) =>
    api<T>(endpoint, { method: 'DELETE' });
