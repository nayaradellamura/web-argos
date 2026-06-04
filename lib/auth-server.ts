import { getAdminAuth } from "./firebase-admin";

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthError";
  }
}

export async function requireAuth(request: Request): Promise<string> {
  const header = request.headers.get("Authorization") ?? "";
  if (!header.startsWith("Bearer ")) {
    throw new AuthError("Token não fornecido.");
  }
  const token = header.slice(7);
  try {
    const decoded = await getAdminAuth().verifyIdToken(token);
    return decoded.uid;
  } catch (error) {
    console.error("[requireAuth] verifyIdToken falhou:", error);
    throw error;
  }
}
