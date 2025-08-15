// src/components/Formulario.jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { guardarParticipante } from '../services/firebase'

export default function Formulario() {
  const navigate = useNavigate()

  const [form, setForm] = useState({
    nombre: '',
    cedula: '',
    celular: '',
    email: '',
  })
  const [touched, setTouched] = useState({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [ok, setOk] = useState(false)

  // Validaciones (simples y rápidas)
  const validarNombre = (v) =>
    /^([A-Za-zÁÉÍÓÚáéíóúÑñ]{2,})(\s[A-Za-zÁÉÍÓÚáéíóúÑñ]{2,})+$/.test(v.trim())
  const validarCedula = (v) => /^\d{10}$/.test(v)
  const validarCelular = (v) => /^09\d{8}$/.test(v)
  const validarEmail = (v) =>
    /^[a-zA-Z][a-zA-Z0-9._%+-]*@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(v)

  const errors = {
    nombre: form.nombre ? (validarNombre(form.nombre) ? '' : 'Ingresa nombre y apellido válidos') : 'Requerido',
    cedula: form.cedula ? (validarCedula(form.cedula) ? '' : 'Cédula de 10 dígitos') : 'Requerido',
    celular: form.celular ? (validarCelular(form.celular) ? '' : 'Ej: 09XXXXXXXX') : 'Requerido',
    email: form.email ? (validarEmail(form.email) ? '' : 'Correo inválido') : 'Requerido',
  }

  const isValid =
    !errors.nombre && !errors.cedula && !errors.celular && !errors.email

  const onChange = (e) => {
    const { name, value } = e.target
    // Normalización suave para numéricos
    const clean =
      name === 'cedula' || name === 'celular'
        ? value.replace(/[^\d]/g, '').slice(0, name === 'cedula' ? 10 : 10)
        : value
    setForm((s) => ({ ...s, [name]: clean }))
  }

  const onBlur = (e) => {
    const { name } = e.target
    setTouched((t) => ({ ...t, [name]: true }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setTouched({ nombre: true, cedula: true, celular: true, email: true })
    setError('')
    setOk(false)

    if (!isValid) return

    try {
      setLoading(true)
      const payload = {
        nombre: form.nombre.trim(),
        cedula: form.cedula.trim(),
        celular: form.celular.trim(),
        email: form.email.trim(),
      }
      await guardarParticipante(payload)
      // Mantener comportamiento previo: guardar email en sessionStorage
      sessionStorage.setItem(
        'emailParticipante',
        payload.email.trim().toLowerCase()
      )
      setOk(true)
      // Navega a la ruleta si existe la ruta
      navigate('/ruleta', { replace: true })
    } catch (err) {
      setError(err?.message || 'No se pudo registrar. Intenta nuevamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full">
      {/* Card */}
      <div className="mx-auto w-full rounded-2xl bg-white/85 p-6 shadow-xl backdrop-blur-lg ring-1 ring-black/5 sm:p-8">
        {/* Título */}
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900 sm:text-3xl">
            Regístrate para participar 🎉
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Completa tus datos para girar la ruleta y conocer tu premio.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Nombre */}
          <div>
            <div className="relative">
              <input
                type="text"
                name="nombre"
                value={form.nombre}
                onChange={onChange}
                onBlur={onBlur}
                className={`peer block w-full rounded-xl border bg-white px-4 py-3 outline-none transition
                  placeholder-transparent
                  focus:ring-2
                  ${touched.nombre && errors.nombre ? 'border-red-400 focus:ring-red-300' : 'border-gray-200 focus:ring-indigo-200'}`}
                placeholder="Nombre y Apellido"
                autoComplete="name"
              />
              <label
                className="pointer-events-none absolute left-4 top-3 origin-left -translate-y-1/2 bg-white px-1 text-sm text-gray-500 transition-all peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-gray-400 peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:text-indigo-600"
              >
                Nombre y Apellido
              </label>
            </div>
            {touched.nombre && errors.nombre && (
              <p className="mt-1 text-sm text-red-600">{errors.nombre}</p>
            )}
          </div>

          {/* Cédula */}
          <div>
            <div className="relative">
              <input
                type="text"
                inputMode="numeric"
                name="cedula"
                value={form.cedula}
                onChange={onChange}
                onBlur={onBlur}
                className={`peer block w-full rounded-xl border bg-white px-4 py-3 outline-none transition
                  placeholder-transparent
                  focus:ring-2
                  ${touched.cedula && errors.cedula ? 'border-red-400 focus:ring-red-300' : 'border-gray-200 focus:ring-indigo-200'}`}
                placeholder="Cédula"
                autoComplete="off"
              />
              <label className="pointer-events-none absolute left-4 top-3 origin-left -translate-y-1/2 bg-white px-1 text-sm text-gray-500 transition-all peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-gray-400 peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:text-indigo-600">
                Cédula
              </label>
            </div>
            {touched.cedula && errors.cedula && (
              <p className="mt-1 text-sm text-red-600">{errors.cedula}</p>
            )}
          </div>

          {/* Celular */}
          <div>
            <div className="relative">
              <input
                type="tel"
                inputMode="numeric"
                name="celular"
                value={form.celular}
                onChange={onChange}
                onBlur={onBlur}
                className={`peer block w-full rounded-xl border bg-white px-4 py-3 outline-none transition
                  placeholder-transparent
                  focus:ring-2
                  ${touched.celular && errors.celular ? 'border-red-400 focus:ring-red-300' : 'border-gray-200 focus:ring-indigo-200'}`}
                placeholder="Celular"
                autoComplete="tel"
              />
              <label className="pointer-events-none absolute left-4 top-3 origin-left -translate-y-1/2 bg-white px-1 text-sm text-gray-500 transition-all peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-gray-400 peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:text-indigo-600">
                Celular (09XXXXXXXX)
              </label>
            </div>
            {touched.celular && errors.celular && (
              <p className="mt-1 text-sm text-red-600">{errors.celular}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <div className="relative">
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={onChange}
                onBlur={onBlur}
                className={`peer block w-full rounded-xl border bg-white px-4 py-3 outline-none transition
                  placeholder-transparent
                  focus:ring-2
                  ${touched.email && errors.email ? 'border-red-400 focus:ring-red-300' : 'border-gray-200 focus:ring-indigo-200'}`}
                placeholder="Correo electrónico"
                autoComplete="email"
              />
              <label className="pointer-events-none absolute left-4 top-3 origin-left -translate-y-1/2 bg-white px-1 text-sm text-gray-500 transition-all peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-gray-400 peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:text-indigo-600">
                Correo electrónico
              </label>
            </div>
            {touched.email && errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email}</p>
            )}
          </div>

          {/* Botón */}
          <button
            type="submit"
            disabled={!isValid || loading}
            className={`inline-flex w-full items-center justify-center rounded-xl px-4 py-3 text-base font-semibold text-white shadow-lg transition focus:outline-none focus:ring-2 focus:ring-offset-2
              ${!isValid || loading
                ? 'bg-indigo-300 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500'}`}
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4A4 4 0 008 12H4z"/>
                </svg>
                Registrando...
              </span>
            ) : (
              'Registrarme y girar'
            )}
          </button>

          {/* Estado */}
          {error && (
            <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-100">
              {error}
            </div>
          )}
          {ok && (
            <div className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700 ring-1 ring-emerald-100">
              ¡Registro exitoso! Redirigiendo a la ruleta…
            </div>
          )}

          {/* Nota legal */}
          <p className="pt-2 text-center text-xs text-gray-500">
            Al registrarte aceptas los términos de la promoción y el tratamiento de datos.
          </p>
        </form>
      </div>
    </div>
  )
}
