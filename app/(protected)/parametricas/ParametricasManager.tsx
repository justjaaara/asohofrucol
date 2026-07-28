'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { Field, Input, Select, CheckboxLabel } from '@/components/ui/Field'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

type Parametrica = {
  id: number
  tipo: string
  valor: string
  orden: number
  activo: boolean
}

export function ParametricasManager({
  grouped,
}: {
  grouped: Record<string, Parametrica[]>
}) {
  const router = useRouter()
  const [editing, setEditing] = useState<Parametrica | null>(null)
  const [form, setForm] = useState({
    tipo: '',
    newTipo: '',
    valor: '',
    orden: 0,
    activo: true,
  })
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const tipos = Object.keys(grouped).sort()

  function startEdit(parametrica: Parametrica) {
    setEditing(parametrica)
    setForm({
      tipo: parametrica.tipo,
      newTipo: '',
      valor: parametrica.valor,
      orden: parametrica.orden,
      activo: parametrica.activo,
    })
    setMessage('')
  }

  function resetForm() {
    setEditing(null)
    setForm({ tipo: '', newTipo: '', valor: '', orden: 0, activo: true })
    setMessage('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setMessage('')
    setLoading(true)

    const tipo = form.tipo === '__nuevo__' ? form.newTipo.trim() : form.tipo
    if (!form.tipo) {
      setMessage('Seleccione o cree un tipo')
      setLoading(false)
      return
    }

    const url = '/api/parametricas'
    const method = editing ? 'PUT' : 'POST'
    const body = editing
      ? { id: editing.id, valor: form.valor.trim(), orden: form.orden, activo: form.activo }
      : { tipo, valor: form.valor.trim(), orden: form.orden, activo: form.activo }

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setMessage(data.error || 'Error al guardar')
      return
    }

    resetForm()
    router.refresh()
  }

  async function toggleActivo(parametrica: Parametrica) {
    const res = await fetch('/api/parametricas', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: parametrica.id,
        valor: parametrica.valor,
        orden: parametrica.orden,
        activo: !parametrica.activo,
      }),
    })

    if (!res.ok) {
      const data = await res.json()
      setMessage(data.error || 'Error al actualizar')
      return
    }

    router.refresh()
  }

  return (
    <div className="space-y-6">
      {message && (
        <div className="rounded-md bg-danger-50 p-3 text-sm text-danger-600">{message}</div>
      )}

      <Card className="p-5">
        <form onSubmit={handleSubmit} className="space-y-4">
          <h2 className="font-display text-lg font-medium text-forest-900">
            {editing ? 'Editar valor' : 'Agregar valor'}
          </h2>

          {!editing && (
            <Field label="Tipo" htmlFor="tipo">
              <Select id="tipo" value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })}>
                <option value="">Seleccione tipo</option>
                {tipos.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
                <option value="__nuevo__">+ Nuevo tipo</option>
              </Select>
              {form.tipo === '__nuevo__' && (
                <Input
                  type="text"
                  value={form.newTipo}
                  onChange={(e) => setForm({ ...form, newTipo: e.target.value })}
                  placeholder="Nombre del nuevo tipo"
                  className="mt-2"
                />
              )}
            </Field>
          )}

          <Field label="Valor" htmlFor="valor" required>
            <Input
              id="valor"
              type="text"
              value={form.valor}
              onChange={(e) => setForm({ ...form, valor: e.target.value })}
              required
            />
          </Field>

          <Field label="Orden" htmlFor="orden">
            <Input
              id="orden"
              type="number"
              value={form.orden}
              onChange={(e) => setForm({ ...form, orden: Number(e.target.value) })}
            />
          </Field>

          <CheckboxLabel>
            <input
              type="checkbox"
              checked={form.activo}
              onChange={(e) => setForm({ ...form, activo: e.target.checked })}
              className="accent-forest-700"
            />
            Activo
          </CheckboxLabel>

          <div className="flex gap-2">
            <Button type="submit" disabled={loading}>
              {loading ? 'Guardando...' : editing ? 'Actualizar' : 'Agregar'}
            </Button>
            {editing && (
              <Button type="button" variant="secondary" onClick={resetForm}>
                Cancelar
              </Button>
            )}
          </div>
        </form>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        {tipos.map((tipo) => (
          <Card key={tipo} className="p-5">
            <h2 className="mb-3 font-display text-base font-medium text-forest-900">{tipo}</h2>
            <ul className="divide-y divide-cream-100">
              {grouped[tipo].map((p) => (
                <li
                  key={p.id}
                  className={`flex items-center justify-between py-2 ${p.activo ? '' : 'opacity-50'}`}
                >
                  <div className="text-sm">
                    <span className="font-medium text-ink-950">{p.valor}</span>
                    <span className="ml-2 text-xs text-ink-400">(orden: {p.orden})</span>
                    {!p.activo && (
                      <span className="ml-2">
                        <Badge tone="danger">Inactivo</Badge>
                      </span>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => startEdit(p)}
                      className="rounded-md px-2 py-1 text-xs font-medium text-ink-600 hover:bg-cream-100"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => toggleActivo(p)}
                      className={`rounded-md px-2 py-1 text-xs font-medium ${
                        p.activo
                          ? 'text-danger-600 hover:bg-danger-50'
                          : 'text-forest-700 hover:bg-forest-50'
                      }`}
                    >
                      {p.activo ? 'Desactivar' : 'Activar'}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>
    </div>
  )
}
