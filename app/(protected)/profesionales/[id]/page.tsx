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

export default async function EditarProfesionalPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const admin = esAdmin(user.rol)
  if (!admin && user.documento.toString() !== id) {
    redirect('/profesionales')
  }

  const [profesional, roles, zonas] = await Promise.all([
    fetchApi<Profesional>(`/api/profesionales/${id}`),
    fetchApi<Rol[]>('/api/roles'),
    fetchApi<{ valor: string }[]>('/api/parametricas?tipo=Zona'),
  ])

  if (!profesional || !roles) {
    redirect('/profesionales')
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Editar profesional" />
      <ProfesionalForm profesional={profesional} roles={roles} zonas={zonas ?? []} isAdmin={admin} />
    </div>
  )
}
