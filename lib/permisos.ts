export const ROLES = {
  ADMIN: 'ADMINISTRADOR',
  USER: 'USUARIO ESTANDAR',
} as const

export function esAdmin(rol?: string) {
  return rol === ROLES.ADMIN
}

export function filtroPorRol(where: Record<string, unknown>, user: { documento: bigint; rol: string }) {
  if (esAdmin(user.rol)) return where
  return {
    ...where,
    idProfesionalVerificacion: user.documento,
  }
}
