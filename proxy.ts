import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

const protectedPrefixes = ['/dashboard', '/verificaciones', '/profesionales', '/maraton', '/parametricas']
const apiProtectedPrefixes = ['/api/verificaciones', '/api/profesionales', '/api/maraton', '/api/parametricas']

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  const isProtected =
    protectedPrefixes.some((p) => pathname.startsWith(p)) ||
    apiProtectedPrefixes.some((p) => pathname.startsWith(p))

  if (!isProtected) return NextResponse.next()

  // getToken() por defecto decide el nombre de la cookie de sesión
  // (`__Secure-...` o no) según si NEXTAUTH_URL empieza con "https://" — si
  // esa variable está mal puesta en el entorno de despliegue, busca la
  // cookie equivocada y todo el mundo queda "sin sesión" en silencio. Usamos
  // el protocolo real de la petición (que Next ya resuelve vía
  // x-forwarded-proto) en vez de confiar en esa variable.
  const secureCookie = request.nextUrl.protocol === 'https:'
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET, secureCookie })
  if (!token) {
    if (pathname.startsWith('/api')) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Un usuario estándar no debe ver el listado de profesionales ni sus roles —
  // se le lleva directo a su propio perfil antes de que la página se renderice.
  if (pathname === '/profesionales' && token.rol !== 'ADMINISTRADOR' && token.documento) {
    return NextResponse.redirect(new URL(`/profesionales/${token.documento}`, request.url))
  }

  return NextResponse.next()
}

export const proxyConfig = {
  matcher: ['/dashboard/:path*', '/verificaciones/:path*', '/profesionales/:path*', '/maraton/:path*', '/parametricas/:path*', '/api/:path*'],
}
