import "server-only";

import {
  getApps,
  initializeApp,
  cert,
  getApp,
  type App,
} from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

function stripWrappingQuotes(value: string) {
  const trimmed = value.trim();

  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).trim();
  }

  return trimmed;
}

function normalizePrivateKey(rawValue?: string) {
  if (!rawValue) return "";

  let privateKey = stripWrappingQuotes(rawValue).replace(/\\n/g, "\n");

  if (!privateKey.includes("BEGIN") && /^[A-Za-z0-9+/=\s]+$/.test(privateKey)) {
    try {
      const decoded = Buffer.from(privateKey, "base64").toString("utf8").trim();

      if (decoded.includes("BEGIN") && decoded.includes("PRIVATE KEY")) {
        privateKey = decoded;
      }
    } catch {
      // Ignora tentativa de base64 inválida e segue com o valor original.
    }
  }

  return privateKey;
}

function getServiceAccount() {
  const projectId = stripWrappingQuotes(process.env.FIREBASE_PROJECT_ID ?? "");
  const clientEmail = stripWrappingQuotes(
    process.env.FIREBASE_CLIENT_EMAIL ?? "",
  );
  const privateKey = normalizePrivateKey(
    process.env.FIREBASE_PRIVATE_KEY ?? process.env.FIREBASE_PRIVATE_KEY_BASE64,
  );

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      "Credenciais Firebase Admin ausentes. Defina FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL e FIREBASE_PRIVATE_KEY (ou FIREBASE_PRIVATE_KEY_BASE64).",
    );
  }

  if (
    !privateKey.includes("BEGIN PRIVATE KEY") ||
    !privateKey.includes("END PRIVATE KEY")
  ) {
    throw new Error(
      "FIREBASE_PRIVATE_KEY inválida. Use a chave PEM completa (BEGIN/END PRIVATE KEY) com \\n nas quebras de linha, ou informe FIREBASE_PRIVATE_KEY_BASE64.",
    );
  }

  return {
    projectId,
    clientEmail,
    privateKey,
  };
}

function getAdminApp(): App {
  if (getApps().length > 0) {
    return getApp();
  }

  return initializeApp({
    credential: cert(getServiceAccount()),
  });
}

export function getAdminAuth() {
  return getAuth(getAdminApp());
}

export function getAdminDb() {
  return getFirestore(getAdminApp());
}
