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
  getDocs,
  runTransaction
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

export function generarPremioAleatorio(excludePremium = false) {
  let rand;
  if (excludePremium) {
    // Si excluimos premiums, caemos en el otro 90% (del 10 al 100)
    rand = 10 + (Math.random() * 90);
  } else {
    rand = Math.random() * 100;
  }
  
  if (rand < 5) return "Tv 43 pulgadas"; // 5% (0 a 5)
  if (rand < 10) return "Minibar"; // 5% (5 a 10)
  if (rand < 30) return "Orden de compra $25"; // 20% (10 a 30)
  if (rand < 60) return "Botella de vino"; // 30% (30 a 60)
  return "Parlante inalámbrico"; // 40% (60 a 100)
}

export async function guardarParticipante({ email, nombre, cedula, celular, aceptaTerminos, aceptaMarketing }) {
  if (!email) throw new Error("Email requerido");
  
  const participanteRef = doc(db, "participantes", email);
  const stockRef = doc(db, "configuracion", "stock");
  
  await runTransaction(db, async (transaction) => {
    // 1. Asignar premio estadístico inicial
    let premioFinal = generarPremioAleatorio();
    const esPremium = premioFinal === "Tv 43 pulgadas" || premioFinal === "Minibar";
    
    // 2. Si es premio grande, comprobar stock
    if (esPremium) {
      const stockDoc = await transaction.get(stockRef);
      if (stockDoc.exists()) {
        const stockData = stockDoc.data();
        const stockActual = stockData[premioFinal] || 0;
        
        if (stockActual > 0) {
          // Hay stock, descontarlo
          transaction.update(stockRef, {
            [premioFinal]: stockActual - 1
          });
        } else {
          // No hay stock de este premio, sortear premio regular base
          premioFinal = generarPremioAleatorio(true);
        }
      } else {
        // Por seguridad, si no existe el documento asignamos premio base
        premioFinal = generarPremioAleatorio(true);
      }
    }
    
    // 3. Escribir datos del participante
    transaction.set(
      participanteRef,
      {
        email,
        nombre: nombre ?? null,
        cedula: cedula ?? null,
        celular: celular ?? null,
        aceptaTerminos: !!aceptaTerminos,
        aceptaMarketing: !!aceptaMarketing,
        premio: premioFinal,
        estadoPremio: "pendiente",
        updatedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
      },
      { merge: true }
    );
  });

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