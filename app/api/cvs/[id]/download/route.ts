import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'غير مصرح.' }, { status: 401 })
  const { id } = await params
  const { data: candidate } = await supabase.from('candidates').select('cv_path, jobs!inner(user_id)').eq('id', id).eq('jobs.user_id', user.id).single()
  if (!candidate?.cv_path) return NextResponse.json({ error: 'السيرة الذاتية غير موجودة.' }, { status: 404 })
  if (!candidate.cv_path.startsWith(`${user.id}/`)) return NextResponse.json({ error: 'غير مصرح.' }, { status: 403 })
  const { data, error } = await supabase.storage.from('cvs').createSignedUrl(candidate.cv_path, 60)
  if (error || !data?.signedUrl) return NextResponse.json({ error: 'تعذر إنشاء رابط التحميل.' }, { status: 500 })
  return NextResponse.redirect(data.signedUrl)
}
