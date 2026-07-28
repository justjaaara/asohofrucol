import { NextRequest } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { getCurrentUserFromRequest } from '@/lib/session'
import { filtroPorRol, esAdmin } from '@/lib/permisos'
import { jsonResponse, errorResponse, unauthorized, forbidden } from '@/lib/api'

const includeRelations = {
  vigencias: { orderBy: { anio: 'asc' as const } },
  profesionalRecaudador: { select: { documento: true, nombre: true } },
  profesionalVerificacion: { select: { documento: true, nombre: true } },
}

function toBigInt(value: unknown): bigint | null {
  if (value === '' || value == null) return null
  return BigInt(String(value))
}

function toInt(value: unknown): number | null {
  if (value === '' || value == null) return null
  const parsed = parseInt(String(value), 10)
  return Number.isNaN(parsed) ? null : parsed
}

function toDecimal(value: unknown): Prisma.Decimal | null {
  if (value === '' || value == null) return null
  return new Prisma.Decimal(String(value))
}

function toDate(value: unknown): Date | null {
  if (!value) return null
  const date = new Date(String(value))
  return Number.isNaN(date.getTime()) ? null : date
}

function parseVigencias(input: unknown) {
  if (!Array.isArray(input)) return []
  return input
    .map((v) => ({
      anio: parseInt(String(v.anio), 10),
      marcado: Boolean(v.marcado),
    }))
    .filter((v) => !Number.isNaN(v.anio))
}

function buildWhere(searchParams: URLSearchParams) {
  const where: Record<string, unknown> = {}

  const q = searchParams.get('q')
  if (q) {
    const conditions: Record<string, unknown>[] = [
      { razonSocial: { contains: q } },
    ]
    try {
      conditions.push({ nit: { equals: BigInt(q) } })
    } catch {
      // q no es numérico, ignorar filtro por NIT
    }
    where.OR = conditions
  }

  const razonSocial = searchParams.get('razonSocial')
  if (razonSocial) where.razonSocial = { contains: razonSocial }

  const nit = searchParams.get('nit')
  if (nit) {
    try {
      where.nit = { equals: BigInt(nit) }
    } catch {
      // ignorar NIT inválido
    }
  }

  const culminado = searchParams.get('culminado')
  if (culminado) where.culminado = culminado

  const usoPTNuevo = searchParams.get('usoPTNuevo')
  if (usoPTNuevo) where.usoPTNuevo = usoPTNuevo

  const recaudadorIdentificado = searchParams.get('recaudadorIdentificado')
  if (recaudadorIdentificado) where.recaudadorIdentificado = recaudadorIdentificado

  const recaudador = searchParams.get('idProfesionalRecaudador')
  if (recaudador) {
    try {
      where.idProfesionalRecaudador = BigInt(recaudador)
    } catch {
      // ignorar
    }
  }

  const verificador = searchParams.get('idProfesionalVerificacion')
  if (verificador) {
    try {
      where.idProfesionalVerificacion = BigInt(verificador)
    } catch {
      // ignorar
    }
  }

  const fechaDesde = searchParams.get('fechaDesde')
  const fechaHasta = searchParams.get('fechaHasta')
  if (fechaDesde || fechaHasta) {
    const fechaFilter: Record<string, Date> = {}
    if (fechaDesde) fechaFilter.gte = new Date(fechaDesde)
    if (fechaHasta) fechaFilter.lte = new Date(fechaHasta + 'T23:59:59.999Z')
    where.fechaMaraton = fechaFilter
  }

  return where
}

export async function GET(request: NextRequest) {
  const user = await getCurrentUserFromRequest(request)
  if (!user) return unauthorized()

  const { searchParams } = request.nextUrl
  const where = buildWhere(searchParams)
  const whereWithRol = filtroPorRol(where, user)

  const take = toInt(searchParams.get('limite')) ?? 50
  const skip = toInt(searchParams.get('offset')) ?? 0

  const [data, total] = await Promise.all([
    prisma.maraton.findMany({
      where: whereWithRol,
      include: includeRelations,
      orderBy: { idMaraton: 'desc' },
      take,
      skip,
    }),
    prisma.maraton.count({ where: whereWithRol }),
  ])

  return jsonResponse({ data, total })
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUserFromRequest(request)
  if (!user) return unauthorized()

  const body = await request.json()

  if (!body.nit) {
    return errorResponse('El NIT es obligatorio')
  }

  const idProfesionalVerificacion = toBigInt(body.idProfesionalVerificacion)
  if (!esAdmin(user.rol) && idProfesionalVerificacion !== user.documento) {
    return forbidden('Solo puede asignar registros de maratón a su propio usuario')
  }

  try {
    const data = {
      fechaMaraton: toDate(body.fechaMaraton),
      idProfesionalRecaudador: toBigInt(body.idProfesionalRecaudador),
      idProfesionalVerificacion: toBigInt(body.idProfesionalVerificacion),
      recaudadorIdentificado: body.recaudadorIdentificado || null,
      nit: BigInt(String(body.nit)),
      razonSocial: body.razonSocial || null,
      numeroVigencias: toInt(body.numeroVigencias),
      porcentajeEstadoVerificacion: toDecimal(body.porcentajeEstadoVerificacion),
      culminado: body.culminado || null,
      porcentajeAvance: toDecimal(body.porcentajeAvance),
      totalAvance: toDecimal(body.totalAvance),
      valorPendienteCapital: toDecimal(body.valorPendienteCapital),
      valorPendienteIntereses: toDecimal(body.valorPendienteIntereses),
      valorSaldoFavor: toDecimal(body.valorSaldoFavor),
      usoPTNuevo: body.usoPTNuevo || null,
      observacionCulminacion: body.observacionCulminacion || null,
      observacionCoordinacion: body.observacionCoordinacion || null,
      usuarioCreacion: user.documento,
      vigencias: { create: parseVigencias(body.vigencias) },
    }

    const created = await prisma.maraton.create({
      data,
      include: includeRelations,
    })

    return jsonResponse(created, 201)
  } catch (error) {
    console.error(error)
    return errorResponse('Error al crear el registro', 500)
  }
}
