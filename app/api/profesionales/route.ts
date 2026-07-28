import { NextRequest } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { getCurrentUserFromRequest } from '@/lib/session'
import { jsonResponse, errorResponse, unauthorized, forbidden } from '@/lib/api'
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

export async function GET(request: NextRequest) {
  const user = await getCurrentUserFromRequest(request)
  if (!user) return unauthorized()

  if (!esAdmin(user.rol)) {
    // Un usuario estándar solo puede ver su propio registro, nunca el de
    // otros profesionales ni sus roles.
    const data = await prisma.profesional.findMany({
      where: { documento: user.documento },
      select: profesionalSelect,
    })
    return jsonResponse(data)
  }

  const { searchParams } = request.nextUrl
  const incluirInactivos = searchParams.get('inactivos') === 'true'

  const data = await prisma.profesional.findMany({
    where: incluirInactivos ? undefined : { estado: true },
    orderBy: { nombre: 'asc' },
    select: profesionalSelect,
  })

  return jsonResponse(data)
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUserFromRequest(request)
  if (!user) return unauthorized()
  if (!esAdmin(user.rol)) return forbidden()

  const body = (await request.json()) as Record<string, unknown>

  const documento = typeof body.documento === 'string' || typeof body.documento === 'number'
    ? BigInt(String(body.documento))
    : null
  const nombre = typeof body.nombre === 'string' ? body.nombre.trim() : ''
  const correo = typeof body.correo === 'string' ? body.correo.trim() || null : null
  const zona = typeof body.zona === 'string' ? body.zona.trim() || null : null
  const idRol = typeof body.idRol === 'number' ? body.idRol : Number(body.idRol)
  const password = typeof body.password === 'string' ? body.password : ''

  if (!documento || !nombre || Number.isNaN(idRol) || !password) {
    return errorResponse('Documento, nombre, rol y contraseña son obligatorios')
  }

  const exists = await prisma.profesional.findUnique({ where: { documento } })
  if (exists) {
    return errorResponse('Ya existe un profesional con ese documento', 409)
  }

  const data: Prisma.ProfesionalCreateInput = {
    documento,
    nombre,
    correo,
    zona,
    rol: { connect: { idRol } },
    passwordHash: await hashPassword(password),
    estado: true,
  }

  const created = await prisma.profesional.create({
    data,
    select: profesionalSelect,
  })

  return jsonResponse(created, 201)
}
