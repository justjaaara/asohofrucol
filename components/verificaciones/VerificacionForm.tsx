'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { FormSection } from '@/components/ui/FormSection'
import { Field, Input, Select, Textarea } from '@/components/ui/Field'
import { Button } from '@/components/ui/Button'

type ParametricaItem = { id: number; tipo: string; valor: string; orden: number }

type ProfesionalItem = { documento: string; nombre: string; correo?: string | null; zona?: string | null }

type VigenciaInput = {
  idVigencia?: number
  anio: number
  marcado: boolean
}

type VerificacionInput = {
  idProfesionalRecaudador: string
  idProfesionalVerificacion: string
  tipoInformacion: string
  zona: string
  fechaEntregaInformacion: string
  fechaAsignacion: string
  recaudadorIdentificado: string
  nit: string
  razonSocial: string
  informacionCompleta: string
  fechaCulminacion: string
  fechaTrasladoRecaudador: string
  fechaTrasladoAuditoria: string
  valorPendienteCapital: string
  valorPendienteIntereses: string
  valorSaldoFavor: string
  estadoActual: string
  detalleCertificacion: string
  usoPTNuevo: string
  porcentajeAvance: string
  observacionProfesional: string
  biable: string
  correo: string
  digitacion: string
  motivoRequerimiento: string
  envioRequerimiento: string
  programacionGestionPresencial: string
  verificacionContable: string
  etapa: string
  vigencias: VigenciaInput[]
}

const initialFormState: VerificacionInput = {
  idProfesionalRecaudador: '',
  idProfesionalVerificacion: '',
  tipoInformacion: '',
  zona: '',
  fechaEntregaInformacion: '',
  fechaAsignacion: '',
  recaudadorIdentificado: '',
  nit: '',
  razonSocial: '',
  informacionCompleta: '',
  fechaCulminacion: '',
  fechaTrasladoRecaudador: '',
  fechaTrasladoAuditoria: '',
  valorPendienteCapital: '',
  valorPendienteIntereses: '',
  valorSaldoFavor: '',
  estadoActual: '',
  detalleCertificacion: '',
  usoPTNuevo: '',
  porcentajeAvance: '',
  observacionProfesional: '',
  biable: '',
  correo: '',
  digitacion: '',
  motivoRequerimiento: '',
  envioRequerimiento: '',
  programacionGestionPresencial: '',
  verificacionContable: '',
  etapa: '',
  vigencias: [],
}

function toDateInput(value: string | Date | null | undefined): string {
  if (!value) return ''
  const date = typeof value === 'string' ? new Date(value) : value
  return date.toISOString().split('T')[0]
}

function normalizeInitialData(data: Record<string, unknown> | null | undefined): VerificacionInput {
  if (!data) return initialFormState
  return {
    idProfesionalRecaudador: data.idProfesionalRecaudador?.toString() ?? '',
    idProfesionalVerificacion: data.idProfesionalVerificacion?.toString() ?? '',
    tipoInformacion: (data.tipoInformacion as string) ?? '',
    zona: (data.zona as string) ?? '',
    fechaEntregaInformacion: toDateInput(data.fechaEntregaInformacion as string | Date | null),
    fechaAsignacion: toDateInput(data.fechaAsignacion as string | Date | null),
    recaudadorIdentificado: (data.recaudadorIdentificado as string) ?? '',
    nit: data.nit?.toString() ?? '',
    razonSocial: (data.razonSocial as string) ?? '',
    informacionCompleta: (data.informacionCompleta as string) ?? '',
    fechaCulminacion: toDateInput(data.fechaCulminacion as string | Date | null),
    fechaTrasladoRecaudador: toDateInput(data.fechaTrasladoRecaudador as string | Date | null),
    fechaTrasladoAuditoria: toDateInput(data.fechaTrasladoAuditoria as string | Date | null),
    valorPendienteCapital: data.valorPendienteCapital?.toString() ?? '',
    valorPendienteIntereses: data.valorPendienteIntereses?.toString() ?? '',
    valorSaldoFavor: data.valorSaldoFavor?.toString() ?? '',
    estadoActual: (data.estadoActual as string) ?? '',
    detalleCertificacion: (data.detalleCertificacion as string) ?? '',
    usoPTNuevo: (data.usoPTNuevo as string) ?? '',
    porcentajeAvance: data.porcentajeAvance?.toString() ?? '',
    observacionProfesional: (data.observacionProfesional as string) ?? '',
    biable: (data.biable as string) ?? '',
    correo: (data.correo as string) ?? '',
    digitacion: (data.digitacion as string) ?? '',
    motivoRequerimiento: (data.motivoRequerimiento as string) ?? '',
    envioRequerimiento: (data.envioRequerimiento as string) ?? '',
    programacionGestionPresencial: (data.programacionGestionPresencial as string) ?? '',
    verificacionContable: (data.verificacionContable as string) ?? '',
    etapa: (data.etapa as string) ?? '',
    vigencias:
      (data.vigencias as Array<{ idVigencia?: number; anio: number; marcado: boolean }> | undefined)?.map((v) => ({
        idVigencia: v.idVigencia,
        anio: Number(v.anio),
        marcado: Boolean(v.marcado),
      })) ?? [],
  }
}

export function VerificacionForm({
  initialData,
  parametricas,
  profesionales,
  submitLabel,
}: {
  initialData?: Record<string, unknown> | null
  parametricas: ParametricaItem[]
  profesionales: ProfesionalItem[]
  submitLabel: string
}) {
  const router = useRouter()
  const [form, setForm] = useState<VerificacionInput>(() => normalizeInitialData(initialData))
  const [loading, setLoading] = useState(false)
  const [nuevoAnio, setNuevoAnio] = useState('')

  const paramsByType = (tipo: string) => parametricas.filter((p) => p.tipo === tipo)

  const updateField = <K extends keyof VerificacionInput>(field: K, value: VerificacionInput[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const addVigencia = () => {
    const anio = Number(nuevoAnio)
    if (!nuevoAnio || Number.isNaN(anio)) return
    if (form.vigencias.some((v) => v.anio === anio)) return
    setForm((prev) => ({ ...prev, vigencias: [...prev.vigencias, { anio, marcado: false }] }))
    setNuevoAnio('')
  }

  const removeVigencia = (anio: number) => {
    setForm((prev) => ({ ...prev, vigencias: prev.vigencias.filter((v) => v.anio !== anio) }))
  }

  const toggleMarcado = (anio: number) => {
    setForm((prev) => ({
      ...prev,
      vigencias: prev.vigencias.map((v) => (v.anio === anio ? { ...v, marcado: !v.marcado } : v)),
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const idVerificacion = initialData?.idVerificacion as number | undefined
    const url = idVerificacion ? `/api/verificaciones/${idVerificacion}` : '/api/verificaciones'
    const method = idVerificacion ? 'PUT' : 'POST'

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Error al guardar')
      }

      router.push('/verificaciones')
      router.refresh()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al guardar')
    } finally {
      setLoading(false)
    }
  }

  const renderSelect = (
    label: string,
    field: keyof VerificacionInput,
    tipo: string,
    options?: { label: string; value: string }[],
    required = false
  ) => (
    <Field label={label} htmlFor={field} required={required}>
      <Select
        id={field}
        required={required}
        value={form[field] as string}
        onChange={(e) => updateField(field, e.target.value as VerificacionInput[typeof field])}
      >
        <option value="">Seleccione...</option>
        {options
          ? options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))
          : paramsByType(tipo).map((p) => (
              <option key={p.valor} value={p.valor}>
                {p.valor}
              </option>
            ))}
      </Select>
    </Field>
  )

  const renderInput = (
    label: string,
    field: keyof VerificacionInput,
    type: string = 'text',
    required = false
  ) => (
    <Field label={label} htmlFor={field} required={required}>
      <Input
        id={field}
        type={type}
        required={required}
        value={form[field] as string}
        onChange={(e) => updateField(field, e.target.value as VerificacionInput[typeof field])}
      />
    </Field>
  )

  const renderTextarea = (label: string, field: keyof VerificacionInput) => (
    <Field label={label} htmlFor={field}>
      <Textarea
        id={field}
        value={form[field] as string}
        onChange={(e) => updateField(field, e.target.value as VerificacionInput[typeof field])}
        rows={3}
      />
    </Field>
  )

  return (
    <Card className="p-6">
      <form onSubmit={handleSubmit} className="space-y-8">
        <FormSection title="Asignación" description="Quién recauda, quién verifica y en qué etapa está el caso">
          <Field label="Profesional recaudador" htmlFor="idProfesionalRecaudador" required>
            <Select
              id="idProfesionalRecaudador"
              required
              value={form.idProfesionalRecaudador}
              onChange={(e) => updateField('idProfesionalRecaudador', e.target.value)}
            >
              <option value="">Seleccione...</option>
              {profesionales.map((p) => (
                <option key={p.documento} value={p.documento}>
                  {p.nombre}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Profesional verificación" htmlFor="idProfesionalVerificacion" required>
            <Select
              id="idProfesionalVerificacion"
              required
              value={form.idProfesionalVerificacion}
              onChange={(e) => updateField('idProfesionalVerificacion', e.target.value)}
            >
              <option value="">Seleccione...</option>
              {profesionales.map((p) => (
                <option key={p.documento} value={p.documento}>
                  {p.nombre}
                </option>
              ))}
            </Select>
          </Field>

          {renderSelect('Etapa', 'etapa', 'Etapa', undefined, true)}
          {renderSelect('Tipo de información', 'tipoInformacion', 'TipoInformacion', undefined, true)}
          {renderSelect('Zona', 'zona', 'Zona')}
          {renderSelect('Recaudador identificado', 'recaudadorIdentificado', 'RecaudadorIdentificado')}
        </FormSection>

        <FormSection title="Identificación del caso" description="Datos del recaudador o identificado">
          {renderInput('NIT', 'nit', 'text', true)}
          {renderInput('Razón social', 'razonSocial')}
          {renderInput('Correo', 'correo', 'email')}
        </FormSection>

        <FormSection title="Fechas" description="Trazabilidad del trámite">
          {renderInput('Fecha entrega información', 'fechaEntregaInformacion', 'date')}
          {renderInput('Fecha asignación', 'fechaAsignacion', 'date')}
          {renderInput('Fecha culminación', 'fechaCulminacion', 'date')}
          {renderInput('Fecha traslado recaudador', 'fechaTrasladoRecaudador', 'date')}
          {renderInput('Fecha traslado auditoría', 'fechaTrasladoAuditoria', 'date')}
        </FormSection>

        <FormSection title="Valores financieros" description="Montos pendientes según la verificación contable">
          {renderInput('Valor pendiente capital', 'valorPendienteCapital')}
          {renderInput('Valor pendiente intereses', 'valorPendienteIntereses')}
          {renderInput('Valor saldo a favor', 'valorSaldoFavor')}
          {renderInput('Porcentaje avance', 'porcentajeAvance')}
        </FormSection>

        <FormSection title="Estado y seguimiento" description="Resultado de la verificación y uso de papeles de trabajo">
          {renderSelect('Estado actual', 'estadoActual', 'EstadoActual')}
          {renderInput('Detalle certificación', 'detalleCertificacion')}
          {renderSelect('Uso PT nuevo', 'usoPTNuevo', 'SiNo')}
          {renderInput('Biable', 'biable')}
          {renderInput('Digitación', 'digitacion')}
        </FormSection>

        <div className="border-t border-cream-200 pt-6">
          <div className="mb-4">
            <h2 className="font-display text-lg font-medium text-forest-900">Observaciones</h2>
            <p className="mt-0.5 text-xs text-ink-600">Notas de gestión y requerimientos</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {renderTextarea('Información completa', 'informacionCompleta')}
            {renderTextarea('Observación profesional', 'observacionProfesional')}
            {renderTextarea('Motivo requerimiento', 'motivoRequerimiento')}
            {renderTextarea('Envío requerimiento', 'envioRequerimiento')}
            {renderTextarea('Programación gestión presencial', 'programacionGestionPresencial')}
            {renderTextarea('Verificación contable', 'verificacionContable')}
          </div>
        </div>

        <div className="border-t border-cream-200 pt-6">
          <h2 className="font-display text-lg font-medium text-forest-900">Vigencias</h2>
          <p className="mt-0.5 text-xs text-ink-600">Años a cargo de este recaudador</p>

          <div className="mt-4 flex gap-2">
            <Input
              type="number"
              value={nuevoAnio}
              onChange={(e) => setNuevoAnio(e.target.value)}
              placeholder="Año"
              className="w-32"
            />
            <Button type="button" variant="secondary" onClick={addVigencia}>
              Agregar año
            </Button>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {form.vigencias.length === 0 ? (
              <span className="text-sm text-ink-400">Sin vigencias registradas</span>
            ) : (
              form.vigencias
                .sort((a, b) => a.anio - b.anio)
                .map((v) => (
                  <label
                    key={v.anio}
                    className={`flex items-center gap-2 rounded-full border px-3 py-1 text-sm transition-colors ${
                      v.marcado ? 'border-forest-600 bg-forest-50 text-forest-800' : 'border-cream-200 bg-white text-ink-600'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={v.marcado}
                      onChange={() => toggleMarcado(v.anio)}
                      className="accent-forest-700"
                    />
                    <span className="tabular-nums font-medium">{v.anio}</span>
                    <button
                      type="button"
                      onClick={() => removeVigencia(v.anio)}
                      className="text-terracotta-600 hover:text-terracotta-500"
                      aria-label={`Quitar vigencia ${v.anio}`}
                    >
                      ×
                    </button>
                  </label>
                ))
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 border-t border-cream-200 pt-6">
          <Button type="submit" disabled={loading}>
            {loading ? 'Guardando...' : submitLabel}
          </Button>
          <Button type="button" variant="ghost" onClick={() => router.push('/verificaciones')}>
            Cancelar
          </Button>
        </div>
      </form>
    </Card>
  )
}
