import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Workspace from '../workspace'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')
  return <Workspace />
}
