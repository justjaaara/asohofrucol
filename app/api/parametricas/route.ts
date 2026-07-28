import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUserFromRequest } from '@/lib/session'
import { esAdmin } from '@/lib/permisos'
import { jsonResponse, errorResponse, unauthorized, forbidden } from '@/lib/api'

export async function GET(request: NextRequest) {
  const user = await getCurrentUserFromRequest(request)
  if (!user) return unauthorized()

  const { searchParams } = request.nextUrl
  const tipo = searchParams.get('tipo')

  const where: { tipo?: string; activo: boolean } = { activo: true }
  if (tipo) where.tipo = tipo

  const data = await prisma.parametrica.findMany({
    where,
    orderBy: [{ tipo: 'asc' }, { orden: 'asc' }],
    select: { id: true, tipo: true, valor: true, orden: true },
  })

  return jsonResponse(data)
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUserFromRequest(request)
  if (!user) return unauthorized()
  if (!esAdmin(user.rol)) return forbidden()

  const body = (await request.json()) as Record<string, unknown>
  const tipo = typeof body.tipo === 'string' ? body.tipo.trim() : ''
  const valor = typeof body.valor === 'string' ? body.valor.trim() : ''
  const orden = typeof body.orden === 'number' ? body.orden : 0
  const activo = typeof body.activo === 'boolean' ? body.activo : true

  if (!tipo || !valor) {
    return errorResponse('Tipo y valor son obligatorios')
  }

  try {
    const created = await prisma.parametrica.create({
      data: { tipo, valor, orden, activo },
    })
    return jsonResponse(created, 201)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    if (message.includes('Unique constraint')) {
      return errorResponse('Ya existe un valor igual para ese tipo', 409)
    }
    console.error(error)
    return errorResponse('Error al crear la paramétrica', 500)
  }
}

export async function PUT(request: NextRequest) {
  const user = await getCurrentUserFromRequest(request)
  if (!user) return unauthorized()
  if (!esAdmin(user.rol)) return forbidden()

  const body = (await request.json()) as Record<string, unknown>
  const id = typeof body.id === 'number' ? body.id : Number(body.id)
  const valor = typeof body.valor === 'string' ? body.valor.trim() : ''
  const orden = typeof body.orden === 'number' ? body.orden : 0
  const activo = typeof body.activo === 'boolean' ? body.activo : true

  if (Number.isNaN(id) || !valor) {
    return errorResponse('ID y valor son obligatorios')
  }

  const existing = await prisma.parametrica.findUnique({ where: { id } })
  if (!existing) return errorResponse('Paramétrica no encontrada', 404)

  try {
    const updated = await prisma.parametrica.update({
      where: { id },
      data: { valor, orden, activo },
    })
    return jsonResponse(updated)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    if (message.includes('Unique constraint')) {
      return errorResponse('Ya existe un valor igual para ese tipo', 409)
    }
    console.error(error)
    return errorResponse('Error al actualizar la paramétrica', 500)
  }
}
