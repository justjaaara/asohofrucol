import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUserFromRequest } from '@/lib/session'
import { jsonResponse, unauthorized } from '@/lib/api'

export async function GET(request: NextRequest) {
  const user = await getCurrentUserFromRequest(request)
  if (!user) return unauthorized()

  const roles = await prisma.rol.findMany({
    orderBy: { nombre: 'asc' },
  })

  return jsonResponse(roles)
}
