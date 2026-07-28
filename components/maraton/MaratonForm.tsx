'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { FormSection } from '@/components/ui/FormSection'
import { Field, Input, Select, Textarea } from '@/components/ui/Field'
import { Button } from '@/components/ui/Button'

interface Profesional {
  documento: string
  nombre: string
}

interface Parametrica {
  id: number
  tipo: string
  valor: string
}

interface Vigencia {
  idVigenciaMaraton?: number
  anio: number
  marcado: boolean
}

export interface MaratonFormData {
  idMaraton?: number
  fechaMaraton?: string | null
  idProfesionalRecaudador?: string | null
  idProfesionalVerificacion?: string | null
  recaudadorIdentificado?: string | null
  nit?: string
  razonSocial?: string | null
  numeroVigencias?: number | null
  porcentajeEstadoVerificacion?: string | null
  culminado?: string | null
  porcentajeAvance?: string | null
  totalAvance?: string | null
  valorPendienteCapital?: string | null
  valorPendienteIntereses?: string | null
  valorSaldoFavor?: string | null
  usoPTNuevo?: string | null
  observacionCulminacion?: string | null
  observacionCoordinacion?: string | null
  vigencias?: Vigencia[]
}

interface MaratonFormProps {
  id?: number
  initialData?: MaratonFormData
  profesionales: Profesional[]
  siNo: Parametrica[]
  recaudadores: Parametrica[]
}

function formatDate(value: string | null | undefined | Date) {
  if (!value) return ''
  const date = typeof value === 'string' ? new Date(value) : value
  if (Number.isNaN(date.getTime())) return ''
  return date.toISOString().split('T')[0]
}

export default function MaratonForm({
  id,
  initialData,
  profesionales,
  siNo,
  recaudadores,
}: MaratonFormProps) {
  const router = useRouter()
  const isEdit = Boolean(id)

  const [form, setForm] = useState({
    fechaMaraton: formatDate(initialData?.fechaMaraton),
    idProfesionalRecaudador: initialData?.idProfesionalRecaudador?.toString() ?? '',
    idProfesionalVerificacion: initialData?.idProfesionalVerificacion?.toString() ?? '',
    recaudadorIdentificado: initialData?.recaudadorIdentificado ?? '',
    nit: initialData?.nit?.toString() ?? '',
    razonSocial: initialData?.razonSocial ?? '',
    numeroVigencias: initialData?.numeroVigencias?.toString() ?? '',
    porcentajeEstadoVerificacion: initialData?.porcentajeEstadoVerificacion?.toString() ?? '',
    culminado: initialData?.culminado ?? '',
    porcentajeAvance: initialData?.porcentajeAvance?.toString() ?? '',
    totalAvance: initialData?.totalAvance?.toString() ?? '',
    valorPendienteCapital: initialData?.valorPendienteCapital?.toString() ?? '',
    valorPendienteIntereses: initialData?.valorPendienteIntereses?.toString() ?? '',
    valorSaldoFavor: initialData?.valorSaldoFavor?.toString() ?? '',
    usoPTNuevo: initialData?.usoPTNuevo ?? '',
    observacionCulminacion: initialData?.observacionCulminacion ?? '',
    observacionCoordinacion: initialData?.observacionCoordinacion ?? '',
  })

  const [vigencias, setVigencias] = useState(
    initialData?.vigencias?.map((v) => ({ anio: String(v.anio), marcado: v.marcado })) ?? []
  )

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  function addVigencia() {
    setVigencias((prev) => [...prev, { anio: String(new Date().getFullYear()), marcado: false }])
  }

  function removeVigencia(index: number) {
    setVigencias((prev) => prev.filter((_, i) => i !== index))
  }

  function updateVigencia(index: number, patch: Partial<{ anio: string; marcado: boolean }>) {
    setVigencias((prev) =>
      prev.map((v, i) => (i === index ? { ...v, ...patch } : v))
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (!form.nit.trim()) {
      setError('El NIT es obligatorio')
      setLoading(false)
      return
    }

    const payload = {
      ...form,
      idProfesionalRecaudador: form.idProfesionalRecaudador || null,
      idProfesionalVerificacion: form.idProfesionalVerificacion || null,
      recaudadorIdentificado: form.recaudadorIdentificado || null,
      razonSocial: form.razonSocial.trim() || null,
      numeroVigencias: form.numeroVigencias ? parseInt(form.numeroVigencias, 10) : null,
      porcentajeEstadoVerificacion: form.porcentajeEstadoVerificacion || null,
      culminado: form.culminado || null,
      porcentajeAvance: form.porcentajeAvance || null,
      totalAvance: form.totalAvance || null,
      valorPendienteCapital: form.valorPendienteCapital || null,
      valorPendienteIntereses: form.valorPendienteIntereses || null,
      valorSaldoFavor: form.valorSaldoFavor || null,
      usoPTNuevo: form.usoPTNuevo || null,
      observacionCulminacion: form.observacionCulminacion.trim() || null,
      observacionCoordinacion: form.observacionCoordinacion.trim() || null,
      vigencias: vigencias
        .map((v) => ({ anio: parseInt(v.anio, 10), marcado: v.marcado }))
        .filter((v) => !Number.isNaN(v.anio) && v.anio > 0),
    }

    const url = isEdit ? `/api/maraton/${id}` : '/api/maraton'
    const method = isEdit ? 'PUT' : 'POST'

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'Error al guardar' }))
        setError(data.error || 'Error al guardar')
        return
      }

      router.push('/maraton')
      router.refresh()
    } catch {
      setError('Error de red al guardar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="p-6">
      <form onSubmit={handleSubmit} className="space-y-8">
        {error && <p className="rounded-md bg-danger-50 px-3 py-2 text-sm text-danger-600">{error}</p>}

        <FormSection title="Identificación del caso" description="Fecha de jornada, responsables y recaudador">
          <Field label="Fecha maratón" htmlFor="fechaMaraton">
            <Input id="fechaMaraton" type="date" name="fechaMaraton" value={form.fechaMaraton} onChange={handleChange} />
          </Field>

          <Field label="Recaudador" htmlFor="idProfesionalRecaudador">
            <Select id="idProfesionalRecaudador" name="idProfesionalRecaudador" value={form.idProfesionalRecaudador} onChange={handleChange}>
              <option value="">Seleccione...</option>
              {profesionales.map((p) => (
                <option key={p.documento} value={p.documento}>
                  {p.nombre}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Verificador" htmlFor="idProfesionalVerificacion">
            <Select id="idProfesionalVerificacion" name="idProfesionalVerificacion" value={form.idProfesionalVerificacion} onChange={handleChange}>
              <option value="">Seleccione...</option>
              {profesionales.map((p) => (
                <option key={p.documento} value={p.documento}>
                  {p.nombre}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Recaudador identificado" htmlFor="recaudadorIdentificado">
            <Select id="recaudadorIdentificado" name="recaudadorIdentificado" value={form.recaudadorIdentificado} onChange={handleChange}>
              <option value="">Seleccione...</option>
              {recaudadores.map((p) => (
                <option key={p.id} value={p.valor}>
                  {p.valor}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="NIT" htmlFor="nit" required>
            <Input id="nit" type="text" name="nit" value={form.nit} onChange={handleChange} required />
          </Field>

          <Field label="Razón social" htmlFor="razonSocial">
            <Input id="razonSocial" type="text" name="razonSocial" value={form.razonSocial} onChange={handleChange} />
          </Field>
        </FormSection>

        <FormSection title="Programación" description="Vigencias a cargo y estado de la verificación">
          <Field label="Número de vigencias" htmlFor="numeroVigencias">
            <Input id="numeroVigencias" type="number" name="numeroVigencias" value={form.numeroVigencias} onChange={handleChange} />
          </Field>

          <Field label="% estado verificación" htmlFor="porcentajeEstadoVerificacion">
            <Input id="porcentajeEstadoVerificacion" type="number" step="0.01" name="porcentajeEstadoVerificacion" value={form.porcentajeEstadoVerificacion} onChange={handleChange} />
          </Field>
        </FormSection>

        <FormSection title="Ejecución" description="Resultado de la jornada de maratón">
          <Field label="Culminado" htmlFor="culminado">
            <Select id="culminado" name="culminado" value={form.culminado} onChange={handleChange}>
              <option value="">Seleccione...</option>
              {siNo.map((p) => (
                <option key={p.id} value={p.valor}>
                  {p.valor}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="% avance" htmlFor="porcentajeAvance">
            <Input id="porcentajeAvance" type="number" step="0.01" name="porcentajeAvance" value={form.porcentajeAvance} onChange={handleChange} />
          </Field>

          <Field label="% total avance" htmlFor="totalAvance">
            <Input id="totalAvance" type="number" step="0.01" name="totalAvance" value={form.totalAvance} onChange={handleChange} />
          </Field>

          <Field label="Uso PT nuevo" htmlFor="usoPTNuevo">
            <Select id="usoPTNuevo" name="usoPTNuevo" value={form.usoPTNuevo} onChange={handleChange}>
              <option value="">Seleccione...</option>
              {siNo.map((p) => (
                <option key={p.id} value={p.valor}>
                  {p.valor}
                </option>
              ))}
            </Select>
          </Field>
        </FormSection>

        <FormSection title="Valores financieros" description="Montos pendientes al cierre de la jornada">
          <Field label="Valor pendiente capital" htmlFor="valorPendienteCapital">
            <Input id="valorPendienteCapital" type="number" step="0.01" name="valorPendienteCapital" value={form.valorPendienteCapital} onChange={handleChange} />
          </Field>

          <Field label="Valor pendiente intereses" htmlFor="valorPendienteIntereses">
            <Input id="valorPendienteIntereses" type="number" step="0.01" name="valorPendienteIntereses" value={form.valorPendienteIntereses} onChange={handleChange} />
          </Field>

          <Field label="Valor saldo a favor" htmlFor="valorSaldoFavor">
            <Input id="valorSaldoFavor" type="number" step="0.01" name="valorSaldoFavor" value={form.valorSaldoFavor} onChange={handleChange} />
          </Field>
        </FormSection>

        <div className="border-t border-cream-200 pt-6">
          <div className="mb-4">
            <h2 className="font-display text-lg font-medium text-forest-900">Observaciones</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Observación culminación" htmlFor="observacionCulminacion">
              <Textarea id="observacionCulminacion" name="observacionCulminacion" value={form.observacionCulminacion} onChange={handleChange} rows={4} />
            </Field>
            <Field label="Observación coordinación" htmlFor="observacionCoordinacion">
              <Textarea id="observacionCoordinacion" name="observacionCoordinacion" value={form.observacionCoordinacion} onChange={handleChange} rows={4} />
            </Field>
          </div>
        </div>

        <div className="border-t border-cream-200 pt-6">
          <h2 className="font-display text-lg font-medium text-forest-900">Vigencias</h2>
          <div className="mt-4 space-y-2">
            {vigencias.map((v, i) => (
              <div key={i} className="flex items-center gap-3">
                <Input
                  type="number"
                  value={v.anio}
                  onChange={(e) => updateVigencia(i, { anio: e.target.value })}
                  className="w-32"
                  placeholder="Año"
                />
                <label className="flex items-center gap-2 text-sm text-ink-800">
                  <input
                    type="checkbox"
                    checked={v.marcado}
                    onChange={(e) => updateVigencia(i, { marcado: e.target.checked })}
                    className="accent-forest-700"
                  />
                  Marcado
                </label>
                <button
                  type="button"
                  onClick={() => removeVigencia(i)}
                  className="text-sm font-medium text-terracotta-600 hover:underline"
                >
                  Eliminar
                </button>
              </div>
            ))}
          </div>
          <Button type="button" variant="secondary" onClick={addVigencia} className="mt-3">
            Agregar vigencia
          </Button>
        </div>

        <div className="flex items-center gap-3 border-t border-cream-200 pt-6">
          <Button type="submit" disabled={loading}>
            {loading ? 'Guardando...' : isEdit ? 'Actualizar' : 'Crear'}
          </Button>
          <Button variant="ghost" onClick={() => router.push('/maraton')} type="button">
            Cancelar
          </Button>
        </div>
      </form>
    </Card>
  )
}
