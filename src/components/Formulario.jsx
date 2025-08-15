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

  // Validaciones
  const validarNombre = (v) =>
    /^([A-Za-zÁÉÍÓÚáéíóúÑñ]{2,})(\s[A-Za-zÁÉÍÓÚáéíóúÑñ]{2,})+$/.test(v.trim())
  const validarCedula  = (v) => /^\d{10}$/.test(v)
  const validarCelular = (v) => /^09\d{8}$/.test(v)
  const validarEmail   = (v) => /^[a-zA-Z][a-zA-Z0-9._%+-]*@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(v)

  const errors = {
    nombre:  form.nombre  ? (validarNombre(form.nombre)   ? '' : 'Ingresa nombre y apellido válidos') : 'Requerido',
    cedula:  form.cedula  ? (validarCedula(form.cedula)   ? '' : 'Cédula de 10 dígitos')              : 'Requerido',
    celular: form.celular ? (validarCelular(form.celular) ? '' : 'Ej: 09XXXXXXXX')                    : 'Requerido',
    email:   form.email   ? (validarEmail(form.email)     ? '' : 'Correo inválido')                   : 'Requerido',
  }

  const isValid = !errors.nombre && !errors.cedula && !errors.celular && !errors.email

  const onChange = (e) => {
    const { name, value } = e.target
    const clean =
      name === 'cedula' || name === 'celular'
        ? value.replace(/[^\d]/g, '').slice(0, 10)
        : value
    setForm((s) => ({ ...s, [name]: clean }))
  }

  const onBlur = (e) => setTouched((t) => ({ ...t, [e.target.name]: true }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setTouched({ nombre: true, cedula: true, celular: true, email: true })
    setError(''); setOk(false)
    if (!isValid) return
    try {
      setLoading(true)
      const payload = {
        nombre: form.nombre.trim(),
        cedula: form.cedula.trim(),
        celular: form.celular.trim(),
        email: form.email.trim().toLowerCase(),
      }
      await guardarParticipante(payload)
      sessionStorage.setItem('emailParticipante', payload.email)
      setOk(true)
      navigate('/ruleta', { replace: true })
    } catch (err) {
      setError(err?.message || 'No se pudo registrar. Intenta nuevamente.')
    } finally {
      setLoading(false)
    }
  }

  // clases helper para inputs y labels (estilo consistente)
  const inputBase =
    'peer block w-full rounded-xl border bg-white/95 text-gray-900 ' +
    'px-4 py-3 outline-none transition placeholder-transparent focus:ring-2 ' +
    'shadow-sm'
  const labelFloat =
    'pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 ' +
    'origin-left bg-white px-1 text-sm text-slate-500 transition-all ' +
    // cuando hay FOCUS, súbela
    'peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:text-indigo-600 ' +
    // cuando HAY CONTENIDO (no placeholder-shown), también súbela
    'peer-[&:not(:placeholder-shown)]:top-0 ' +
    'peer-[&:not(:placeholder-shown)]:-translate-y-1/2 ' +
    'peer-[&:not(:placeholder-shown)]:text-slate-600'

  return (
    <div className="w-full">
      {/* Card: traslúcida sobre fondo oscuro */}
      <div className="mx-auto w-full max-w-lg rounded-2xl bg-white/90 p-6 shadow-2xl ring-1 ring-white/40 backdrop-blur-md sm:p-8">
        {/* Título */}
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
            Regístrate para participar <span className="inline-block">🎉</span>
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Completa tus datos para girar la ruleta y conocer tu premio.
          </p>
        </div>

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
                placeholder=" " /* ← placeholder vacío para que funcione :placeholder-shown */
                autoComplete="name"
                className={[
                  inputBase,
                  touched.nombre && errors.nombre
                    ? 'border-red-400 focus:ring-red-300'
                    : 'border-slate-200 focus:ring-indigo-200',
                ].join(' ')}
              />
              <label className={labelFloat}>Nombre y Apellido</label>
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
                placeholder=" "
                autoComplete="off"
                className={[
                  inputBase,
                  touched.cedula && errors.cedula
                    ? 'border-red-400 focus:ring-red-300'
                    : 'border-slate-200 focus:ring-indigo-200',
                ].join(' ')}
              />
              <label className={labelFloat}>Cédula</label>
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
                placeholder=" "
                autoComplete="tel"
                className={[
                  inputBase,
                  touched.celular && errors.celular
                    ? 'border-red-400 focus:ring-red-300'
                    : 'border-slate-200 focus:ring-indigo-200',
                ].join(' ')}
              />
              <label className={labelFloat}>Celular (09XXXXXXXX)</label>
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
                placeholder=" "
                autoComplete="email"
                className={[
                  inputBase,
                  touched.email && errors.email
                    ? 'border-red-400 focus:ring-red-300'
                    : 'border-slate-200 focus:ring-indigo-200',
                ].join(' ')}
              />
              <label className={labelFloat}>Correo electrónico</label>
            </div>
            {touched.email && errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email}</p>
            )}
          </div>

          {/* Botón */}
          <button
            type="submit"
            disabled={!isValid || loading}
            className={[
              'inline-flex w-full items-center justify-center rounded-xl px-4 py-3 text-base font-semibold text-white shadow-lg transition',
              'focus:outline-none focus:ring-2 focus:ring-offset-2',
              (!isValid || loading)
                ? 'bg-indigo-300 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500',
            ].join(' ')}
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

          <p className="pt-2 text-center text-xs text-slate-500">
            Al registrarte aceptas los términos de la promoción y el tratamiento de datos.
          </p>
        </form>
      </div>
    </div>
  )
}
