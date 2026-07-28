import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/session'
import { VerificacionForm } from '@/components/verificaciones/VerificacionForm'
import { serialize } from '@/lib/serialize'
import { PageHeader } from '@/components/ui/PageHeader'

export const dynamic = 'force-dynamic'

async function getData() {
  const [parametricas, profesionales] = await Promise.all([
    prisma.parametrica.findMany({
      where: {
        activo: true,
        tipo: { in: ['TipoInformacion', 'Zona', 'EstadoActual', 'Etapa', 'SiNo', 'RecaudadorIdentificado'] },
      },
      orderBy: { orden: 'asc' },
      select: { id: true, tipo: true, valor: true, orden: true },
    }),
    prisma.profesional.findMany({
      where: { estado: true },
      orderBy: { nombre: 'asc' },
      select: { documento: true, nombre: true, correo: true, zona: true },
    }),
  ])

  return {
    parametricas: serialize(parametricas),
    profesionales: serialize(profesionales),
  }
}

export default async function NuevaVerificacionPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const { parametricas, profesionales } = await getData()

  return (
    <div className="space-y-6">
      <PageHeader title="Nueva verificación" description="Registre un nuevo caso de verificación contable" />
      <VerificacionForm parametricas={parametricas} profesionales={profesionales} submitLabel="Crear verificación" />
    </div>
  )
}
