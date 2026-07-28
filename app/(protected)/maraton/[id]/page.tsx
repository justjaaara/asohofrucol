import { notFound, redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/session'
import { esAdmin } from '@/lib/permisos'
import { serialize } from '@/lib/serialize'
import MaratonForm, { MaratonFormData } from '@/components/maraton/MaratonForm'
import { PageHeader } from '@/components/ui/PageHeader'

interface EditMaratonPageProps {
  params: Promise<{ id: string }>
}

export default async function EditMaratonPage({ params }: EditMaratonPageProps) {
  const { id } = await params
  const idMaraton = parseInt(id, 10)
  if (Number.isNaN(idMaraton)) notFound()

  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const record = await prisma.maraton.findUnique({
    where: { idMaraton },
    include: { vigencias: { orderBy: { anio: 'asc' } } },
  })

  if (!record) notFound()

  const isOwner =
    record.idProfesionalVerificacion === user.documento ||
    record.usuarioCreacion === user.documento

  if (!esAdmin(user.rol) && !isOwner) {
    return (
      <p className="text-danger-600">
        No tiene permiso para editar este registro.
      </p>
    )
  }

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
      <PageHeader title="Editar registro de maratón" />
      <MaratonForm
        id={idMaraton}
        initialData={serialize(record) as unknown as MaratonFormData}
        profesionales={serialize(profesionales) as unknown as { documento: string; nombre: string }[]}
        siNo={siNo}
        recaudadores={recaudadores}
      />
    </div>
  )
}
