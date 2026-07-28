import { getServerSession } from 'next-auth/next'
import { getToken } from 'next-auth/jwt'
import { NextRequest } from 'next/server'
import { authOptions } from './auth'

export async function getSession() {
  return getServerSession(authOptions)
}

export async function getCurrentUser() {
  const session = await getSession()
  if (!session?.user) return null
  return {
    documento: BigInt(session.user.documento),
    idRol: session.user.idRol,
    rol: session.user.rol,
    nombre: session.user.name ?? '',
  }
}

export async function getCurrentUserFromRequest(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  if (!token?.documento) return null
  return {
    documento: BigInt(token.documento as string),
    idRol: token.idRol as number,
    rol: token.rol as string,
    nombre: token.name as string,
  }
}
