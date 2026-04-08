// src/components/Formulario.jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { guardarParticipante, validarParticipanteExistente } from '../services/firebase'

/* Campos del formulario */
const FIELDS = [
  {
    name: 'nombre',
    label: 'Nombre y Apellido',
    type: 'text',
    inputMode: undefined,
    autoComplete: 'name',
    icon: '👤',
  },
  {
    name: 'cedula',
    label: 'Cédula de identidad',
    type: 'text',
    inputMode: 'numeric',
    autoComplete: 'off',
    icon: '🪪',
  },
  {
    name: 'celular',
    label: 'Celular (09XXXXXXXX)',
    type: 'tel',
    inputMode: 'numeric',
    autoComplete: 'tel',
    icon: '📱',
  },
  {
    name: 'email',
    label: 'Correo electrónico',
    type: 'email',
    inputMode: undefined,
    autoComplete: 'email',
    icon: '✉️',
  },
]

export default function Formulario() {
  const navigate = useNavigate()

  const [form, setForm] = useState({ nombre: '', cedula: '', celular: '', email: '' })
  const [aceptaTerminos, setAceptaTerminos] = useState(false)
  const [aceptaMarketing, setAceptaMarketing] = useState(false)
  const [touched, setTouched] = useState({})
  const [loading, setLoading] = useState(false)
  const [ok, setOk] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  /* ── Validaciones ── */
  const validarNombre  = (v) => /^([A-Za-zÁÉÍÓÚáéíóúÑñ]{2,})(\s[A-Za-zÁÉÍÓÚáéíóúÑñ]{2,})+$/.test(v.trim())
  const validarCedula  = (v) => /^\d{10}$/.test(v)
  const validarCelular = (v) => /^09\d{8}$/.test(v)
  const validarEmail   = (v) => /^[a-zA-Z][a-zA-Z0-9._%+-]*@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(v)

  const validators = { validarNombre, validarCedula, validarCelular, validarEmail }

  const getError = (name, value) => {
    if (!value) return 'Requerido'
    const msgs = {
      nombre:  'Ingresa nombre y apellido válidos',
      cedula:  'Cédula de 10 dígitos',
      celular: 'Formato: 09XXXXXXXX',
      email:   'Correo inválido',
    }
    const fn = validators[`validar${name.charAt(0).toUpperCase() + name.slice(1)}`]
    return fn(value) ? '' : msgs[name]
  }

  const errors  = Object.fromEntries(FIELDS.map(f => [f.name, getError(f.name, form[f.name])]))
  const isFieldsValid = FIELDS.every(f => !errors[f.name])
  const isValid = isFieldsValid && aceptaTerminos

  const onChange = (e) => {
    const { name, value } = e.target
    const clean = (name === 'cedula' || name === 'celular')
      ? value.replace(/[^\d]/g, '').slice(0, 10)
      : value
    setForm(s => ({ ...s, [name]: clean }))
  }

  const onBlur = (e) => setTouched(t => ({ ...t, [e.target.name]: true }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setTouched({ nombre: true, cedula: true, celular: true, email: true })
    setErrorMsg('')
    if (!isValid) return

    try {
      setLoading(true)
      
      const payload = {
        nombre: form.nombre.trim(),
        cedula: form.cedula.trim(),
        celular: form.celular.trim(),
        email: form.email.trim().toLowerCase(),
        aceptaTerminos,
        aceptaMarketing,
      }

      // Validar que no exista ya el correo o la cédula
      const validacion = await validarParticipanteExistente(payload.email, payload.cedula);
      if (validacion.existe) {
        setErrorMsg(`Este ${validacion.field} ya ha sido registrado previamente.`);
        setLoading(false);
        return;
      }
      
      // Guardar en Firestore Firebase
      await guardarParticipante(payload)
      // Guardar email temporalmente para vincularlo al premio en la página de la ruleta
      sessionStorage.setItem('emailParticipante', payload.email)

      setOk(true)
      setTimeout(() => navigate('/ruleta', { replace: true }), 700)
    } catch (err) {
      console.error(err)
      setErrorMsg('Ocurrió un error al registrar. Revisa tu conexión.')
    } finally {
      if (!ok) setLoading(false)
    }
  }

  /* Progreso: cuántos campos válidos */
  const progress = FIELDS.filter(f => !getError(f.name, form[f.name])).length
  const pct = Math.round((progress / FIELDS.length) * 100)

  return (
    <div className="frm-wrap">
      {/* Card */}
      <div className="frm-card">

        {/* Contenido */}        {/* Cabecera */}
        <header className="frm-header">
          <span className="frm-badge">✦ Promoción Exclusiva ✦</span>
          <h1 className="frm-title">
            ¡Regístrate y<br />
            <span className="frm-title-accent">descubre tu premio!</span>
          </h1>
          <p className="frm-subtitle">
            Completa tus datos para descubrir tu premio
          </p>
        </header>

        {/* Barra de progreso */}
        <div className="frm-progress-wrap" aria-label={`${pct}% completado`}>
          <div className="frm-progress-track">
            <div className="frm-progress-bar" style={{ width: `${pct}%` }} />
          </div>
          <span className="frm-progress-label">{pct}%</span>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} noValidate className="frm-form">
          {FIELDS.map((field) => {
            const err    = errors[field.name]
            const hasErr = touched[field.name] && err
            const isDone = !getError(field.name, form[field.name])

            return (
              <div key={field.name} className="frm-field">
                <div className={`frm-input-wrap ${hasErr ? 'frm-input-wrap--err' : ''} ${isDone ? 'frm-input-wrap--ok' : ''}`}>
                  {/* Ícono izquierdo */}
                  <span className="frm-input-icon" aria-hidden>{field.icon}</span>

                  <div className="frm-input-inner">
                    <label htmlFor={field.name} className="frm-label">
                      {field.label}
                    </label>
                    <input
                      id={field.name}
                      name={field.name}
                      type={field.type}
                      inputMode={field.inputMode}
                      autoComplete={field.autoComplete}
                      value={form[field.name]}
                      onChange={onChange}
                      onBlur={onBlur}
                      placeholder={field.label}
                      className="frm-input"
                      aria-invalid={!!hasErr}
                      aria-describedby={hasErr ? `${field.name}-err` : undefined}
                    />
                  </div>

                  {/* Check de validación */}
                  <span className={`frm-input-status ${isDone ? 'frm-input-status--ok' : ''}`} aria-hidden>
                    {isDone ? '✓' : ''}
                  </span>
                </div>

                {hasErr && (
                  <p id={`${field.name}-err`} className="frm-error" role="alert">
                    ⚠ {err}
                  </p>
                )}
              </div>
            )
          })}

          {/* Checkboxes de Términos */}
          <div className="frm-terms">
            <label className="frm-terms-label">
              <input
                type="checkbox"
                className="frm-terms-checkbox"
                checked={aceptaTerminos}
                onChange={(e) => setAceptaTerminos(e.target.checked)}
              />
              <span className="frm-terms-text">
                He leído y acepto la <a href="https://www.electrolux.com.ec/politica-de-privacidad" target="_blank" rel="noopener noreferrer">Política de Privacidad</a> y autorizo de forma expresa a la empresa organizadora a tratar mis datos personales (nombre, cédula, teléfono y correo electrónico) con la finalidad de gestionar mi participación en la promoción, contactarme en caso de resultar ganador y enviarme información comercial, promocional y publicitaria. Declaro que los datos proporcionados son verídicos y que soy mayor de edad. Asimismo, entiendo que puedo ejercer mis derechos de acceso, rectificación, eliminación y oposición al tratamiento de mis datos personales conforme a la normativa vigente en Ecuador.
              </span>
            </label>

            <label className="frm-terms-label" style={{ marginTop: '12px' }}>
              <input
                type="checkbox"
                className="frm-terms-checkbox"
                checked={aceptaMarketing}
                onChange={(e) => setAceptaMarketing(e.target.checked)}
              />
              <span className="frm-terms-text">
                Deseo recibir información sobre promociones, ofertas y novedades.
              </span>
            </label>
          </div>

          {/* Botón submit */}
          <button
            type="submit"
            disabled={!isValid || loading}
            className={`frm-btn ${loading ? 'frm-btn--loading' : ''}`}
          >
            {loading ? (
              <>
                <span className="frm-spinner" aria-hidden />
                Preparando...
              </>
            ) : (
              <>
                <span className="frm-btn-icon" aria-hidden>🎁</span>
                Descubrir mi premio
              </>
            )}
          </button>

          {/* Error de Red/Firebase */}
          {errorMsg && (
            <div className="frm-error-box" role="alert">
              ⚠ {errorMsg}
            </div>
          )}

          {/* Éxito */}
          {ok && (
            <div className="frm-success" role="status">
              ✓ ¡Listo! Redirigiendo a tus cajas sorpresa…
            </div>
          )}

          <p className="frm-legal">
            Al registrarte, aceptas los <a href="https://www.electrolux.com.ec/tyc-campanas" target="_blank" rel="noopener noreferrer">Términos y Condiciones</a> de la promoción. La asignación de premios se realiza mediante un sistema de probabilidades. Promoción válida hasta agotar stock. Aplican restricciones.
          </p>
        </form>
      </div>

      {/* ── Estilos ── */}
      <style>{`
        /* Wrapper */
        .frm-wrap {
          width: 100%;
          max-width: 480px;
          padding: 0 4px;
          margin: auto;
        }

        /* Card glassmorphism */
        .frm-card {
          position: relative;
          background: rgba(122, 116, 136, 0.85); /* Color #7a7488 transparente */
          border: 1px solid rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(24px);
          border-radius: 28px;
          padding: clamp(24px, 4vh, 40px) clamp(24px, 4vw, 40px);
          box-shadow:
            0 24px 80px rgba(0,0,0,.5),
            0 0 0 1px rgba(255,255,255,.05);
          overflow: hidden;
        }

        /* Card glassmorphism sin glow interno */        /* Cabecera */
        .frm-header { position: relative; text-align: center; margin-bottom: clamp(16px, 2.5vh, 24px); }

        .frm-badge {
          display: inline-flex;
          gap: 6px;
          background: rgba(90,113,132,.22);
          border: 1px solid rgba(90,113,132,.38);
          color: rgba(255,255,255,.72);
          font-size: 10px;
          font-weight: 600;
          letter-spacing: .13em;
          text-transform: uppercase;
          padding: 4px 13px;
          border-radius: 100px;
          margin-bottom: 12px;
          backdrop-filter: blur(8px);
        }

        .frm-title {
          font-family: 'ElectroluxSans', system-ui, sans-serif;
          font-size: clamp(1.5rem, 3.5vw, 2.2rem);
          font-weight: 700;
          color: #fff;
          line-height: 1.2;
          margin: 0 0 8px;
          letter-spacing: -.02em;
        }
        .frm-title-accent {
          color: #cfd4da;
        }
        .frm-subtitle {
          color: rgba(255,255,255,.5);
          font-size: clamp(.8rem, 2vw, .9rem);
          margin: 0;
        }

        /* Barra de progreso */
        .frm-progress-wrap {
          position: relative;
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: clamp(14px, 2vh, 22px);
        }
        .frm-progress-track {
          flex: 1;
          height: 4px;
          background: rgba(255,255,255,.1);
          border-radius: 4px;
          overflow: hidden;
        }
        .frm-progress-bar {
          height: 100%;
          background: #cfd4da;
          border-radius: 4px;
          transition: width .4s cubic-bezier(.4,0,.2,1);
        }
        .frm-progress-label {
          font-size: 11px;
          font-weight: 600;
          color: rgba(255,255,255,.45);
          min-width: 28px;
          text-align: right;
        }

        /* Formulario */
        .frm-form {
          position: relative;
          display: flex;
          flex-direction: column;
          gap: clamp(10px, 1.5vh, 14px);
        }

        /* Campo */
        .frm-field { display: flex; flex-direction: column; gap: 4px; }

        /* Input wrapper */
        .frm-input-wrap {
          display: flex;
          align-items: center;
          gap: 10px;
          background: rgba(255,255,255,.07);
          border: 1px solid rgba(255,255,255,.12);
          border-radius: 14px;
          padding: 10px 14px;
          transition: border-color .2s, box-shadow .2s, background .2s;
          cursor: text;
        }
        .frm-input-wrap:focus-within {
          background: rgba(255,255,255,.1);
          border-color: rgba(90,113,132,.7);
          box-shadow: 0 0 0 3px rgba(90,113,132,.2);
        }
        .frm-input-wrap--err {
          border-color: rgba(255,100,100,.5) !important;
          box-shadow: 0 0 0 3px rgba(255,100,100,.12) !important;
          background: rgba(255,80,80,.05) !important;
        }
        .frm-input-wrap--ok {
          border-color: rgba(90,180,130,.4);
        }

        /* Ícono del campo */
        .frm-input-icon {
          font-size: 1.1rem;
          flex-shrink: 0;
          opacity: .75;
          line-height: 1;
        }

        /* Bloque label + input */
        .frm-input-inner {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 1px;
          min-width: 0;
        }

        .frm-label {
          font-size: 10px;
          font-weight: 600;
          letter-spacing: .08em;
          text-transform: uppercase;
          color: rgba(255,255,255,.45);
          line-height: 1;
          transition: color .2s;
        }
        .frm-input-wrap:focus-within .frm-label {
          color: rgba(90,113,132,.9);
        }

        .frm-input {
          background: transparent;
          border: none;
          outline: none;
          color: #fff;
          font-family: 'ElectroluxSans', system-ui, sans-serif;
          font-size: clamp(.85rem, 2vw, .95rem);
          font-weight: 500;
          width: 100%;
          padding: 0;
          caret-color: #5A7184;
        }
        .frm-input::placeholder {
          color: transparent;
        }

        /* Check de OK */
        .frm-input-status {
          font-size: 1rem;
          color: transparent;
          flex-shrink: 0;
          transition: color .3s;
          font-weight: 700;
          width: 18px;
          text-align: center;
        }
        .frm-input-status--ok {
          color: #6dbf97;
        }

        /* Estilos de Checkbox */
        .frm-terms {
          margin-top: 4px;
          margin-bottom: 4px;
        }
        .frm-terms-label {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          cursor: pointer;
        }
        .frm-terms-checkbox {
          top: 2px;
          position: relative;
          appearance: none;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 4px;
          width: 16px;
          height: 16px;
          flex-shrink: 0;
          cursor: pointer;
          transition: all 0.2s;
        }
        .frm-terms-checkbox:checked {
          background: #6dbf97;
          border-color: #6dbf97;
        }
        .frm-terms-checkbox:checked::after {
          content: "✓";
          position: absolute;
          color: white;
          font-size: 11px;
          font-weight: bold;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
        }
        .frm-terms-text {
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.7);
          line-height: 1.3;
        }
        .frm-terms-text a, .frm-legal a {
          color: #cfd4da;
          text-decoration: underline;
        }
        .frm-terms-text a:hover, .frm-legal a:hover {
          color: #ffffff;
        }

        /* Mensaje de error / Exito */
        .frm-error {
          font-size: .78rem;
          color: rgba(255,130,130,.9);
          margin: 0 0 0 4px;
          animation: frm-shake .3s ease;
        }
        .frm-error-box {
          background: rgba(255,80,80,.1);
          border: 1px solid rgba(255,80,80,.3);
          color: #ff9999;
          border-radius: 12px;
          padding: 10px 16px;
          font-size: .88rem;
          font-weight: 600;
          text-align: center;
          animation: frm-shake .3s ease;
        }
        @keyframes frm-shake {
          0%, 100% { transform: translateX(0); }
          25%       { transform: translateX(-4px); }
          75%       { transform: translateX(4px); }
        }

        /* Botón */
        .frm-btn {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          width: 100%;
          margin-top: clamp(4px, 1vh, 10px);
          padding: 14px 20px;
          border-radius: 50px;
          background: #0C2340;
          color: #fff;
          border: 1px solid rgba(255,255,255,.2);
          font-family: 'ElectroluxSans', system-ui, sans-serif;
          font-size: clamp(.88rem, 2vw, 1rem);
          font-weight: 700;
          letter-spacing: .04em;
          cursor: pointer;
          transition: all .25s ease;
          box-shadow: 0 8px 28px rgba(0,0,0,.35);
          overflow: hidden;
        }
        .frm-btn::after {
          content: "";
          position: absolute;
          top: 0; left: -100%;
          width: 100%; height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,.15), transparent);
          transition: left .45s ease;
        }
        .frm-btn:not(:disabled):hover::after { left: 100%; }
        .frm-btn:not(:disabled):hover {
          transform: translateY(-2px);
          box-shadow: 0 14px 36px rgba(0,0,0,.45);
          border-color: rgba(255,255,255,.32);
        }
        .frm-btn:not(:disabled):active {
          transform: translateY(0) scale(.98);
        }
        .frm-btn:disabled {
          opacity: .45;
          cursor: not-allowed;
        }
        .frm-btn-icon {
          font-size: 1.1rem;
          transition: transform .35s ease;
        }
        .frm-btn:not(:disabled):hover .frm-btn-icon {
          transform: rotate(20deg) scale(1.1);
        }

        /* Spinner */
        .frm-spinner {
          display: inline-block;
          width: 16px; height: 16px;
          border: 2px solid rgba(255,255,255,.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: frm-spin .7s linear infinite;
        }
        @keyframes frm-spin {
          to { transform: rotate(360deg); }
        }

        /* Éxito */
        .frm-success {
          background: rgba(80,180,130,.15);
          border: 1px solid rgba(80,180,130,.3);
          color: #7de0b0;
          border-radius: 12px;
          padding: 10px 16px;
          font-size: .88rem;
          font-weight: 600;
          text-align: center;
          animation: frm-fadein .4s ease;
        }
        @keyframes frm-fadein {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* Legal */
        .frm-legal {
          text-align: center;
          font-size: .72rem;
          color: rgba(255,255,255,.28);
          margin: 0;
        }

        /* Responsive */
        @media (max-width: 400px) {
          .frm-card { border-radius: 20px; }
          .frm-input-wrap { padding: 9px 12px; gap: 8px; }
          .frm-btn { padding: 13px 16px; }
        }
      `}</style>
    </div>
  )
}
