import { NextRequest } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { getCurrentUserFromRequest } from '@/lib/session'
import { jsonResponse, notFound, unauthorized, forbidden } from '@/lib/api'
import { hashPassword } from '@/lib/auth'
import { esAdmin } from '@/lib/permisos'

const profesionalSelect = {
  documento: true,
  nombre: true,
  correo: true,
  zona: true,
  idRol: true,
  estado: true,
  rol: true,
} as const

function parseDocumento(id: string): bigint | null {
  try {
    return BigInt(id)
  } catch {
    return null
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const user = await getCurrentUserFromRequest(request)
  if (!user) return unauthorized()

  const documento = parseDocumento(id)
  if (!documento) return notFound()

  const profesional = await prisma.profesional.findUnique({
    where: { documento },
    select: profesionalSelect,
  })
  if (!profesional) return notFound()

  if (!esAdmin(user.rol) && user.documento !== documento) {
    return forbidden()
  }

  return jsonResponse(profesional)
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const user = await getCurrentUserFromRequest(request)
  if (!user) return unauthorized()

  const documento = parseDocumento(id)
  if (!documento) return notFound()

  const profesional = await prisma.profesional.findUnique({
    where: { documento },
  })
  if (!profesional) return notFound()

  const admin = esAdmin(user.rol)
  if (!admin && user.documento !== documento) {
    return forbidden()
  }

  const body = await request.json()
  const { nombre, correo, zona, idRol, password } = body

  const data: Prisma.ProfesionalUncheckedUpdateInput = {}
  if (nombre !== undefined) data.nombre = nombre
  if (correo !== undefined) data.correo = correo || null
  if (zona !== undefined) data.zona = zona || null
  if (admin && idRol !== undefined) data.idRol = Number(idRol)

  if (password && typeof password === 'string' && password.length > 0) {
    data.passwordHash = await hashPassword(password)
  }

  const updated = await prisma.profesional.update({
    where: { documento },
    data,
    select: profesionalSelect,
  })

  return jsonResponse(updated)
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUserFromRequest(request)
  if (!user || !esAdmin(user.rol)) return forbidden()

  const { id } = await params
  const documento = parseDocumento(id)
  if (!documento) return notFound()

  const profesional = await prisma.profesional.findUnique({
    where: { documento },
  })
  if (!profesional) return notFound()

  await prisma.profesional.update({
    where: { documento },
    data: { estado: false },
  })

  return jsonResponse({ ok: true })
}
