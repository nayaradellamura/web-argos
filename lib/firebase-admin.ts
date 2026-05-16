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

// Importa o JSON diretamente (ajuste o caminho se o JSON estiver em outra pasta)
// Assumindo que o JSON está na raiz do projeto (uma pasta para trás da lib)
import serviceAccount from "../firebase-credentials.json";

function getAdminApp(): App {
  if (getApps().length > 0) {
    return getApp();
  }

  // O REPLACE mágico que garante que as quebras de linha sejam interpretadas corretamente
  const privateKey = serviceAccount.private_key.replace(/\\n/g, "\n");

  return initializeApp({
    credential: cert({
      projectId: serviceAccount.project_id,
      clientEmail: serviceAccount.client_email,
      privateKey: privateKey,
    }),
  });
}

export function getAdminAuth() {
  return getAuth(getAdminApp());
}

export function getAdminDb() {
  return getFirestore(getAdminApp());
}
