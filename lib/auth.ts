import { compare, hash } from 'bcryptjs'
import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from './prisma'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        documento: { label: 'Documento', type: 'text' },
        password: { label: 'Contraseña', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.documento || !credentials?.password) return null

        const documento = BigInt(credentials.documento)

        const profesional = await prisma.profesional.findUnique({
          where: { documento },
          include: { rol: true },
        })

        if (!profesional || !profesional.estado || !profesional.passwordHash) {
          return null
        }

        const valid = await compare(credentials.password, profesional.passwordHash)
        if (!valid) return null

        return {
          id: profesional.documento.toString(),
          documento: profesional.documento.toString(),
          name: profesional.nombre,
          email: profesional.correo ?? '',
          idRol: profesional.idRol,
          rol: profesional.rol.nombre,
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.documento = user.documento
        token.idRol = user.idRol
        token.rol = user.rol
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.documento = token.documento as string
        session.user.idRol = token.idRol as number
        session.user.rol = token.rol as string
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
  },
}

export async function hashPassword(password: string) {
  return hash(password, 10)
}
