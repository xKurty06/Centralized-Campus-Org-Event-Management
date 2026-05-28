"use client";

import { clearAuthSession } from "./authStorage";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1";

export async function redirectIfAuthenticated(
  onAuthenticated: () => void,
  signal?: AbortSignal,
): Promise<void> {
  const token =
    window.localStorage.getItem("auth_token") ??
    window.sessionStorage.getItem("auth_token");

  if (!token) return;

  try {
    const res = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      signal,
    });

    if (res.status === 401 || res.status === 403) {
      clearAuthSession();
      return;
    }

    if (!res.ok) return;

    onAuthenticated();
  } catch (error: any) {
    if (error?.name === "AbortError") return;
  }
}
