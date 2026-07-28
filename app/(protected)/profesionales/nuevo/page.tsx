import { redirect } from 'next/navigation'
import { cookies, headers } from 'next/headers'
import { getCurrentUser } from '@/lib/session'
import { esAdmin } from '@/lib/permisos'
import { ProfesionalForm } from '@/components/profesionales/ProfesionalForm'
import { PageHeader } from '@/components/ui/PageHeader'

type Rol = {
  idRol: number
  nombre: string
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

export default async function NuevoProfesionalPage() {
  const user = await getCurrentUser()
  if (!user || !esAdmin(user.rol)) {
    redirect('/profesionales')
  }

  const [roles, zonas] = await Promise.all([
    fetchApi<Rol[]>('/api/roles'),
    fetchApi<{ valor: string }[]>('/api/parametricas?tipo=Zona'),
  ])

  return (
    <div className="space-y-6">
      <PageHeader title="Nuevo profesional" />
      <ProfesionalForm roles={roles ?? []} zonas={zonas ?? []} isAdmin />
    </div>
  )
}
