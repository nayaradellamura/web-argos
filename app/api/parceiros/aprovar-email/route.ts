import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminAuth, getAdminDb } from "@/lib/firebase-admin";

export const runtime = "nodejs";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function generateTemporaryPassword() {
  const random = crypto.randomUUID().replaceAll("-", "");
  return `Argos@${random.slice(0, 12)}`;
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    route: "/api/parceiros/aprovar-email",
    message: "Use POST para aprovar parceiro por e-mail.",
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = normalizeEmail(body.email ?? "");

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { error: "E-mail inválido." },
        { status: 400 },
      );
    }

    const adminAuth = getAdminAuth();
    const adminDb = getAdminDb();

    /*
     * REGRA IMPORTANTE:
     *
     * O documento principal do parceiro deve continuar sendo:
     *
     *   users/{email_normalizado}
     *
     * O UID do Firebase Authentication deve ficar salvo apenas nos campos:
     *
     *   uid
     *   authUid
     *
     * Não criamos users/{uid} e não apagamos users/{email}.
     */
    const userRef = adminDb.collection("users").doc(email);
    const userSnap = await userRef.get();

    if (!userSnap.exists) {
      return NextResponse.json(
        { error: "Solicitação de parceiro não encontrada em users/{email}." },
        { status: 404 },
      );
    }

    const userData = userSnap.data() ?? {};

    const existingTipoAcesso = userData.tipoAcesso?.toString();
    const existingProvider = userData.provider?.toString();

    if (
      existingTipoAcesso &&
      existingTipoAcesso !== "email_senha" &&
      existingProvider !== "password"
    ) {
      return NextResponse.json(
        {
          error:
            "Este e-mail está vinculado a outro tipo de acesso. Não é possível aprovar como e-mail/senha.",
        },
        { status: 409 },
      );
    }

    let userRecord;

    try {
      userRecord = await adminAuth.getUserByEmail(email);

      if (userRecord.disabled) {
        userRecord = await adminAuth.updateUser(userRecord.uid, {
          disabled: false,
        });
      }
    } catch {
      userRecord = await adminAuth.createUser({
        email,
        emailVerified: false,
        password: generateTemporaryPassword(),
        disabled: false,
        displayName:
          userData.nome?.toString() ||
          userData.displayName?.toString() ||
          undefined,
        photoURL:
          userData.photoURL?.toString().trim() ||
          undefined,
      });
    }

    const resetLink = await adminAuth.generatePasswordResetLink(email);

    await userRef.set(
      {
        uid: userRecord.uid,
        authUid: userRecord.uid,
        email,
        emailKey: email,

        nome:
          userData.nome?.toString() ||
          userData.displayName?.toString() ||
          userRecord.displayName ||
          "",
        displayName:
          userData.displayName?.toString() ||
          userData.nome?.toString() ||
          userRecord.displayName ||
          "",

        photoURL:
          userData.photoURL?.toString() ||
          userRecord.photoURL ||
          "",

        provider: "password",
        tipoAcesso: "email_senha",
        status: "ativo",

        aprovadoEm: FieldValue.serverTimestamp(),
        atualizadoEm: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

    const updatedSnap = await userRef.get();

    return NextResponse.json({
      success: true,
      message: "Parceiro aprovado mantendo o ID do documento como e-mail.",
      uid: userRecord.uid,
      authUid: userRecord.uid,
      email,
      documentId: email,
      resetLink,
      data: {
        id: updatedSnap.id,
        ...updatedSnap.data(),
      },
    });
  } catch (error) {
    console.error("Erro ao aprovar parceiro por e-mail:", error);

    const message =
      error instanceof Error
        ? error.message
        : "Erro desconhecido ao aprovar parceiro por e-mail.";

    return NextResponse.json(
      {
        error: "Erro ao aprovar parceiro por e-mail.",
        details: message,
      },
      { status: 500 },
    );
  }
}
