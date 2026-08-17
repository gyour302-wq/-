import { notFound } from 'next/navigation'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

function createPublicShareClient() {
  return createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

export default async function SharePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params; const supabase = createPublicShareClient()
  const { data: share } = await supabase.from('shared_jobs').select('title,intro,candidate_ids,expires_at').eq('token', token).maybeSingle()
  if (!share || (share.expires_at && new Date(share.expires_at) < new Date())) notFound()
  const ids = share.candidate_ids ?? []
  const { data: candidates } = await supabase.from('candidates').select('name,skills,experience_years,match_score,status').in('id', ids).order('match_score', { ascending: false })
  return <main dir="rtl" className="min-h-screen bg-[#08111f] px-5 py-12 text-slate-200"><div className="mx-auto max-w-4xl"><div className="mb-10"><div className="mb-4 text-sm font-bold text-indigo-300">ShortlistIQ</div><h1 className="text-3xl font-bold text-white">{share.title}</h1><p className="mt-3 max-w-2xl text-slate-400">{share.intro}</p></div><div className="grid gap-4 md:grid-cols-2">{(candidates ?? []).map((candidate) => <article key={candidate.name} className="rounded-2xl border border-white/10 bg-[#0d192b] p-5"><div className="flex items-center justify-between"><h2 className="font-bold text-white">{candidate.name}</h2><span className="font-mono text-emerald-400">{candidate.match_score}%</span></div><p className="mt-3 text-sm text-slate-500">{candidate.experience_years} سنوات خبرة</p><div className="mt-4 flex flex-wrap gap-2">{(candidate.skills ?? []).slice(0, 6).map((skill: string) => <span key={skill} className="rounded-md bg-white/[0.06] px-2 py-1 text-xs text-slate-300">{skill}</span>)}</div></article>)}</div>{!candidates?.length && <p className="rounded-2xl border border-white/10 bg-[#0d192b] p-6 text-center text-slate-500">لا توجد مرشحات مشتركة في هذا الرابط.</p>}</div></main>
}
