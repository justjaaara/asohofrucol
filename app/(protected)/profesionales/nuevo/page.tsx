import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/session'
import { esAdmin } from '@/lib/permisos'
import { ProfesionalForm } from '@/components/profesionales/ProfesionalForm'
import { PageHeader } from '@/components/ui/PageHeader'

export const dynamic = 'force-dynamic'

async function getData() {
  const [roles, zonas] = await Promise.all([
    prisma.rol.findMany({ orderBy: { nombre: 'asc' } }),
    prisma.parametrica.findMany({
      where: { activo: true, tipo: 'Zona' },
      orderBy: { orden: 'asc' },
      select: { valor: true },
    }),
  ])

  return { roles, zonas }
}

export default async function NuevoProfesionalPage() {
  const user = await getCurrentUser()
  if (!user || !esAdmin(user.rol)) {
    redirect('/profesionales')
  }

  const { roles, zonas } = await getData()

  return (
    <div className="space-y-6">
      <PageHeader title="Nuevo profesional" />
      <ProfesionalForm roles={roles} zonas={zonas} isAdmin />
    </div>
  )
}
