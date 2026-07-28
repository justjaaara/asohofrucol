import { redirect, notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/session'
import { esAdmin } from '@/lib/permisos'
import { VerificacionForm } from '@/components/verificaciones/VerificacionForm'
import { serialize } from '@/lib/serialize'
import { PageHeader } from '@/components/ui/PageHeader'

export const dynamic = 'force-dynamic'

async function getData(id: number) {
  const item = await prisma.verificacion.findUnique({
    where: { idVerificacion: id },
    include: {
      vigencias: { orderBy: { anio: 'asc' as const } },
      profesionalRecaudador: { select: { documento: true, nombre: true } },
      profesionalVerificacion: { select: { documento: true, nombre: true } },
    },
  })

  if (!item) return null

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
    item: serialize(item) as Record<string, unknown>,
    parametricas: serialize(parametricas) as { id: number; tipo: string; valor: string; orden: number }[],
    profesionales: serialize(profesionales) as unknown as { documento: string; nombre: string; correo: string | null; zona: string | null }[],
  }
}

export default async function EditarVerificacionPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const { id } = await params
  const idVerificacion = Number(id)
  if (Number.isNaN(idVerificacion)) notFound()

  const data = await getData(idVerificacion)
  if (!data) notFound()

  const item = data.item as { idProfesionalVerificacion: string | bigint }
  if (!esAdmin(user.rol) && BigInt(item.idProfesionalVerificacion) !== user.documento) {
    redirect('/verificaciones')
  }

  return (
    <div className="space-y-6">
      <PageHeader title={`Editar verificación #${idVerificacion}`} />
      <VerificacionForm
        initialData={data.item}
        parametricas={data.parametricas}
        profesionales={data.profesionales}
        submitLabel="Guardar cambios"
      />
    </div>
  )
}
