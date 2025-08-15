import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Ruleta from "../components/Ruleta.jsx";
import Confetti from "react-confetti";
import { asignarPremio, obtenerPremio } from "../services/firebase.js";

const FALLBACK_PREMIOS = [
  "ELECTROMENOR",
  "DETERGENTE",
  "REGALO SORPRESA",
  "REGALO SORPRESA",
  "REGALO SORPRESA",
  "DETERGENTE"
];

export default function SpinWheel() {
  const navigate = useNavigate();
  const [spinning, setSpinning] = useState(false);
  const [premioFinal, setPremioFinal] = useState(null);
  const [bloqueado, setBloqueado] = useState(false); // si ya tiene premio

  const email = sessionStorage.getItem("emailParticipante");

  useEffect(() => {
    if (!email) {
      navigate("/", { replace: true });
      return;
    }
    // Verifica si ya tiene premio para bloquear el giro
    (async () => {
      const ya = await obtenerPremio(email);
      if (ya) {
        setPremioFinal(ya);
        setBloqueado(true);
      }
    })();
  }, [email, navigate]);

  const premios = useMemo(() => FALLBACK_PREMIOS, []);

  const handleFinish = async (premio, idx) => {
    try {
      // Persistir en Firestore
      const res = await asignarPremio(email, premio, idx);
      if (res?.yaTenia) {
        setBloqueado(true);
        setPremioFinal(res.premio);
      } else {
        setPremioFinal(premio);
        setBloqueado(true); // después de ganar, bloqueamos
      }
    } catch (e) {
      // Si falla el guardado, permitimos reintentar el giro
      console.error(e);
      alert("No se pudo guardar el premio. Intenta nuevamente.");
      setBloqueado(false);
    } finally {
      setSpinning(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0C2340] text-white p-4">
      {premioFinal && <Confetti numberOfPieces={250} recycle={false} />}
      <div className="w-full max-w-3xl">
        <h1 className="text-center text-2xl font-semibold mb-6">
          ¡Gira y descubre tu premio!
        </h1>

        <div className="mx-auto max-w-xl">
          <Ruleta
            premios={premios}
            disabled={spinning || bloqueado}
            onStart={() => setSpinning(true)}
            onFinish={handleFinish}
          />
        </div>

        <div className="mt-6 text-center">
          {premioFinal ? (
            <div className="inline-block rounded-xl px-4 py-3 bg-white/10 backdrop-blur">
              <p className="text-sm opacity-80">Premio asignado</p>
              <p className="text-lg font-bold">{premioFinal}</p>
              <button
                className="mt-4 rounded-lg bg-white/90 text-black px-4 py-2 hover:bg-white"
                onClick={() => navigate("/", { replace: true })}
              >
                Volver al inicio
              </button>
            </div>
          ) : (
            <p className="opacity-80">
              {bloqueado
                ? "Este correo ya tiene un premio asignado."
                : "Presiona el botón para girar."}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
