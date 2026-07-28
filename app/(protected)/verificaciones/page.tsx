import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/session'
import { filtroPorRol } from '@/lib/permisos'
import Link from 'next/link'
import { DeleteButton } from '@/components/verificaciones/DeleteButton'
import type { Prisma } from '@prisma/client'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { Field, Input, Select } from '@/components/ui/Field'
import { Badge, etapaBadgeTone, estadoBadgeTone } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { buttonClass } from '@/components/ui/Button'
import { tableWrap, theadRow, th, tr, td } from '@/components/ui/table'

export const dynamic = 'force-dynamic'

function buildWhere(searchParams: { [key: string]: string | undefined }): Prisma.VerificacionWhereInput {
  const where: Prisma.VerificacionWhereInput = {}

  if (searchParams.etapa) where.etapa = searchParams.etapa
  if (searchParams.zona) where.zona = searchParams.zona
  if (searchParams.estadoActual) where.estadoActual = searchParams.estadoActual
  if (searchParams.nit && !Number.isNaN(Number(searchParams.nit))) {
    where.nit = BigInt(searchParams.nit)
  }
  if (searchParams.profesional && !Number.isNaN(Number(searchParams.profesional))) {
    where.idProfesionalVerificacion = BigInt(searchParams.profesional)
  }
  if (searchParams.search) {
    const search = searchParams.search
    const orConditions: Prisma.VerificacionWhereInput[] = [
      { razonSocial: { contains: search } },
      { observacionProfesional: { contains: search } },
    ]
    if (!Number.isNaN(Number(search))) {
      orConditions.push({ nit: { equals: BigInt(search) } })
    }
    where.OR = orConditions
  }

  return where
}

async function getFilterOptions() {
  const [etapas, zonas, estados, profesionales] = await Promise.all([
    prisma.parametrica.findMany({ where: { tipo: 'Etapa', activo: true }, orderBy: { orden: 'asc' }, select: { valor: true } }),
    prisma.parametrica.findMany({ where: { tipo: 'Zona', activo: true }, orderBy: { orden: 'asc' }, select: { valor: true } }),
    prisma.parametrica.findMany({ where: { tipo: 'EstadoActual', activo: true }, orderBy: { orden: 'asc' }, select: { valor: true } }),
    prisma.profesional.findMany({ where: { estado: true }, orderBy: { nombre: 'asc' }, select: { documento: true, nombre: true } }),
  ])

  return { etapas, zonas, estados, profesionales }
}

export default async function VerificacionesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>
}) {
  const user = await getCurrentUser()
  if (!user) return null

  const params = await searchParams
  const where = filtroPorRol(buildWhere(params), user)

  const [items, options] = await Promise.all([
    prisma.verificacion.findMany({
      where,
      include: {
        vigencias: { orderBy: { anio: 'asc' as const } },
        profesionalRecaudador: { select: { documento: true, nombre: true } },
        profesionalVerificacion: { select: { documento: true, nombre: true } },
      },
      orderBy: { idVerificacion: 'desc' },
    }),
    getFilterOptions(),
  ])

  const formatDecimal = (value: Prisma.Decimal | null | undefined) => {
    if (value === null || value === undefined) return '-'
    return value.toString()
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Verificaciones"
        description={`${items.length} caso${items.length === 1 ? '' : 's'} en el listado actual`}
        actions={
          <Link href="/verificaciones/nuevo" className={buttonClass('primary')}>
            + Nueva verificación
          </Link>
        }
      />

      <Card className="p-4">
        <form className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Buscar" htmlFor="search">
            <Input id="search" name="search" defaultValue={params.search ?? ''} placeholder="NIT, razón social, observación..." />
          </Field>
          <Field label="Etapa" htmlFor="etapa">
            <Select id="etapa" name="etapa" defaultValue={params.etapa ?? ''}>
              <option value="">Todas</option>
              {options.etapas.map((e) => (
                <option key={e.valor} value={e.valor}>
                  {e.valor}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Zona" htmlFor="zona">
            <Select id="zona" name="zona" defaultValue={params.zona ?? ''}>
              <option value="">Todas</option>
              {options.zonas.map((z) => (
                <option key={z.valor} value={z.valor}>
                  {z.valor}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Estado actual" htmlFor="estadoActual">
            <Select id="estadoActual" name="estadoActual" defaultValue={params.estadoActual ?? ''}>
              <option value="">Todos</option>
              {options.estados.map((e) => (
                <option key={e.valor} value={e.valor}>
                  {e.valor}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="NIT" htmlFor="nit">
            <Input id="nit" name="nit" defaultValue={params.nit ?? ''} placeholder="NIT" />
          </Field>
          <Field label="Profesional verificación" htmlFor="profesional">
            <Select id="profesional" name="profesional" defaultValue={params.profesional ?? ''}>
              <option value="">Todos</option>
              {options.profesionales.map((p) => (
                <option key={p.documento.toString()} value={p.documento.toString()}>
                  {p.nombre}
                </option>
              ))}
            </Select>
          </Field>
          <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-2">
            <button type="submit" className={buttonClass('secondary')}>
              Filtrar
            </button>
            <Link href="/verificaciones" className={buttonClass('ghost')}>
              Limpiar
            </Link>
          </div>
        </form>
      </Card>

      <div className={tableWrap}>
        <table className="min-w-full text-sm">
          <thead className={theadRow}>
            <tr>
              <th className={th}>ID</th>
              <th className={th}>NIT</th>
              <th className={th}>Razón social</th>
              <th className={th}>Etapa</th>
              <th className={th}>Estado</th>
              <th className={th}>Verificador</th>
              <th className={th}>Recaudador</th>
              <th className={th}>Vigencias</th>
              <th className={th}>Avance</th>
              <th className={th}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={10}>
                  <EmptyState message="No se encontraron verificaciones con los filtros seleccionados." />
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.idVerificacion} className={tr}>
                  <td className={`${td} tabular-nums text-ink-400`}>{item.idVerificacion}</td>
                  <td className={`${td} tabular-nums font-medium`}>{item.nit.toString()}</td>
                  <td className={td}>{item.razonSocial ?? '-'}</td>
                  <td className={td}>
                    <Badge tone={etapaBadgeTone(item.etapa)}>{item.etapa}</Badge>
                  </td>
                  <td className={td}>
                    {item.estadoActual ? <Badge tone={estadoBadgeTone(item.estadoActual)}>{item.estadoActual}</Badge> : '-'}
                  </td>
                  <td className={td}>{item.profesionalVerificacion?.nombre ?? '-'}</td>
                  <td className={td}>{item.profesionalRecaudador?.nombre ?? '-'}</td>
                  <td className={`${td} text-xs text-ink-600`}>
                    {item.vigencias.length === 0
                      ? '-'
                      : item.vigencias.map((v) => `${v.anio}${v.marcado ? '✓' : ''}`).join(', ')}
                  </td>
                  <td className={`${td} tabular-nums`}>
                    {item.porcentajeAvance === null || item.porcentajeAvance === undefined ? '-' : `${formatDecimal(item.porcentajeAvance)}%`}
                  </td>
                  <td className={td}>
                    <div className="flex gap-3">
                      <Link href={`/verificaciones/${item.idVerificacion}`} className="font-medium text-forest-700 hover:text-forest-900 hover:underline">
                        Editar
                      </Link>
                      <DeleteButton id={item.idVerificacion} />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
