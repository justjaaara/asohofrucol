import { DefaultUser } from 'next-auth'

declare module 'next-auth' {
  interface User extends DefaultUser {
    documento: string
    idRol: number
    rol: string
  }

  interface Session {
    user: User
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    documento?: string
    idRol?: number
    rol?: string
  }
}
