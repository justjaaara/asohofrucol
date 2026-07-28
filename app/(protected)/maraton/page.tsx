import { redirect } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/session'
import { filtroPorRol } from '@/lib/permisos'
import { serialize } from '@/lib/serialize'
import { DeleteButton } from '@/components/maraton/DeleteButton'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { Field, Input, Select } from '@/components/ui/Field'
import { Badge, siNoBadgeTone } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { buttonClass } from '@/components/ui/Button'
import { tableWrap, theadRow, th, tr, td } from '@/components/ui/table'

interface SearchParams {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

function getFirst(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

function buildWhere(
  params: Record<string, string | string[] | undefined>
) {
  const where: Record<string, unknown> = {}

  const q = getFirst(params.q)
  if (q) {
    const conditions: Record<string, unknown>[] = [
      { razonSocial: { contains: q } },
    ]
    try {
      conditions.push({ nit: { equals: BigInt(q) } })
    } catch {
      // ignore invalid nit
    }
    where.OR = conditions
  }

  const razonSocial = getFirst(params.razonSocial)
  if (razonSocial) where.razonSocial = { contains: razonSocial }

  const nit = getFirst(params.nit)
  if (nit) {
    try {
      where.nit = { equals: BigInt(nit) }
    } catch {
      // ignore invalid nit
    }
  }

  const culminado = getFirst(params.culminado)
  if (culminado) where.culminado = culminado

  const usoPTNuevo = getFirst(params.usoPTNuevo)
  if (usoPTNuevo) where.usoPTNuevo = usoPTNuevo

  const recaudadorIdentificado = getFirst(params.recaudadorIdentificado)
  if (recaudadorIdentificado) where.recaudadorIdentificado = recaudadorIdentificado

  const recaudador = getFirst(params.idProfesionalRecaudador)
  if (recaudador) {
    try {
      where.idProfesionalRecaudador = BigInt(recaudador)
    } catch {
      // ignore
    }
  }

  const verificador = getFirst(params.idProfesionalVerificacion)
  if (verificador) {
    try {
      where.idProfesionalVerificacion = BigInt(verificador)
    } catch {
      // ignore
    }
  }

  const fechaDesde = getFirst(params.fechaDesde)
  const fechaHasta = getFirst(params.fechaHasta)
  if (fechaDesde || fechaHasta) {
    const fechaFilter: Record<string, Date> = {}
    if (fechaDesde) fechaFilter.gte = new Date(fechaDesde)
    if (fechaHasta) fechaFilter.lte = new Date(fechaHasta + 'T23:59:59.999Z')
    where.fechaMaraton = fechaFilter
  }

  return where
}

export default async function MaratonPage({ searchParams }: SearchParams) {
  const params = await searchParams
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const where = buildWhere(params)
  const whereWithRol = filtroPorRol(where, user)

  const [data, total, profesionales, parametricas] = await Promise.all([
    prisma.maraton.findMany({
      where: whereWithRol,
      include: {
        vigencias: { orderBy: { anio: 'asc' } },
        profesionalRecaudador: { select: { documento: true, nombre: true } },
        profesionalVerificacion: { select: { documento: true, nombre: true } },
      },
      orderBy: { idMaraton: 'desc' },
      take: 50,
      skip: 0,
    }),
    prisma.maraton.count({ where: whereWithRol }),
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

  const records = serialize(data)
  const professionals = serialize(profesionales)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Maratón"
        description={`Total: ${total} registro${total === 1 ? '' : 's'}`}
        actions={
          <Link href="/maraton/nuevo" className={buttonClass('primary')}>
            + Nuevo registro
          </Link>
        }
      />

      <Card className="p-4">
        <form method="get" action="/maraton" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Buscar" htmlFor="q">
            <Input id="q" type="text" name="q" defaultValue={getFirst(params.q) ?? ''} placeholder="NIT o razón social" />
          </Field>

          <Field label="Verificador" htmlFor="idProfesionalVerificacion">
            <Select
              id="idProfesionalVerificacion"
              name="idProfesionalVerificacion"
              defaultValue={getFirst(params.idProfesionalVerificacion) ?? ''}
            >
              <option value="">Todos</option>
              {professionals.map((p) => (
                <option key={p.documento} value={p.documento}>
                  {p.nombre}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Recaudador identificado" htmlFor="recaudadorIdentificado">
            <Select
              id="recaudadorIdentificado"
              name="recaudadorIdentificado"
              defaultValue={getFirst(params.recaudadorIdentificado) ?? ''}
            >
              <option value="">Todos</option>
              {recaudadores.map((p) => (
                <option key={p.id} value={p.valor}>
                  {p.valor}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Culminado" htmlFor="culminado">
            <Select id="culminado" name="culminado" defaultValue={getFirst(params.culminado) ?? ''}>
              <option value="">Todos</option>
              {siNo.map((p) => (
                <option key={p.id} value={p.valor}>
                  {p.valor}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Uso PT nuevo" htmlFor="usoPTNuevo">
            <Select id="usoPTNuevo" name="usoPTNuevo" defaultValue={getFirst(params.usoPTNuevo) ?? ''}>
              <option value="">Todos</option>
              {siNo.map((p) => (
                <option key={p.id} value={p.valor}>
                  {p.valor}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Fecha desde" htmlFor="fechaDesde">
            <Input id="fechaDesde" type="date" name="fechaDesde" defaultValue={getFirst(params.fechaDesde) ?? ''} />
          </Field>

          <Field label="Fecha hasta" htmlFor="fechaHasta">
            <Input id="fechaHasta" type="date" name="fechaHasta" defaultValue={getFirst(params.fechaHasta) ?? ''} />
          </Field>

          <div className="flex items-end gap-2">
            <button type="submit" className={buttonClass('secondary')}>
              Filtrar
            </button>
            <Link href="/maraton" className={buttonClass('ghost')}>
              Limpiar
            </Link>
          </div>
        </form>
      </Card>

      <div className={tableWrap}>
        <table className="w-full text-sm">
          <thead className={theadRow}>
            <tr>
              <th className={th}>ID</th>
              <th className={th}>Fecha</th>
              <th className={th}>NIT</th>
              <th className={th}>Razón social</th>
              <th className={th}>Recaudador</th>
              <th className={th}>Verificador</th>
              <th className={th}>Culminado</th>
              <th className={th}>Vigencias</th>
              <th className={th}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {records.map((item) => (
              <tr key={item.idMaraton} className={tr}>
                <td className={`${td} tabular-nums text-ink-400`}>{item.idMaraton}</td>
                <td className={`${td} tabular-nums`}>
                  {item.fechaMaraton
                    ? new Date(item.fechaMaraton).toLocaleDateString('es-CO')
                    : '-'}
                </td>
                <td className={`${td} tabular-nums font-medium`}>{item.nit}</td>
                <td className={td}>{item.razonSocial || '-'}</td>
                <td className={td}>{item.profesionalRecaudador?.nombre ?? '-'}</td>
                <td className={td}>{item.profesionalVerificacion?.nombre ?? '-'}</td>
                <td className={td}>
                  {item.culminado ? <Badge tone={siNoBadgeTone(item.culminado)}>{item.culminado}</Badge> : '-'}
                </td>
                <td className={`${td} text-xs text-ink-600`}>
                  {item.vigencias?.map((v) => v.anio).join(', ') || '-'}
                </td>
                <td className={td}>
                  <div className="flex items-center gap-3">
                    <Link
                      href={`/maraton/${item.idMaraton}`}
                      className="font-medium text-forest-700 hover:text-forest-900 hover:underline"
                    >
                      Editar
                    </Link>
                    <DeleteButton id={item.idMaraton} />
                  </div>
                </td>
              </tr>
            ))}
            {records.length === 0 && (
              <tr>
                <td colSpan={9}>
                  <EmptyState message="No se encontraron registros de maratón con los filtros seleccionados." />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
