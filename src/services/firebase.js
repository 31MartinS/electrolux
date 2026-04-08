// src/services/firebase.js
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  collection,
  query,
  where,
  getDocs
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
}

// Inicialización estricta para producción. Fallará útilmente si no hay variables de entorno en Vercel.
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };

export function generarPremioAleatorio() {
  const rand = Math.random() * 100;
  if (rand < 3) return "Minibar"; // 3%
  if (rand < 8) return "Orden de compra $25"; // 5% (3 a 8)
  if (rand < 18) return "Botella de vino"; // 10% (8 a 18)
  if (rand < 38) return "Parlante inalámbrico"; // 20% (18 a 38)
  return "Tomatodo"; // 62% (38 a 100)
}

export async function guardarParticipante({ email, nombre, cedula, celular, aceptaTerminos, aceptaMarketing }) {
  const premioAsignado = generarPremioAleatorio();
  
  if (!email) throw new Error("Email requerido");
  
  const ref = doc(db, "participantes", email);
  await setDoc(
    ref,
    {
      email,
      nombre: nombre ?? null,
      cedula: cedula ?? null,
      celular: celular ?? null,
      aceptaTerminos: !!aceptaTerminos,
      aceptaMarketing: !!aceptaMarketing,
      premio: premioAsignado,
      estadoPremio: "pendiente",
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    },
    { merge: true }
  );
  return { ok: true };
}

export async function obtenerPremio(email) {
  if (!email) return { premio: null, estadoPremio: null };
  const ref = doc(db, "participantes", email);
  const snap = await getDoc(ref);
  if (!snap.exists()) return { premio: null, estadoPremio: null };
  
  return {
    premio: snap.data()?.premio ?? null,
    estadoPremio: snap.data()?.estadoPremio ?? null
  };
}

export async function revelarPremio(email) {
  if (!email) throw new Error("Email requerido para revelar premio");

  const ref = doc(db, "participantes", email);
  await setDoc(
    ref,
    {
      estadoPremio: "revelado",
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  return { ok: true };
}

export async function validarParticipanteExistente(email, cedula) {
  if (!email || !cedula) return { existe: false };
  
  const refEmail = doc(db, "participantes", email);
  const snapEmail = await getDoc(refEmail);
  if (snapEmail.exists()) return { existe: true, field: 'correo' };

  const qCedula = query(collection(db, "participantes"), where("cedula", "==", cedula));
  const snapCedula = await getDocs(qCedula);
  if (!snapCedula.empty) return { existe: true, field: 'cédula' };

  return { existe: false };
}