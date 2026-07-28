'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { Field, Input, Select } from '@/components/ui/Field'
import { Button } from '@/components/ui/Button'

type Rol = {
  idRol: number
  nombre: string
}

type Profesional = {
  documento: string
  nombre: string
  correo?: string | null
  zona?: string | null
  idRol: number
  estado?: boolean
  rol?: Rol
}

type ProfesionalFormProps = {
  roles: Rol[]
  zonas: { valor: string }[]
  profesional?: Profesional
  isAdmin?: boolean
}

export function ProfesionalForm({ roles, zonas, profesional, isAdmin = false }: ProfesionalFormProps) {
  const router = useRouter()
  const editing = !!profesional

  const [form, setForm] = useState({
    documento: profesional?.documento ?? '',
    nombre: profesional?.nombre ?? '',
    correo: profesional?.correo ?? '',
    zona: profesional?.zona ?? '',
    idRol: String(profesional?.idRol ?? roles[0]?.idRol ?? ''),
    password: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const payload: Record<string, unknown> = {
        nombre: form.nombre,
        correo: form.correo || null,
        zona: form.zona || null,
      }

      if (editing) {
        payload.documento = profesional!.documento
        if (form.password) payload.password = form.password
      } else {
        if (!form.documento) {
          setError('El documento es obligatorio')
          setLoading(false)
          return
        }
        if (!form.password) {
          setError('La contraseña es obligatoria al crear un profesional')
          setLoading(false)
          return
        }
        payload.documento = form.documento
        payload.password = form.password
      }

      if (isAdmin) {
        payload.idRol = Number(form.idRol)
      }

      const url = editing ? `/api/profesionales/${profesional!.documento}` : '/api/profesionales'
      const method = editing ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'Error desconocido' }))
        setError(data.error || 'Error al guardar el profesional')
        return
      }

      router.push('/profesionales')
      router.refresh()
    } catch {
      setError('Error de red al guardar el profesional')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="max-w-xl p-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <p className="rounded-md bg-danger-50 px-3 py-2 text-sm text-danger-600">{error}</p>
        )}

        <Field label="Documento" htmlFor="documento" required={!editing}>
          <Input
            id="documento"
            type="text"
            value={form.documento}
            disabled={editing}
            onChange={(e) => setForm((f) => ({ ...f, documento: e.target.value }))}
            required={!editing}
          />
        </Field>

        <Field label="Nombre" htmlFor="nombre" required>
          <Input
            id="nombre"
            type="text"
            value={form.nombre}
            onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
            required
          />
        </Field>

        <Field label="Correo" htmlFor="correo">
          <Input
            id="correo"
            type="email"
            value={form.correo}
            onChange={(e) => setForm((f) => ({ ...f, correo: e.target.value }))}
          />
        </Field>

        <Field label="Zona" htmlFor="zona">
          <Select
            id="zona"
            value={form.zona}
            onChange={(e) => setForm((f) => ({ ...f, zona: e.target.value }))}
          >
            <option value="">Sin zona</option>
            {zonas.map((z) => (
              <option key={z.valor} value={z.valor}>
                {z.valor}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Rol" htmlFor="idRol" required>
          <Select
            id="idRol"
            value={form.idRol}
            disabled={!isAdmin}
            onChange={(e) => setForm((f) => ({ ...f, idRol: e.target.value }))}
            required
          >
            {roles.map((rol) => (
              <option key={rol.idRol} value={rol.idRol}>
                {rol.nombre}
              </option>
            ))}
          </Select>
        </Field>

        <Field
          label={editing ? 'Nueva contraseña (dejar en blanco para no cambiar)' : 'Contraseña'}
          htmlFor="password"
          required={!editing}
        >
          <Input
            id="password"
            type="password"
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            required={!editing}
          />
        </Field>

        <div className="flex items-center gap-4 pt-2">
          <Button type="submit" disabled={loading}>
            {loading ? 'Guardando...' : 'Guardar'}
          </Button>
          <Link href="/profesionales" className="text-sm text-ink-600 hover:underline">
            Cancelar
          </Link>
        </div>
      </form>
    </Card>
  )
}
