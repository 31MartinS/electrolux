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

  // refs para los sonidos
  const spinSoundRef = useRef(null);
  const endSoundRef = useRef(null);

  const n = Math.max(1, premios.length);
  const delta = 360 / n;

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

    // 🎵 Reproducir sonido de giro
    if (spinSoundRef.current) {
      spinSoundRef.current.currentTime = 0;
      spinSoundRef.current.play();
    }

    const idx = Math.floor(Math.random() * n);
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

      // 🎵 Reproducir sonido de final + confeti (confeti lo manejas en SpinWheel.jsx con premioFinal)
      if (endSoundRef.current) {
        endSoundRef.current.currentTime = 0;
        endSoundRef.current.play();
      }

      onFinish(premios[idx], idx);
    };
    wheel.addEventListener("animationend", onEnd);
  };

  return (
    <div className="ruleta-wrapper">
      {/* elementos de audio ocultos */}
      <audio ref={spinSoundRef} src="/audio/rulet.mp3" preload="auto" />
      <audio ref={endSoundRef} src="/audio/win.mp3" preload="auto" />

      <div className="ruleta-indicador" aria-hidden />
      <div className="ruleta" ref={wheelRef} style={{ backgroundImage: gradiente }}>
        {premios.map((p, i) => {
          const rot = i * delta + delta / 2;
          return (
            <div
              key={`${p}-${i}`}
              className="ruleta-label"
              style={{
                transform: `rotate(${rot}deg) translateY(calc(-1 * var(--label-radius))) rotate(${-rot}deg)`,
              }}
            >
              <span className="ruleta-label-text">{p}</span>
            </div>
          );
        })}
        <div className="ruleta-hub">
          <img src={logoSrc} alt="Logo" onError={(e) => (e.currentTarget.style.display = "none")} />
        </div>
      </div>

      <button className="ruleta-boton" onClick={spin} disabled={girando || disabled}>
        {girando ? "Girando..." : "¡Girar!"}
      </button>
    </div>
  );
}
