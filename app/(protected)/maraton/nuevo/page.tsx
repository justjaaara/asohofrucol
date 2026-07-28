import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/session'
import { serialize } from '@/lib/serialize'
import MaratonForm from '@/components/maraton/MaratonForm'
import { PageHeader } from '@/components/ui/PageHeader'

export default async function NuevoMaratonPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const [profesionales, parametricas] = await Promise.all([
    prisma.profesional.findMany({
      where: { estado: true },
      orderBy: { nombre: 'asc' },
      select: { documento: true, nombre: true },
    }),
    prisma.parametrica.findMany({
      where: { tipo: { in: ['SiNo', 'RecaudadorIdentificado'] }, activo: true },
      orderBy: { orden: 'asc' },
      select: { id: true, tipo: true, valor: true },
    }),
  ])

  const siNo = parametricas.filter((p) => p.tipo === 'SiNo')
  const recaudadores = parametricas.filter((p) => p.tipo === 'RecaudadorIdentificado')

  return (
    <div className="space-y-6">
      <PageHeader title="Nuevo registro de maratón" description="Registre un nuevo caso para la jornada de verificación" />
      <MaratonForm
        profesionales={serialize(profesionales) as unknown as { documento: string; nombre: string }[]}
        siNo={siNo}
        recaudadores={recaudadores}
      />
    </div>
  )
}
