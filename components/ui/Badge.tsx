import { ReactNode } from 'react'

type Tone = 'neutral' | 'success' | 'warning' | 'alert' | 'info' | 'danger'

const tones: Record<Tone, string> = {
  neutral: 'bg-cream-200 text-ink-800',
  success: 'bg-forest-100 text-forest-800',
  warning: 'bg-gold-100 text-gold-600',
  alert: 'bg-terracotta-100 text-terracotta-600',
  info: 'bg-olive-100 text-olive-600',
  danger: 'bg-danger-100 text-danger-600',
}

export function Badge({ tone = 'neutral', children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${tones[tone]}`}
    >
      {children}
    </span>
  )
}

const siNoTone: Record<string, Tone> = { SI: 'success', NO: 'neutral' }
export function siNoBadgeTone(value?: string | null): Tone {
  if (!value) return 'neutral'
  return siNoTone[value.toUpperCase()] ?? 'neutral'
}

const etapaTone: Record<string, Tone> = {
  'VERIFICACIONES': 'warning',
  'CULMINADOS Y TRASLADO AI': 'success',
  'INACTIVACIÓN-CONCURSAL': 'info',
  'DESISTIMIENTO': 'alert',
}
export function etapaBadgeTone(value?: string | null): Tone {
  if (!value) return 'neutral'
  return etapaTone[value] ?? 'neutral'
}

const estadoTone: Record<string, Tone> = {
  'SI PAGÓ': 'success',
  'NO PAGÓ': 'alert',
  'COMPROMISO DE PAGO': 'warning',
  'ACUERDO DE PAGO': 'warning',
  'N/A': 'neutral',
}
export function estadoBadgeTone(value?: string | null): Tone {
  if (!value) return 'neutral'
  return estadoTone[value.toUpperCase()] ?? 'neutral'
}
