import Formulario from '../components/Formulario'

export default function Home() {
  return (
    <div
      className="relative min-h-screen w-full overflow-hidden bg-[#002B5C]"
      style={{
        // Luces sutiles en esquinas (radiales) para dar profundidad
        backgroundImage: `
          radial-gradient(1000px 700px at -10% -10%, rgba(255,255,255,0.08), transparent 60%),
          radial-gradient(800px 600px at 110% 110%, rgba(255,255,255,0.06), transparent 60%)
        `,
        backgroundBlendMode: 'screen',
      }}
    >
      {/* Trama sutil tipo grid con CSS puro */}
      <div
        className="pointer-events-none absolute inset-0 opacity-15"
        style={{
          backgroundImage: `
            linear-gradient(transparent 95%, rgba(255,255,255,0.08) 96%),
            linear-gradient(90deg, transparent 95%, rgba(255,255,255,0.08) 96%)
          `,
          backgroundSize: '28px 28px, 28px 28px',
        }}
      />

      {/* Gradiente para contraste en el contenido */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#001F44]/80 via-transparent to-[#001F44]/80" />

      {/* Contenido centrado */}
      <div className="relative z-10 mx-auto flex min-h-screen max-w-5xl items-center justify-center px-4">
        <div className="w-full max-w-lg">
          {/* Branding / título de campaña */}
          <div className="mb-6 text-center">
            <span className="inline-block rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/80 backdrop-blur">
              Promoción especial
            </span>
          </div>

          <Formulario />
        </div>
      </div>
    </div>
  )
}
