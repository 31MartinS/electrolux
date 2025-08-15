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
  apiKey: "AIzaSyBVdQe3wCl7Myq_yd_Q_SdSn4JKYhLW48A",
  authDomain: "electrolux-bcf6e.firebaseapp.com",
  projectId: "electrolux-bcf6e",
  storageBucket: "electrolux-bcf6e.firebasestorage.app",
  messagingSenderId: "207869138022",
  appId: "1:207869138022:web:922a8c405f3087fcefc9a7"
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