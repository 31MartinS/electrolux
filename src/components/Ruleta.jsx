import { useMemo, useRef, useState } from "react";
import "../styles/ruleta.css";

export default function Ruleta({
  premios = [],
  onStart = () => {},
  onFinish = () => {},
  disabled = false,
  logoSrc = "/assets/electrolux-logo.svg",
}) {
  const wheelRef = useRef(null);
  const [girando, setGirando] = useState(false);

  const n = Math.max(1, premios.length);
  const delta = 360 / n;

  // Gradiente por sectores (azules alternados)
  const gradiente = useMemo(() => {
    if (n === 0) return undefined;
    const pal = ["#0C2340", "#5A7184"];
    const stops = [];
    for (let i = 0; i < n; i++) {
      const c = pal[i % pal.length];
      stops.push(`${c} ${i * delta}deg ${(i + 1) * delta}deg`);
    }
    return `conic-gradient(${stops.join(",")})`;
  }, [n, delta]);

  const spin = () => {
    if (girando || disabled || n === 0) return;
    setGirando(true);
    onStart();

    // índice ganador
    const idx = Math.floor(Math.random() * n);

    // Alinear el centro del sector ganador con el indicador superior (triángulo apuntando hacia abajo)
    const objetivo = 360 * 6 + (360 - (idx * delta + delta / 2));

    const wheel = wheelRef.current;
    wheel.style.setProperty("--target-rotation", `${objetivo}deg`);
    wheel.classList.remove("spin");
    // reflow
    // eslint-disable-next-line no-unused-expressions
    wheel.offsetWidth;
    wheel.classList.add("spin");

    const onEnd = () => {
      wheel.removeEventListener("animationend", onEnd);
      setGirando(false);
      onFinish(premios[idx], idx);
    };
    wheel.addEventListener("animationend", onEnd);
  };

  return (
    <div className="ruleta-wrapper">
      {/* Indicador (punta hacia abajo) */}
      <div className="ruleta-indicador" aria-hidden />

      {/* Disco */}
      <div className="ruleta" ref={wheelRef} style={{ backgroundImage: gradiente }}>
        {/* Etiquetas dentro de cada porción */}
        {premios.map((p, i) => {
          const rot = i * delta + delta / 2; // centro del sector
          return (
            <div
              key={`${p}-${i}`}
              className="ruleta-label"
              style={{
                // 1) giramos al centro del sector
                // 2) empujamos la etiqueta hacia afuera siguiendo el radio
                // 3) “des-rotamos” el texto para que quede horizontal
                transform: `rotate(${rot}deg) translateY(calc(-1 * var(--label-radius))) rotate(${-rot}deg)`,
              }}
            >
              <span className="ruleta-label-text">{p}</span>
            </div>
          );
        })}

        {/* Logo central */}
        <div className="ruleta-hub">
          <img
            src={logoSrc}
            alt="Logo"
            onError={(e) => (e.currentTarget.style.display = "none")}
          />
        </div>
      </div>

      <button className="ruleta-boton" onClick={spin} disabled={girando || disabled}>
        {girando ? "Girando..." : "¡Girar!"}
      </button>
    </div>
  );
}
