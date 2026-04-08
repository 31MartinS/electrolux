import Formulario from '../components/Formulario'
import bgDesktop from '../assets/images/Desktop Wallpaper.svg'
import bgMobile from '../assets/images/Mobile Wallpaper.svg'
export default function Home() {
  return (
    <div className="home-page">
      {/* Capas de fondo */}
      <div className="home-bg" aria-hidden />

      {/* Contenido centrado */}
      <main className="home-main">
        <Formulario />
      </main>

      <style>{`
        html, body { overflow: hidden; }

        .home-page {
          position: fixed;
          inset: 0;
          background: #0C2340;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        /* Fondo */
        .home-bg {
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
          .home-bg {
            background-image: url("${bgMobile}");
          }
        }

        .home-main {
          position: relative;
          z-index: 1;
          flex: 1;
          display: flex;
          align-items: flex-start;
          justify-content: center;
          padding: clamp(16px, 3vw, 32px);
          overflow-y: auto;
        }
      `}</style>
    </div>
  )
}
