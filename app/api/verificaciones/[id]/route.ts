import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUserFromRequest } from '@/lib/session'
import { esAdmin } from '@/lib/permisos'
import { jsonResponse, unauthorized, forbidden, notFound } from '@/lib/api'
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

function puedeAcceder(item: Awaited<ReturnType<typeof prisma.verificacion.findUnique>>, user: { documento: bigint; rol: string }) {
  if (!item) return false
  if (esAdmin(user.rol)) return true
  return item.idProfesionalVerificacion === user.documento
}

type RouteParams = { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, { params }: RouteParams) {
  const user = await getCurrentUserFromRequest(request)
  if (!user) return unauthorized()

  const { id } = await params
  const idVerificacion = Number(id)
  if (Number.isNaN(idVerificacion)) return notFound()

  const item = await prisma.verificacion.findUnique({
    where: { idVerificacion },
    include,
  })

  if (!item) return notFound()
  if (!puedeAcceder(item, user)) return forbidden()

  return jsonResponse(item)
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const user = await getCurrentUserFromRequest(request)
  if (!user) return unauthorized()

  const { id } = await params
  const idVerificacion = Number(id)
  if (Number.isNaN(idVerificacion)) return notFound()

  const existing = await prisma.verificacion.findUnique({
    where: { idVerificacion },
    include: { vigencias: true },
  })
  if (!existing) return notFound()
  if (!puedeAcceder(existing, user)) return forbidden()

  const body = (await request.json()) as Record<string, unknown>

  if (!esAdmin(user.rol) && body.idProfesionalVerificacion !== undefined) {
    if (parseBigInt(body.idProfesionalVerificacion) !== user.documento) {
      return forbidden('No puede reasignar la verificación a otro profesional')
    }
  }

  const vigenciasInput = (body.vigencias as Array<{ idVigencia?: number; anio: number; marcado: boolean }> | undefined) ?? []

  const vigenciasToKeep = vigenciasInput
    .filter((v) => v.anio && !Number.isNaN(Number(v.anio)))
    .map((v) => ({ anio: Number(v.anio), marcado: Boolean(v.marcado) }))

  const data: Prisma.VerificacionUpdateInput = {
    profesionalRecaudador: body.idProfesionalRecaudador
      ? { connect: { documento: parseBigInt(body.idProfesionalRecaudador) } }
      : undefined,
    profesionalVerificacion: body.idProfesionalVerificacion
      ? { connect: { documento: parseBigInt(body.idProfesionalVerificacion) } }
      : undefined,
    tipoInformacion: body.tipoInformacion !== undefined ? String(body.tipoInformacion) : undefined,
    zona: body.zona !== undefined ? (body.zona ? String(body.zona) : null) : undefined,
    fechaEntregaInformacion: body.fechaEntregaInformacion !== undefined ? parseDate(body.fechaEntregaInformacion) : undefined,
    fechaAsignacion: body.fechaAsignacion !== undefined ? parseDate(body.fechaAsignacion) : undefined,
    recaudadorIdentificado: body.recaudadorIdentificado !== undefined ? (body.recaudadorIdentificado ? String(body.recaudadorIdentificado) : null) : undefined,
    nit: body.nit !== undefined ? parseBigInt(body.nit) : undefined,
    razonSocial: body.razonSocial !== undefined ? (body.razonSocial ? String(body.razonSocial) : null) : undefined,
    informacionCompleta: body.informacionCompleta !== undefined ? (body.informacionCompleta ? String(body.informacionCompleta) : null) : undefined,
    fechaCulminacion: body.fechaCulminacion !== undefined ? parseDate(body.fechaCulminacion) : undefined,
    fechaTrasladoRecaudador: body.fechaTrasladoRecaudador !== undefined ? parseDate(body.fechaTrasladoRecaudador) : undefined,
    fechaTrasladoAuditoria: body.fechaTrasladoAuditoria !== undefined ? parseDate(body.fechaTrasladoAuditoria) : undefined,
    valorPendienteCapital: body.valorPendienteCapital !== undefined ? parseDecimal(body.valorPendienteCapital) : undefined,
    valorPendienteIntereses: body.valorPendienteIntereses !== undefined ? parseDecimal(body.valorPendienteIntereses) : undefined,
    valorSaldoFavor: body.valorSaldoFavor !== undefined ? parseDecimal(body.valorSaldoFavor) : undefined,
    estadoActual: body.estadoActual !== undefined ? (body.estadoActual ? String(body.estadoActual) : null) : undefined,
    detalleCertificacion: body.detalleCertificacion !== undefined ? (body.detalleCertificacion ? String(body.detalleCertificacion) : null) : undefined,
    usoPTNuevo: body.usoPTNuevo !== undefined ? (body.usoPTNuevo ? String(body.usoPTNuevo) : null) : undefined,
    porcentajeAvance: body.porcentajeAvance !== undefined ? parseDecimal(body.porcentajeAvance) : undefined,
    observacionProfesional: body.observacionProfesional !== undefined ? (body.observacionProfesional ? String(body.observacionProfesional) : null) : undefined,
    biable: body.biable !== undefined ? (body.biable ? String(body.biable) : null) : undefined,
    correo: body.correo !== undefined ? (body.correo ? String(body.correo) : null) : undefined,
    digitacion: body.digitacion !== undefined ? (body.digitacion ? String(body.digitacion) : null) : undefined,
    motivoRequerimiento: body.motivoRequerimiento !== undefined ? (body.motivoRequerimiento ? String(body.motivoRequerimiento) : null) : undefined,
    envioRequerimiento: body.envioRequerimiento !== undefined ? (body.envioRequerimiento ? String(body.envioRequerimiento) : null) : undefined,
    programacionGestionPresencial: body.programacionGestionPresencial !== undefined ? (body.programacionGestionPresencial ? String(body.programacionGestionPresencial) : null) : undefined,
    verificacionContable: body.verificacionContable !== undefined ? (body.verificacionContable ? String(body.verificacionContable) : null) : undefined,
    etapa: body.etapa !== undefined ? String(body.etapa) : undefined,
    fechaModificacion: new Date(),
    usuarioModificacion: parseBigInt(user.documento),
  }

  await prisma.$transaction([
    prisma.verificacion.update({ where: { idVerificacion }, data }),
    prisma.vigenciaVerificacion.deleteMany({
      where: { idVerificacion, anio: { notIn: vigenciasToKeep.map((v) => v.anio) } },
    }),
    ...vigenciasToKeep.map((v) =>
      prisma.vigenciaVerificacion.upsert({
        where: { idVerificacion_anio: { idVerificacion, anio: v.anio } },
        update: { marcado: v.marcado },
        create: { idVerificacion, anio: v.anio, marcado: v.marcado },
      })
    ),
  ])

  const item = await prisma.verificacion.findUnique({
    where: { idVerificacion },
    include,
  })

  return jsonResponse(item)
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const user = await getCurrentUserFromRequest(request)
  if (!user) return unauthorized()

  const { id } = await params
  const idVerificacion = Number(id)
  if (Number.isNaN(idVerificacion)) return notFound()

  const existing = await prisma.verificacion.findUnique({
    where: { idVerificacion },
  })
  if (!existing) return notFound()
  if (!puedeAcceder(existing, user)) return forbidden()

  await prisma.verificacion.delete({ where: { idVerificacion } })

  return jsonResponse({ success: true })
}
