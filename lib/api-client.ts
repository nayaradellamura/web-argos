"use client";

import { auth } from "./firebase";

export async function apiFetch(url: string, init?: RequestInit): Promise<Response> {
  // authStateReady() resolve após o Firebase determinar o estado inicial de autenticação,
  // eliminando a race condition onde auth.currentUser ainda é null na montagem do componente.
  await auth.authStateReady();
  const token = auth.currentUser ? await auth.currentUser.getIdToken() : undefined;
  return fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
  });
}
