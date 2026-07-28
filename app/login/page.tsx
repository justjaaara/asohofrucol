'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Field, Input } from '@/components/ui/Field'
import { Button } from '@/components/ui/Button'

export default function LoginPage() {
  const [documento, setDocumento] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Se leen los valores directo del formulario (no solo del estado de
    // React) porque gestores de contraseñas como Bitwarden a veces rellenan
    // los inputs manipulando el DOM sin disparar onChange, dejando el
    // estado desincronizado de lo que se ve en pantalla.
    const formData = new FormData(e.currentTarget)
    const documentoValue = String(formData.get('documento') ?? documento)
    const passwordValue = String(formData.get('password') ?? password)

    const result = await signIn('credentials', {
      documento: documentoValue,
      password: passwordValue,
      redirect: false,
    })

    setLoading(false)

    if (result?.error) {
      setError('Documento o contraseña incorrectos')
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-forest-950 px-4 py-12">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: `radial-gradient(circle at 15% 20%, rgba(221,165,32,0.16), transparent 45%),
            radial-gradient(circle at 85% 75%, rgba(157,154,44,0.18), transparent 50%),
            radial-gradient(circle at 50% 100%, rgba(216,96,47,0.12), transparent 40%)`,
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-forest-700/40 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-32 -right-16 h-80 w-80 rounded-full bg-gold-500/10 blur-3xl"
      />

      <div className="relative w-full max-w-sm">
        <div className="mb-8 text-center">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-400">Fondo Nacional de Fomento Hortifrutícola</span>
          <h1 className="mt-2 font-display text-3xl font-medium text-cream-50">ASOHOFRUCOL</h1>
          <p className="mt-1 text-sm text-forest-100/70">Sistema de verificaciones contables</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl bg-cream-50 p-7 shadow-2xl">
          {error && (
            <p className="rounded-md bg-danger-50 px-3 py-2 text-sm text-danger-600">{error}</p>
          )}

          <Field label="Documento" htmlFor="documento" required>
            <Input
              id="documento"
              name="documento"
              type="text"
              inputMode="numeric"
              autoComplete="username"
              value={documento}
              onChange={(e) => setDocumento(e.target.value)}
              required
              autoFocus
            />
          </Field>

          <Field label="Contraseña" htmlFor="password" required>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </Field>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Ingresando…' : 'Ingresar'}
          </Button>
        </form>

        <p className="mt-6 text-center text-xs text-forest-100/50">
          Su recaudo bien invertido
        </p>
      </div>
    </div>
  )
}
