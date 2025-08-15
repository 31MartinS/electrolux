// src/services/firebase.js
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  doc,
  getDoc,          // ← IMPORTA ESTO
  setDoc,
  serverTimestamp,
  collection,
  addDoc,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
}


const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

export async function guardarParticipante({ email, nombre, cedula, celular }) {
  if (!email) throw new Error("Email requerido");
  const ref = doc(db, "participantes", email);
  await setDoc(
    ref,
    {
      email,
      nombre: nombre ?? null,
      cedula: cedula ?? null,
      celular: celular ?? null,
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    },
    { merge: true }
  );
  return { ok: true };
}

export async function obtenerPremio(email) {
  if (!email) return null;
  const ref = doc(db, "participantes", email);
  const snap = await getDoc(ref);   // ← YA DEFINIDO
  if (!snap.exists()) return null;
  return snap.data()?.premio ?? null;
}

export async function asignarPremio(email, premio, prizeIndex) {
  if (!email) throw new Error("Email requerido para asignar premio");
  if (!premio) throw new Error("Premio inválido");

  const ref = doc(db, "participantes", email);
  const snap = await getDoc(ref);

  if (snap.exists() && snap.data()?.premio) {
    return { ok: true, yaTenia: true, premio: snap.data().premio };
  }

  await setDoc(
    ref,
    {
      email,
      premio,
      prizeIndex: Number.isFinite(prizeIndex) ? prizeIndex : null,
      spinAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  await addDoc(collection(db, "spins"), {
    email,
    premio,
    prizeIndex: Number.isFinite(prizeIndex) ? prizeIndex : null,
    at: serverTimestamp(),
  });

  return { ok: true, yaTenia: false, premio };
}