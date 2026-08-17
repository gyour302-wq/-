import { randomBytes } from 'node:crypto'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  const body = await request.json().catch(() => null); const jobId = body?.jobId as string; const candidateIds = Array.isArray(body?.candidateIds) ? body.candidateIds.slice(0, 100) : []
  if (!jobId) return NextResponse.json({ error: 'الوظيفة مطلوبة' }, { status: 400 })
  const { data: job } = await supabase.from('jobs').select('id,title,description').eq('id', jobId).eq('user_id', user.id).single()
  if (!job) return NextResponse.json({ error: 'الوظيفة غير موجودة' }, { status: 404 })
  const token = randomBytes(24).toString('base64url')
  const { data: candidates } = await supabase.from('candidates').select('id').eq('job_id', job.id).in('id', candidateIds)
  const allowedCandidateIds = candidates?.map((candidate) => candidate.id) ?? []
  const { error } = await supabase.from('shared_jobs').insert({ job_id: job.id, user_id: user.id, token, title: job.title, intro: body?.intro ?? 'قائمة المرشحين المختارة للمراجعة.', candidate_ids: allowedCandidateIds })
  if (error) return NextResponse.json({ error: 'تعذر إنشاء الرابط' }, { status: 500 })
  return NextResponse.json({ url: `/share/${token}` })
}
