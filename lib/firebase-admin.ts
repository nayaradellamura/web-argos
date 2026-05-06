import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

function readEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(
      `Firebase Admin SDK não configurado: ${name} não foi encontrado no .env.local.`,
    );
  }

  return value;
}

function formatPrivateKey(privateKey: string) {
  return privateKey
    .replace(/^"|"$/g, "")
    .replace(/\\n/g, "\n");
}

function getAdminApp() {
  const existingApp = getApps()[0];

  if (existingApp) {
    return existingApp;
  }

  const projectId = readEnv("FIREBASE_PROJECT_ID");
  const clientEmail = readEnv("FIREBASE_CLIENT_EMAIL");
  const privateKey = formatPrivateKey(readEnv("FIREBASE_PRIVATE_KEY"));

  if (!privateKey.includes("BEGIN PRIVATE KEY")) {
    throw new Error(
      "FIREBASE_PRIVATE_KEY inválida. Copie a chave privada do JSON da conta de serviço e mantenha os \\n no .env.local.",
    );
  }

  return initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  });
}

export function getAdminAuth() {
  return getAuth(getAdminApp());
}

export function getAdminDb() {
  return getFirestore(getAdminApp());
}
