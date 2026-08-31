import { NextRequest } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { getCurrentUserFromRequest } from '@/lib/session'
import { esAdmin } from '@/lib/permisos'
import { jsonResponse, errorResponse, unauthorized, forbidden, notFound } from '@/lib/api'

const includeRelations = {
  vigencias: { orderBy: { anio: 'asc' as const } },
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

function canAccess(
  record: { idProfesionalVerificacion: bigint | null; usuarioCreacion: bigint },
  user: { documento: bigint; rol: string }
) {
  if (esAdmin(user.rol)) return true
  return (
    record.idProfesionalVerificacion === user.documento ||
    record.usuarioCreacion === user.documento
  )
}

async function getRecord(idMaraton: number) {
  return prisma.maraton.findUnique({
    where: { idMaraton },
    include: includeRelations,
  })
}

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, { params }: RouteContext) {
  const user = await getCurrentUserFromRequest(request)
  if (!user) return unauthorized()

  const { id } = await params
  const idMaraton = parseInt(id, 10)
  if (Number.isNaN(idMaraton)) return notFound()

  const record = await getRecord(idMaraton)
  if (!record) return notFound()

  if (!canAccess(record, user)) return forbidden()

  return jsonResponse(record)
}

export async function PUT(request: NextRequest, { params }: RouteContext) {
  const user = await getCurrentUserFromRequest(request)
  if (!user) return unauthorized()

  const { id } = await params
  const idMaraton = parseInt(id, 10)
  if (Number.isNaN(idMaraton)) return notFound()

  const existing = await prisma.maraton.findUnique({
    where: { idMaraton },
    include: { vigencias: true },
  })
  if (!existing) return notFound()

  if (!canAccess(existing, user)) return forbidden()

  const body = await request.json()

  if (!esAdmin(user.rol) && body.idProfesionalVerificacion !== undefined) {
    const idProfesionalVerificacion = toBigInt(body.idProfesionalVerificacion)
    if (idProfesionalVerificacion !== user.documento) {
      return forbidden('No puede reasignar el registro a otro profesional')
    }
  }

  try {
    const scalarData = {
      fechaMaraton: toDate(body.fechaMaraton),
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
      fechaModificacion: new Date(),
      usuarioModificacion: user.documento,
    }

    const vigencias = parseVigencias(body.vigencias)
    const anios = vigencias.map((v) => v.anio)

    const updated = await prisma.$transaction(async (tx) => {
      await tx.maraton.update({
        where: { idMaraton },
        data: scalarData,
      })

      await tx.vigenciaMaraton.deleteMany({
        where: {
          idMaraton,
          anio: { notIn: anios },
        },
      })

      for (const v of vigencias) {
        await tx.vigenciaMaraton.upsert({
          where: {
            idMaraton_anio: {
              idMaraton,
              anio: v.anio,
            },
          },
          update: { marcado: v.marcado },
          create: {
            idMaraton,
            anio: v.anio,
            marcado: v.marcado,
          },
        })
      }

      return tx.maraton.findUnique({
        where: { idMaraton },
        include: includeRelations,
      })
    })

    if (!updated) return notFound()
    return jsonResponse(updated)
  } catch (error) {
    console.error(error)
    return errorResponse('Error al actualizar el registro', 500)
  }
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  const user = await getCurrentUserFromRequest(request)
  if (!user) return unauthorized()

  const { id } = await params
  const idMaraton = parseInt(id, 10)
  if (Number.isNaN(idMaraton)) return notFound()

  const existing = await prisma.maraton.findUnique({
    where: { idMaraton },
  })
  if (!existing) return notFound()

  if (!canAccess(existing, user)) return forbidden()

  try {
    await prisma.maraton.delete({ where: { idMaraton } })
    return jsonResponse({ ok: true })
  } catch (error) {
    console.error(error)
    return errorResponse('Error al eliminar el registro', 500)
  }
}
