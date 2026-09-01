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
  // Mismo problema que en proxy.ts: sin secureCookie explícito, getToken()
  // decide el nombre de la cookie según NEXTAUTH_URL, y si esa variable no
  // coincide con el protocolo real, no encuentra la cookie y devuelve null
  // en silencio. Usamos el protocolo real de la petición.
  const secureCookie = req.nextUrl.protocol === 'https:'
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET, secureCookie })
  if (!token?.documento) return null
  return {
    documento: BigInt(token.documento as string),
    idRol: token.idRol as number,
    rol: token.rol as string,
    nombre: token.name as string,
  }
}
