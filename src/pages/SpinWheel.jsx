import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Confetti from "react-confetti";
import bgDesktop from '../assets/images/Desktop Wallpaper Spinwheel.svg';
import bgMobile from '../assets/images/Mobile Wallpaper Spinwheel.svg';
import { ChefHat, Ticket, Wine, Speaker, CupSoda, Gift, PackageOpen, Sparkles } from 'lucide-react';

/* ─── Configuración de Premios ────────────────────────── */
const PRIZE_INFO = {
  "Cocina": { icon: ChefHat, color: "#011E41" },
  "Orden de compra $25": { icon: Ticket, color: "#0A4F8F" },
  "Botella de vino": { icon: Wine, color: "#5E102B" },
  "Parlante inalámbrico": { icon: Speaker, color: "#2B3C4D" },
  "Tomatodo": { icon: CupSoda, color: "#026B8E" },
};

function getPrizeInfo(premio) {
  return PRIZE_INFO[premio] || { icon: Sparkles, color: "#a8b8c8" };
}

// Simulador de premios para las otras cajas (Fake prizes)
function getRandomFakePrize(exclude) {
  const keys = Object.keys(PRIZE_INFO).filter(p => p !== exclude);
  return keys[Math.floor(Math.random() * keys.length)];
}

/* ─── Modal de premio ─────────────────────────────────── */
function PremioModal({ premio, onHome }) {
  const [wSize, setWSize] = useState({ w: window.innerWidth, h: window.innerHeight });
  const { icon: PrizeIcon, color } = getPrizeInfo(premio);

  useEffect(() => {
    const handle = () => setWSize({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener("resize", handle);
    return () => window.removeEventListener("resize", handle);
  }, []);

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="Premio ganado">
      <Confetti
        width={wSize.w}
        height={wSize.h}
        numberOfPieces={400}
        recycle={false}
        gravity={0.15}
        colors={["#cfd4da", "#5A7184", "#ffffff", color, "#e0e4e8"]}
        style={{ position: "fixed", top: 0, left: 0, zIndex: 1100 }}
      />
      <div className="modal-card">
        <div className="modal-glow" style={{ background: `radial-gradient(circle, ${color}40 0%, transparent 70%)` }} aria-hidden />

        <div className="modal-icon-wrap" style={{ color: color }}>
          <PrizeIcon size={72} strokeWidth={1.5} />
        </div>

        <p className="modal-eyebrow">¡Felicidades!</p>
        <h2 className="modal-title">Has descubierto</h2>
        <p className="modal-prize" style={{ textShadow: `0 0 30px ${color}80` }}>{premio}</p>

        <div className="modal-divider" />

        <div className="modal-actions">
          <button className="modal-btn-primary" onClick={onHome}>
            Continuar
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Página principal (Cajas Sorpresa) ──────────────── */
export default function MysteryBoxes() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  // Estado real de Firebase
  const [premioReal, setPremioReal] = useState(null);
  const [estadoPremio, setEstadoPremio] = useState(null);

  // Estados de interacción UI
  const [selectedBox, setSelectedBox] = useState(null);
  const [opening, setOpening] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const [fakePrizes, setFakePrizes] = useState([]);

  const email = sessionStorage.getItem("emailParticipante");

  useEffect(() => {
    if (!email) {
      navigate("/", { replace: true });
      return;
    }

    // Inicializar data
    import("../services/firebase.js").then(({ obtenerPremio }) => {
      obtenerPremio(email).then((data) => {
        if (!data || !data.premio) {
          navigate("/", { replace: true });
          return;
        }

        setPremioReal(data.premio);
        setEstadoPremio(data.estadoPremio);

        // Si ya lo había abierto antes pero recargó la página
        if (data.estadoPremio === "revelado") {
          setRevealed(true);
          setShowModal(true);
        }

        setLoading(false);
      });
    });
  }, [email, navigate]);

  const handleBoxClick = async (idx) => {
    if (opening || revealed || estadoPremio === "revelado") return;

    setSelectedBox(idx);
    setOpening(true);

    try {
      const { revelarPremio } = await import("../services/firebase.js");
      await revelarPremio(email);
    } catch (err) {
      console.error("Error al revelar premio en DB", err);
    }

    // Generar premios falsos para las demás cajas
    const fakes = Array(5).fill(null).map(() => getRandomFakePrize(premioReal));
    setFakePrizes(fakes);

    // Animación de abrir la caja
    setTimeout(() => {
      setRevealed(true);
      setOpening(false);

      // Mostrar modal final medio segundo más tarde (antes 1500, ahora 2000)
      setTimeout(() => setShowModal(true), 2000);
    }, 1200);
  };

  const handleHome = () => {
    sessionStorage.removeItem("emailParticipante");
    navigate("/", { replace: true });
  };

  if (loading) {
    return <div className="sp-page" style={{ justifyContent: 'center', alignItems: 'center' }}><div className="frm-spinner" style={{ borderColor: 'rgba(255,255,255,0.2)', borderTopColor: '#fff', width: 32, height: 32 }} /></div>;
  }

  return (
    <div className="sp-page">
      <div className="sp-bg" aria-hidden />

      <main className="sp-main">
        <header className="sp-header">
          <span className="sp-badge">✦ Momento de la verdad ✦</span>
          <h1 className="sp-title">
            Elige tu <span className="sp-title-accent">Caja Sorpresa</span>
          </h1>
          <p className="sp-subtitle">
            ¡Toca una caja para descubrir tu premio!
          </p>
        </header>

        {/* CONTENEDOR GRID DE CAJAS */}
        <section className="boxes-container">
          {[0, 1, 2, 3, 4].map((idx) => {
            const isSelected = selectedBox === idx;
            const isOther = selectedBox !== null && !isSelected;

            // Si está revelado, mostramos premio. Si no, es una caja
            let IconComponent = Gift;
            let iconColor = "#fff";
            let label = "";

            if (revealed) {
              if (isSelected) {
                const info = getPrizeInfo(premioReal);
                IconComponent = info.icon;
                iconColor = info.color;
                label = premioReal;
              } else {
                const fake = fakePrizes[idx];
                const info = getPrizeInfo(fake);
                IconComponent = info.icon;
                iconColor = info.color;
                label = fake;
              }
            } else if (isSelected && opening) {
              IconComponent = PackageOpen;
            }

            return (
              <button
                key={idx}
                className={`mystery-box ${isSelected && opening ? 'box-wobble' : ''} ${revealed && isSelected ? 'box-revealed-winner' : ''} ${revealed && isOther ? 'box-revealed-loser' : ''} ${isOther && !revealed ? 'box-dimmed' : ''}`}
                onClick={() => handleBoxClick(idx)}
                disabled={opening || revealed || estadoPremio === "revelado"}
                aria-label={`Abrir caja misteriosa ${idx + 1}`}
              >
                <div className="box-inner">
                  <div className="box-icon" style={{ color: iconColor }}>
                    <IconComponent size={revealed ? 48 : 56} strokeWidth={1.5} />
                  </div>
                  {revealed && (
                    <div className="box-label" style={{ color: isSelected ? iconColor : 'rgba(255,255,255,0.5)' }}>
                      {label}
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </section>

        <p className="sp-hint" aria-live="polite">
          {opening ? (
            <span className="sp-hint--spin">Descubriendo...</span>
          ) : revealed ? (
            "¡Sorpresa revelada!"
          ) : (
            "Presiona solo una caja"
          )}
        </p>
      </main>

      {/* MODAL FINAL */}
      {showModal && premioReal && (
        <PremioModal premio={premioReal} onHome={handleHome} />
      )}

      {/* ── Estilos ── */}
      <style>{`
        html, body { overflow: hidden; }

        .sp-page {
          position: fixed;
          inset: 0;
          background: #0C2340;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .sp-bg {
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 0;
          background-image: url("${bgDesktop}");
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
        }

        @media (max-width: 768px) {
          .sp-bg { background-image: url("${bgMobile}"); }
          .sp-main { 
            padding-top: clamp(120px, 18vh, 160px); 
            gap: 15px;
          }
          .boxes-container {
            max-width: 500px;
            gap: 8px;
            width: 100%;
          }
          .mystery-box {
            /* Ancho blindado a 3 columnas con el nuevo gap de 8px */
            width: calc(33.333% - 8px);
            max-width: 120px;
            /* Altura recortada para asegurar que el bloque compacto de cajas no toque el pie de página */
            height: clamp(85px, 22vw, 110px);
          }
        }

        .sp-main {
          position: relative;
          z-index: 1;
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-start;
          padding-top: clamp(60px, 10vh, 120px);
          gap: clamp(20px, 4vh, 40px);
          padding-left: 20px;
          padding-right: 20px;
          padding-bottom: 20px;
          overflow-y: auto;
        }

        /* Header */
        .sp-header { text-align: center; }
        .sp-badge {
          display: inline-flex;
          gap: 6px;
          background: rgba(1, 30, 65, 0.08);
          border: 1px solid rgba(1, 30, 65, 0.15);
          color: #011E41;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: .13em;
          text-transform: uppercase;
          padding: 4px 13px;
          border-radius: 100px;
          margin-bottom: 14px;
        }
        .sp-title {
          font-family: 'ElectroluxSans', system-ui, sans-serif;
          font-size: clamp(1.8rem, 4vw, 2.8rem);
          font-weight: 700;
          color: #011E41;
          margin: 0 0 10px;
        }
        .sp-title-accent {
          background: linear-gradient(135deg, #011E41, #0a4f8f);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .sp-subtitle {
          color: rgba(1, 30, 65, 0.7);
          font-size: 1rem;
          margin: 0;
          font-weight: 500;
        }

        /* ═══════ GRID DE CAJAS ═══════ */
        .boxes-container {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: clamp(12px, 3vw, 24px);
          max-width: 900px;
          perspective: 1000px; /* Para efecto 3D si se desea */
        }

        .mystery-box {
          background: rgba(255,255,255,.05);
          border: 1px solid rgba(255,255,255,.15);
          border-radius: 20px;
          backdrop-filter: blur(12px);
          width: clamp(100px, 15vw, 140px);
          height: clamp(130px, 20vw, 180px);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
          box-shadow: 0 10px 30px rgba(0,0,0,0.2);
          position: relative;
          overflow: hidden;
        }

        /* Pseudo-glow de caja lista */
        .mystery-box::before {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.1), transparent);
          opacity: 0;
          transition: opacity 0.3s;
        }

        .mystery-box:hover:not(:disabled) {
          transform: translateY(-8px) scale(1.05);
          border-color: rgba(255,255,255,0.4);
          box-shadow: 0 20px 40px rgba(0,0,0,0.3), 0 0 20px rgba(255,255,255,0.1);
        }

        .mystery-box:hover:not(:disabled)::before {
          opacity: 1;
        }

        .box-inner {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          position: relative;
          z-index: 1;
        }

        .box-icon {
          transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
          filter: drop-shadow(0 4px 12px rgba(0,0,0,0.4));
        }

        .box-label {
          font-family: 'ElectroluxSans', system-ui, sans-serif;
          font-size: 0.85rem;
          font-weight: 600;
          text-align: center;
          line-height: 1.2;
          padding: 0 8px;
          animation: fade-up 0.5s ease forwards;
        }

        @keyframes fade-up {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* ── Estados al hacer click ── */

        .box-dimmed {
          opacity: 0.4;
          transform: scale(0.95);
          pointer-events: none;
        }

        .box-wobble {
          animation: intense-wobble 0.6s ease-in-out infinite alternate;
          border-color: #fff;
          background: rgba(255,255,255,0.15);
          z-index: 10;
          pointer-events: none;
        }

        @keyframes intense-wobble {
          0% { transform: translateY(0) rotate(-4deg) scale(1.1); }
          100% { transform: translateY(-10px) rotate(4deg) scale(1.1); }
        }

        .box-revealed-winner {
          transform: scale(1.15);
          background: rgba(255,255,255,0.12);
          border-color: rgba(255,255,255,0.6);
          box-shadow: 0 0 50px rgba(255,255,255,0.2);
          z-index: 10;
        }
        
        .box-revealed-winner .box-icon {
          transform: scale(1.2);
        }

        .box-revealed-loser {
          opacity: 0.35;
          transform: scale(0.9);
          filter: grayscale(1);
          background: rgba(255,255,255,0.02);
        }

        .sp-hint { margin-top: 10px; color: rgba(1, 30, 65, 0.6); font-weight: 600; font-size: 0.95rem; }
        .sp-hint--spin { color: #011E41; animation: pulse 1s infinite alternate; }

        @keyframes pulse { from { opacity: 0.5; } to { opacity: 1; } }

        /* ══════ MODAL ═══════ */
        .modal-overlay {
          position: fixed; inset: 0; z-index: 1000;
          display: flex; align-items: center; justify-content: center; padding: 20px;
          background: rgba(8, 20, 40, .8); backdrop-filter: blur(16px);
          animation: overlay-in .35s forwards;
        }
        @keyframes overlay-in { from{opacity:0} to{opacity:1} }

        .modal-card {
          position: relative; background: rgba(255,255,255,.07); border: 1px solid rgba(255,255,255,.14);
          backdrop-filter: blur(24px); border-radius: 28px; padding: 40px;
          text-align: center; max-width: 440px; width: 100%; box-shadow: 0 24px 80px rgba(0,0,0,.5);
          animation: card-in .55s cubic-bezier(.34,1.56,.64,1) forwards; overflow: hidden;
        }
        @keyframes card-in { from{opacity:0; transform:scale(.8) translateY(20px)} to{opacity:1; transform:scale(1) translateY(0)} }

        .modal-glow {
          position: absolute; width: 300px; height: 300px; border-radius: 50%;
          top: 50%; left: 50%; transform: translate(-50%, -50%);
          filter: blur(40px); pointer-events: none; z-index: 0;
          animation: glow-pulse 2.5s infinite alternate;
        }
        @keyframes glow-pulse { from{opacity:.6; transform:translate(-50%,-50%) scale(1)} to{opacity:1; transform:translate(-50%,-50%) scale(1.2)} }

        .modal-card > *:not(.modal-glow) { position: relative; z-index: 1; }

        .modal-icon-wrap {
          margin-bottom: 20px; display: inline-block;
          animation: icon-pop .8s cubic-bezier(.34,1.56,.64,1) .1s both;
          filter: drop-shadow(0 10px 20px rgba(0,0,0,0.3));
        }
        @keyframes icon-pop { from{transform:scale(0) rotate(-20deg); opacity:0} to{transform:scale(1) rotate(0deg); opacity:1} }

        .modal-eyebrow { color: rgba(255,255,255,.7); font-size: 0.9rem; font-weight: 500; margin: 0 0 6px; text-transform: uppercase; letter-spacing: 0.1em; }
        .modal-title { font-family:'ElectroluxSans', system-ui, sans-serif; font-size: 1.2rem; color: #fff; margin: 0 0 10px; }
        .modal-prize { font-family:'ElectroluxSans', system-ui, sans-serif; font-size: 1.8rem; font-weight: 800; color: #fff; text-transform: uppercase; margin: 0 0 24px; }
        .modal-divider { width: 50px; height: 2px; background: rgba(255,255,255,.2); margin: 0 auto 24px; }

        .modal-btn-primary {
          width: 100%; padding: 14px 28px; border-radius: 50px;
          background: #fff; color: #0C2340; border: none;
          font-family: 'ElectroluxSans', system-ui, sans-serif; font-size: 16px; font-weight: 700;
          cursor: pointer; transition: all .2s ease; box-shadow: 0 6px 20px rgba(255,255,255,0.2);
        }
        .modal-btn-primary:hover { transform: translateY(-2px); box-shadow: 0 10px 30px rgba(255,255,255,0.3); }
        
        .frm-spinner {
          display: inline-block; width: 16px; height: 16px;
          border: 2px solid rgba(255,255,255,.3); border-top-color: #fff;
          border-radius: 50%; animation: frm-spin .7s linear infinite;
        }
        @keyframes frm-spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
