// Firebase Admin SDK - Para usar en servidor (API routes, server components)
// Para habilitar esto, instala: npm install firebase-admin
// Luego descarga la Service Account Key desde Firebase Console → Project Settings → Service Accounts
// y añadela como FIREBASE_ADMIN_SDK_KEY en .env.local

// Por ahora, este archivo está comentado. Descomenta cuando necesites funcionalidades de servidor.

/*
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

const firebaseAdminConfig = {
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
};

let adminApp = getApps().find((app) => app.name === "firebase-admin");

if (!adminApp && typeof process !== "undefined" && process.env.FIREBASE_ADMIN_SDK_KEY) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_SDK_KEY);
  
  adminApp = initializeApp(
    {
      credential: cert(serviceAccount),
      projectId: firebaseAdminConfig.projectId,
    },
    "firebase-admin"
  );
}

export const adminAuth = adminApp ? getAuth(adminApp) : null;
export const adminDb = adminApp ? getFirestore(adminApp) : null;
export const adminStorage = adminApp ? getStorage(adminApp) : null;

export default adminApp;
*/

export {};
