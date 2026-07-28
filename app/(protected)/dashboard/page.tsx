import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/session'
import { filtroPorRol, esAdmin } from '@/lib/permisos'
import Link from 'next/link'
import { Card } from '@/components/ui/Card'

export default async function DashboardPage() {
  const user = await getCurrentUser()
  if (!user) return null

  const whereVerificaciones = filtroPorRol({}, user)
  const whereMaraton = filtroPorRol({}, user)

  const [verificaciones, maraton, profesionales] = await Promise.all([
    prisma.verificacion.count({ where: whereVerificaciones }),
    prisma.maraton.count({ where: whereMaraton }),
    esAdmin(user.rol) ? prisma.profesional.count({ where: { estado: true } }) : Promise.resolve(null),
  ])

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm font-medium text-terracotta-600">Bienvenido de nuevo</p>
        <h1 className="font-display text-3xl font-medium text-forest-950">{user.nombre}</h1>
        <p className="mt-1 text-sm text-ink-600">
          {esAdmin(user.rol) ? 'Acceso administrador · visibilidad total' : 'Casos asignados a su cargo'}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <DashboardCard
          href="/verificaciones"
          kicker="En trámite"
          title="Verificaciones"
          value={verificaciones}
          hint="Casos contables activos"
          accent="gold"
        />
        <DashboardCard
          href="/maraton"
          kicker="Jornadas"
          title="Maratón"
          value={maraton}
          hint="Registros de verificación"
          accent="terracotta"
        />
        {profesionales !== null && (
          <DashboardCard
            href="/profesionales"
            kicker="Equipo"
            title="Profesionales activos"
            value={profesionales}
            hint="Usuarios con acceso al sistema"
            accent="forest"
          />
        )}
      </div>
    </div>
  )
}

function DashboardCard({
  href,
  kicker,
  title,
  value,
  hint,
  accent,
}: {
  href: string
  kicker: string
  title: string
  value: number
  hint: string
  accent: 'gold' | 'terracotta' | 'forest'
}) {
  const accent2 = {
    gold: { border: 'border-l-gold-500', kicker: 'text-gold-600' },
    terracotta: { border: 'border-l-terracotta-500', kicker: 'text-terracotta-600' },
    forest: { border: 'border-l-forest-600', kicker: 'text-forest-700' },
  }[accent]

  return (
    <Link href={href} className="group block">
      <Card className={`border-l-4 ${accent2.border} p-6 transition-transform group-hover:-translate-y-0.5 group-hover:shadow-lg`}>
        <p className={`text-xs font-semibold uppercase tracking-wide ${accent2.kicker}`}>{kicker}</p>
        <h2 className="mt-1 text-sm font-medium text-ink-600">{title}</h2>
        <p className="mt-3 font-display text-5xl font-medium tabular-nums text-ink-950">{value}</p>
        <p className="mt-2 text-xs text-ink-400">{hint}</p>
      </Card>
    </Link>
  )
}
