import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/session'
import { esAdmin } from '@/lib/permisos'
import { serialize } from '@/lib/serialize'
import { ProfesionalForm } from '@/components/profesionales/ProfesionalForm'
import { PageHeader } from '@/components/ui/PageHeader'

export const dynamic = 'force-dynamic'

const profesionalSelect = {
  documento: true,
  nombre: true,
  correo: true,
  zona: true,
  idRol: true,
  estado: true,
  rol: true,
} as const

async function getData(id: string) {
  let documento: bigint
  try {
    documento = BigInt(id)
  } catch {
    return { profesional: null, roles: [], zonas: [] }
  }

  const [profesional, roles, zonas] = await Promise.all([
    prisma.profesional.findUnique({ where: { documento }, select: profesionalSelect }),
    prisma.rol.findMany({ orderBy: { nombre: 'asc' } }),
    prisma.parametrica.findMany({
      where: { activo: true, tipo: 'Zona' },
      orderBy: { orden: 'asc' },
      select: { valor: true },
    }),
  ])

  return { profesional, roles, zonas }
}

export default async function EditarProfesionalPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const admin = esAdmin(user.rol)
  if (!admin && user.documento.toString() !== id) {
    redirect('/profesionales')
  }

  const { profesional, roles, zonas } = await getData(id)

  if (!profesional) {
    redirect('/profesionales')
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Editar profesional" />
      <ProfesionalForm profesional={serialize(profesional)} roles={roles} zonas={zonas} isAdmin={admin} />
    </div>
  )
}
