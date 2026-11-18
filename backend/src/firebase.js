import path from "node:path";
import dotenv from "dotenv";
import { initializeApp, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

dotenv.config({ path: path.resolve(process.cwd(), "backend/.env") });
dotenv.config();

const projectId = process.env.FIREBASE_PROJECT_ID || "lojas-magazine";

const firebaseApp = getApps().length
  ? getApps()[0]
  : initializeApp({ projectId });

export const auth = getAuth(firebaseApp);
