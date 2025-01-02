import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

export const ALLOWED_EMAILS = [
  "chalabi@chandrastation.com",
  "bailey@chandrastation.com",
  "blockchainthomas@gmail.com",
];

export const SESSION_TIMEOUT = 60 * 60 * 1000;

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app); 