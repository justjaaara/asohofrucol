import Link from 'next/link'
import { redirect } from 'next/navigation'
import { cookies, headers } from 'next/headers'
import { getCurrentUser } from '@/lib/session'
import { esAdmin } from '@/lib/permisos'
import { ProfesionalDeleteButton } from '@/components/profesionales/ProfesionalDeleteButton'
import { PageHeader } from '@/components/ui/PageHeader'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { buttonClass } from '@/components/ui/Button'
import { tableWrap, theadRow, th, tr, td } from '@/components/ui/table'

type Rol = {
  idRol: number
  nombre: string
}

type Profesional = {
  documento: string
  nombre: string
  correo?: string | null
  zona?: string | null
  estado: boolean
  idRol: number
  rol: Rol
}

async function fetchApi<T>(path: string): Promise<T | null> {
  try {
    const cookieStore = await cookies()
    const headersList = await headers()
    const host = headersList.get('host') ?? 'localhost:3000'
    const protocol = host.includes('localhost') ? 'http' : 'https'

    const res = await fetch(`${protocol}://${host}${path}`, {
      headers: { Cookie: cookieStore.toString() },
      cache: 'no-store',
    })

    if (!res.ok) return null
    return (await res.json()) as T
  } catch {
    return null
  }
}

export default async function ProfesionalesPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const admin = esAdmin(user.rol)
  if (!admin) {
    // Un usuario estándar no debe poder ver el listado de otros profesionales
    // ni sus roles — solo gestiona su propio perfil.
    redirect(`/profesionales/${user.documento}`)
  }

  const profesionales = await fetchApi<Profesional[]>('/api/profesionales')
  const userDocumento = user.documento.toString()

  return (
    <div className="space-y-6">
      <PageHeader
        title="Profesionales"
        description={`${profesionales?.length ?? 0} profesional${(profesionales?.length ?? 0) === 1 ? '' : 'es'} activo${(profesionales?.length ?? 0) === 1 ? '' : 's'}`}
        actions={
          admin && (
            <Link href="/profesionales/nuevo" className={buttonClass('primary')}>
              + Nuevo profesional
            </Link>
          )
        }
      />

      <div className={tableWrap}>
        <table className="w-full text-left text-sm">
          <thead className={theadRow}>
            <tr>
              <th className={th}>Documento</th>
              <th className={th}>Nombre</th>
              <th className={th}>Correo</th>
              <th className={th}>Zona</th>
              <th className={th}>Rol</th>
              <th className={th}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {profesionales?.map((p) => (
              <tr key={p.documento} className={tr}>
                <td className={`${td} tabular-nums`}>{p.documento}</td>
                <td className={`${td} font-medium`}>{p.nombre}</td>
                <td className={td}>{p.correo ?? '-'}</td>
                <td className={td}>{p.zona ?? '-'}</td>
                <td className={td}>
                  <Badge tone={p.rol.nombre === 'ADMINISTRADOR' ? 'warning' : 'neutral'}>{p.rol.nombre}</Badge>
                </td>
                <td className={td}>
                  <div className="flex items-center gap-3">
                    {(admin || p.documento === userDocumento) && (
                      <Link
                        href={`/profesionales/${p.documento}`}
                        className="font-medium text-forest-700 hover:text-forest-900 hover:underline"
                      >
                        Editar
                      </Link>
                    )}
                    {admin && p.documento !== userDocumento && (
                      <ProfesionalDeleteButton id={p.documento} />
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {(!profesionales || profesionales.length === 0) && (
              <tr>
                <td colSpan={6}>
                  <EmptyState message="No hay profesionales activos registrados." />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
