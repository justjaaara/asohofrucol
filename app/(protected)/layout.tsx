import { redirect } from 'next/navigation'
import { getSession } from '@/lib/session'
import { Nav } from '@/components/Nav'

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()
  if (!session?.user) {
    redirect('/login')
  }

  return (
    <>
      <Nav />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8">{children}</main>
    </>
  )
}
