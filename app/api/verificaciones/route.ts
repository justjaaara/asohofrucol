import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUserFromRequest } from '@/lib/session'
import { filtroPorRol, esAdmin } from '@/lib/permisos'
import { jsonResponse, errorResponse, unauthorized, forbidden } from '@/lib/api'
import { Prisma } from '@prisma/client'

const include = {
  vigencias: { orderBy: { anio: 'asc' as const } },
  profesionalRecaudador: { select: { documento: true, nombre: true } },
  profesionalVerificacion: { select: { documento: true, nombre: true } },
  creador: { select: { documento: true, nombre: true } },
}

function parseDate(value: unknown): Date | null {
  if (value === null || value === undefined || value === '') return null
  return new Date(value as string)
}

function parseDecimal(value: unknown): string | null {
  if (value === null || value === undefined || value === '') return null
  return String(value)
}

function parseBigInt(value: unknown): bigint {
  if (typeof value === 'bigint') return value
  return BigInt(value as string | number)
}

function buildWhere(searchParams: URLSearchParams): Prisma.VerificacionWhereInput {
  const where: Prisma.VerificacionWhereInput = {}

  const etapa = searchParams.get('etapa')
  if (etapa) where.etapa = etapa

  const zona = searchParams.get('zona')
  if (zona) where.zona = zona

  const estadoActual = searchParams.get('estadoActual')
  if (estadoActual) where.estadoActual = estadoActual

  const nit = searchParams.get('nit')
  if (nit && !Number.isNaN(Number(nit))) where.nit = BigInt(nit)

  const profesional = searchParams.get('profesional')
  if (profesional && !Number.isNaN(Number(profesional))) {
    where.idProfesionalVerificacion = BigInt(profesional)
  }

  const search = searchParams.get('search')
  if (search) {
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

export async function GET(request: NextRequest) {
  const user = await getCurrentUserFromRequest(request)
  if (!user) return unauthorized()

  const { searchParams } = new URL(request.url)
  const where = filtroPorRol(buildWhere(searchParams), user)

  const [items, count] = await Promise.all([
    prisma.verificacion.findMany({
      where,
      include,
      orderBy: { idVerificacion: 'desc' },
    }),
    prisma.verificacion.count({ where }),
  ])

  return jsonResponse({ items, count })
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUserFromRequest(request)
  if (!user) return unauthorized()

  const body = (await request.json()) as Record<string, unknown>

  const required: (keyof typeof body)[] = ['idProfesionalRecaudador', 'idProfesionalVerificacion', 'tipoInformacion', 'nit', 'etapa']
  for (const field of required) {
    if (body[field] === undefined || body[field] === null || body[field] === '') {
      return errorResponse(`El campo ${field} es obligatorio`)
    }
  }

  const idProfesionalVerificacion = parseBigInt(body.idProfesionalVerificacion)
  if (!esAdmin(user.rol) && idProfesionalVerificacion !== user.documento) {
    return forbidden('Solo puede asignar verificaciones a su propio usuario')
  }

  const vigenciasInput = (body.vigencias as Array<{ anio: number; marcado: boolean }> | undefined) ?? []
  const vigencias = vigenciasInput
    .filter((v) => v.anio && !Number.isNaN(Number(v.anio)))
    .map((v) => ({ anio: Number(v.anio), marcado: Boolean(v.marcado) }))

  const data: Prisma.VerificacionUncheckedCreateInput = {
    idProfesionalRecaudador: parseBigInt(body.idProfesionalRecaudador),
    idProfesionalVerificacion,
    tipoInformacion: String(body.tipoInformacion),
    zona: body.zona ? String(body.zona) : null,
    fechaEntregaInformacion: parseDate(body.fechaEntregaInformacion),
    fechaAsignacion: parseDate(body.fechaAsignacion),
    recaudadorIdentificado: body.recaudadorIdentificado ? String(body.recaudadorIdentificado) : null,
    nit: parseBigInt(body.nit),
    razonSocial: body.razonSocial ? String(body.razonSocial) : null,
    informacionCompleta: body.informacionCompleta ? String(body.informacionCompleta) : null,
    fechaCulminacion: parseDate(body.fechaCulminacion),
    fechaTrasladoRecaudador: parseDate(body.fechaTrasladoRecaudador),
    fechaTrasladoAuditoria: parseDate(body.fechaTrasladoAuditoria),
    valorPendienteCapital: parseDecimal(body.valorPendienteCapital),
    valorPendienteIntereses: parseDecimal(body.valorPendienteIntereses),
    valorSaldoFavor: parseDecimal(body.valorSaldoFavor),
    estadoActual: body.estadoActual ? String(body.estadoActual) : null,
    detalleCertificacion: body.detalleCertificacion ? String(body.detalleCertificacion) : null,
    usoPTNuevo: body.usoPTNuevo ? String(body.usoPTNuevo) : null,
    porcentajeAvance: parseDecimal(body.porcentajeAvance),
    observacionProfesional: body.observacionProfesional ? String(body.observacionProfesional) : null,
    biable: body.biable ? String(body.biable) : null,
    correo: body.correo ? String(body.correo) : null,
    digitacion: body.digitacion ? String(body.digitacion) : null,
    motivoRequerimiento: body.motivoRequerimiento ? String(body.motivoRequerimiento) : null,
    envioRequerimiento: body.envioRequerimiento ? String(body.envioRequerimiento) : null,
    programacionGestionPresencial: body.programacionGestionPresencial ? String(body.programacionGestionPresencial) : null,
    verificacionContable: body.verificacionContable ? String(body.verificacionContable) : null,
    etapa: String(body.etapa),
    usuarioCreacion: parseBigInt(user.documento),
    vigencias: vigencias.length ? { create: vigencias } : undefined,
  }

  const item = await prisma.verificacion.create({
    data,
    include,
  })

  return jsonResponse(item, 201)
}
