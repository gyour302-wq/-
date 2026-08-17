'use client'

import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import {
  Bell, BriefcaseBusiness, Check, ChevronDown, ChevronLeft, ChevronRight, Clock3,
  FileText, Filter, LayoutDashboard, Link2, Menu, MoreHorizontal, Search, Settings,
  SlidersHorizontal, Sparkles, Upload, Users, X, Zap,
} from 'lucide-react'

type Candidate = { name: string; role: string; score: number; stage: string; initials: string; color: string; location: string; experience: string; cvId?: string }
type Job = { title: string; department: string; candidates: number; date: string; status: string; accent: string }

const candidates: Candidate[] = [
  { name: 'سارة العتيبي', role: 'مصممة تجربة مستخدم', score: 94, stage: 'مطابقة عالية', initials: 'سع', color: 'bg-violet-500', location: 'الرياض، السعودية', experience: '5 سنوات' },
  { name: 'أحمد القحطاني', role: 'مهندس برمجيات أول', score: 89, stage: 'مطابقة عالية', initials: 'اق', color: 'bg-sky-500', location: 'جدة، السعودية', experience: '7 سنوات' },
  { name: 'نورة الحربي', role: 'مديرة تسويق', score: 84, stage: 'مراجعة', initials: 'نه', color: 'bg-amber-500', location: 'دبي، الإمارات', experience: '6 سنوات' },
  { name: 'خالد الشهراني', role: 'محلل بيانات', score: 78, stage: 'مراجعة', initials: 'خش', color: 'bg-emerald-500', location: 'الدمام، السعودية', experience: '4 سنوات' },
]
const jobs: Job[] = [
  { title: 'مصمم تجربة مستخدم', department: 'المنتج والتصميم', candidates: 42, date: 'منذ 3 أيام', status: 'نشطة', accent: 'bg-violet-500' },
  { title: 'مهندس برمجيات أول', department: 'الهندسة', candidates: 28, date: 'منذ 7 أيام', status: 'نشطة', accent: 'bg-sky-500' },
  { title: 'مدير تسويق رقمي', department: 'التسويق', candidates: 19, date: 'منذ 12 يوم', status: 'نشطة', accent: 'bg-amber-500' },
]

function Score({ value }: { value: number }) {
  return <span className="inline-flex items-center gap-1.5 font-mono text-sm font-semibold text-emerald-400"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />{value}%</span>
}

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
    <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#111a2b] p-6 shadow-2xl">
      <div className="mb-6 flex items-center justify-between"><h2 className="text-lg font-bold text-white">{title}</h2><button onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white" aria-label="إغلاق"><X size={18} /></button></div>
      {children}
    </div>
  </div>
}

export default function Page() {
  const [active, setActive] = useState('نظرة عامة')
  const [query, setQuery] = useState('')
  const [showJob, setShowJob] = useState(false)
  const [showUpload, setShowUpload] = useState(false)
  const [selected, setSelected] = useState<Candidate | null>(null)
  const [jobOptions, setJobOptions] = useState<{ id: string; title: string }[]>([])
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploadJobId, setUploadJobId] = useState('')
  const [uploadState, setUploadState] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle')
  const [uploadError, setUploadError] = useState('')

  async function analyzeCv() {
    if (!uploadFile || !uploadJobId) return
    setUploadState('uploading'); setUploadError('')
    const form = new FormData(); form.append('file', uploadFile); form.append('jobId', uploadJobId)
    const response = await fetch('/api/cvs/analyze', { method: 'POST', body: form })
    const result = await response.json()
    if (!response.ok) { setUploadError(result.error ?? 'تعذر تحليل الملف.'); setUploadState('error'); return }
    setUploadState('success'); setUploadFile(null)
    const candidate = result.candidate
    if (candidate) setLiveCandidates((current) => [{ name: candidate.name, role: jobOptions.find((job) => job.id === uploadJobId)?.title ?? 'مرشح', score: candidate.match_score, stage: 'جديد', initials: candidate.name.slice(0, 2), color: 'bg-indigo-500', location: '—', experience: '—' }, ...current])
  }
  const [jobTitle, setJobTitle] = useState('')
  const [jobDepartment, setJobDepartment] = useState('')
  const [jobDescription, setJobDescription] = useState('')

  async function createJob() {
    if (!jobTitle.trim()) return
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setShowJob(false); return }
    const { data } = await supabase.from('jobs').insert({ user_id: user.id, title: jobTitle.trim(), department: jobDepartment.trim() || 'عام', description: jobDescription.trim() || 'لم تتم إضافة وصف بعد.' }).select('id,title,department,created_at').single()
    if (data) { setLiveJobs((current) => [{ title: data.title, department: data.department ?? 'عام', candidates: 0, date: 'الآن', status: 'نشطة', accent: 'bg-indigo-500' }, ...current]); if (data.id) setJobOptions((current) => [{ id: data.id, title: data.title }, ...current]) }
    setJobTitle(''); setJobDepartment(''); setJobDescription(''); setShowJob(false)
  }
  const [sort, setSort] = useState('الأعلى تطابقاً')
  const [liveCandidates, setLiveCandidates] = useState<Candidate[]>(candidates)
  const [liveJobs, setLiveJobs] = useState<Job[]>(jobs)
  const [userEmail, setUserEmail] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    let mounted = true
    async function loadWorkspace() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!mounted) return
      setUserEmail(user?.email ?? null)
      if (!user) return
      const { data: jobRows } = await supabase.from('jobs').select('id,title,department,created_at').order('created_at', { ascending: false })
      const { data: candidateRows } = await supabase.from('candidates').select('id,name,match_score,status,skills,experience_years,job_id, jobs(title)').order('match_score', { ascending: false }).limit(25)
      if (!mounted) return
      if (jobRows?.length) { setJobOptions(jobRows.map((job: { id: string; title: string }) => ({ id: job.id, title: job.title }))); setLiveJobs(jobRows.map((job: { id: string; title: string; department: string | null; created_at: string }) => ({ title: job.title, department: job.department ?? 'عام', candidates: candidateRows?.filter((candidate: { job_id: string }) => candidate.job_id === job.id).length ?? 0, date: new Date(job.created_at).toLocaleDateString('ar-SA'), status: 'نشطة', accent: 'bg-indigo-500' }))) }
      if (candidateRows?.length) setLiveCandidates(candidateRows.map((candidate: { id: string; name: string; match_score: number; status: string; experience_years: number; jobs: { title?: string }[] | { title?: string } | null }) => ({ name: candidate.name, role: Array.isArray(candidate.jobs) ? candidate.jobs[0]?.title ?? 'مرشح' : candidate.jobs?.title ?? 'مرشح', score: candidate.match_score, stage: candidate.status === 'shortlisted' ? 'مختصر' : candidate.status === 'reviewed' ? 'مراجعة' : 'جديد', initials: candidate.name.slice(0, 2), color: 'bg-indigo-500', location: '—', experience: `${candidate.experience_years} سنوات`, cvId: candidate.id })))
    }
    loadWorkspace()
    return () => { mounted = false }
  }, [])

  const filtered = useMemo(() => liveCandidates.filter((c) => `${c.name} ${c.role}`.includes(query)), [liveCandidates, query])

  return <main className="min-h-screen bg-[#08111f] text-slate-200" dir="rtl">
    <aside className="fixed right-0 top-0 hidden h-screen w-64 border-l border-white/[0.07] bg-[#0b1525] px-4 py-6 lg:block">
      <div className="mb-12 flex items-center gap-3 px-3"><div className="grid h-9 w-9 place-items-center rounded-xl bg-indigo-500 text-white shadow-lg shadow-indigo-500/20"><Sparkles size={18} /></div><div><div className="font-bold tracking-tight text-white">Shortlist<span className="text-indigo-400">IQ</span></div><div className="text-[10px] text-slate-500">ذكاء التوظيف</div></div></div>
      <div className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-widest text-slate-600">القائمة الرئيسية</div>
      <nav className="space-y-1">{[['نظرة عامة', LayoutDashboard], ['الوظائف', BriefcaseBusiness], ['المرشحون', Users], ['التقارير', FileText]].map(([label, Icon]) => <button key={label as string} onClick={() => setActive(label as string)} className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm transition ${active === label ? 'bg-indigo-500/15 font-semibold text-indigo-300' : 'text-slate-400 hover:bg-white/[0.04] hover:text-slate-200'}`}><Icon size={17} />{label as string}{label === 'المرشحون' && <span className="mr-auto rounded-md bg-white/10 px-1.5 py-0.5 text-[10px] text-slate-400">126</span>}</button>)}</nav>
      <div className="mt-10 mb-3 px-3 text-[10px] font-semibold uppercase tracking-widest text-slate-600">مساحة العمل</div>
      <button className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm text-slate-400 hover:bg-white/[0.04] hover:text-slate-200"><Settings size={17} />الإعدادات</button>
      <div className="absolute bottom-5 right-4 left-4 rounded-xl border border-indigo-400/10 bg-indigo-500/5 p-4"><div className="mb-2 flex items-center gap-2 text-xs font-semibold text-indigo-300"><Zap size={14} />خطة المحترف</div><p className="mb-3 text-[11px] leading-5 text-slate-500">تبقى 18 يوماً على انتهاء الفترة التجريبية</p><div className="h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full w-[62%] rounded-full bg-indigo-500" /></div></div>
    </aside>
    <section className="lg:mr-64">
      <header className="sticky top-0 z-20 flex h-20 items-center justify-between border-b border-white/[0.07] bg-[#08111f]/90 px-5 backdrop-blur-md md:px-10"><div className="flex items-center gap-3"><button className="text-slate-400 lg:hidden" aria-label="فتح القائمة"><Menu size={22} /></button><div><div className="text-xs text-slate-500">الثلاثاء، ١٧ أغسطس ٢٠٢٦</div><h1 className="mt-1 text-xl font-bold text-white">صباح الخير، فريق التوظيف</h1></div></div><div className="flex items-center gap-3"><div className="hidden items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-slate-500 md:flex"><Search size={15} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="ابحث عن مرشح أو وظيفة..." className="w-44 bg-transparent text-slate-200 outline-none placeholder:text-slate-600" /></div><button className="relative rounded-xl border border-white/10 p-2.5 text-slate-400 hover:text-white" aria-label="الإشعارات"><Bell size={17} /><span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-indigo-400" /></button><div className="hidden items-center gap-2 sm:flex"><span className="max-w-32 truncate text-[11px] text-slate-500">{userEmail ?? 'وضع العرض'}</span><div className="grid h-9 w-9 place-items-center rounded-full bg-indigo-500 text-xs font-bold text-white">ف</div></div></div></header>
      <div className="p-5 md:p-10"><div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><div className="mb-2 flex items-center gap-2 text-xs text-indigo-300"><span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />ملخص مساحة العمل</div><h2 className="text-2xl font-bold tracking-tight text-white">نظرة عامة</h2><p className="mt-1 text-sm text-slate-500">تابع أداء التوظيف واكتشف أفضل المواهب بسرعة.</p></div><Button onClick={() => setShowJob(true)} className="gap-2 rounded-xl bg-indigo-500 px-4 text-sm font-semibold text-white hover:bg-indigo-400"><span className="text-lg leading-none">+</span> إنشاء وظيفة</Button></div>
        <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[['الوظائف النشطة','12','+2 هذا الشهر',BriefcaseBusiness,'text-indigo-300'],['إجمالي المرشحين','348','+18% من الشهر الماضي',Users,'text-sky-300'],['متوسط وقت التوظيف','18 يوم','-4 أيام عن المتوسط',Clock3,'text-amber-300'],['معدل المطابقة','87%','+6% من الشهر الماضي',Check,'text-emerald-300']].map(([label, value, note, Icon, color]) => <div key={label as string} className="rounded-2xl border border-white/[0.08] bg-[#0d192b] p-5"><div className="mb-5 flex items-center justify-between"><span className="text-xs text-slate-500">{label as string}</span><span className={`rounded-lg bg-white/[0.04] p-2 ${color}`}><Icon size={16} /></span></div><div className="text-2xl font-bold text-white">{value as string}</div><div className="mt-2 text-[11px] text-emerald-400">{note as string}</div></div>)}</div>
        <div className="mb-8 grid gap-5 xl:grid-cols-[1.45fr_1fr]"><div className="rounded-2xl border border-white/[0.08] bg-[#0d192b] p-5"><div className="mb-6 flex items-center justify-between"><div><h3 className="font-bold text-white">اتجاه المطابقة</h3><p className="mt-1 text-xs text-slate-500">متوسط نسبة مطابقة المرشحين خلال آخر ٦ أشهر</p></div><button className="flex items-center gap-1 rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-400">آخر ٦ أشهر <ChevronDown size={14} /></button></div><div className="relative h-44"><div className="absolute inset-0 flex flex-col justify-between text-[10px] text-slate-600"><span>100%</span><span>75%</span><span>50%</span><span>25%</span><span>0%</span></div><div className="mr-9 flex h-full items-end justify-between gap-3 border-b border-white/[0.08] pb-5">{[56,62,58,73,79,87].map((height, i) => <div key={i} className="flex h-full flex-1 flex-col justify-end gap-2"><div className="group relative rounded-t-md bg-indigo-500/80 transition hover:bg-indigo-400" style={{ height: `${height}%` }}><span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-bold text-indigo-300 opacity-0 group-hover:opacity-100">{height}%</span></div><span className="absolute bottom-0 text-[10px] text-slate-600">{['مارس','أبريل','مايو','يونيو','يوليو','أغسطس'][i]}</span></div>)}</div></div></div><div className="rounded-2xl border border-white/[0.08] bg-[#0d192b] p-5"><div className="mb-5 flex items-center justify-between"><div><h3 className="font-bold text-white">أحدث الوظائف</h3><p className="mt-1 text-xs text-slate-500">آخر الوظائف المضافة</p></div><button onClick={() => setActive('الوظائف')} className="text-xs text-indigo-300 hover:text-indigo-200">عرض الكل</button></div><div className="space-y-4">{liveJobs.map((job) => <div key={job.title} className="flex items-center gap-3"><span className={`h-9 w-1 rounded-full ${job.accent}`} /><div className="min-w-0 flex-1"><div className="truncate text-sm font-medium text-slate-200">{job.title}</div><div className="mt-1 text-[11px] text-slate-500">{job.department} · {job.candidates} مرشح</div></div><span className="h-2 w-2 rounded-full bg-emerald-400" /></div>)}</div></div></div>
        <div className="rounded-2xl border border-white/[0.08] bg-[#0d192b]"><div className="flex flex-col gap-4 border-b border-white/[0.07] p-5 sm:flex-row sm:items-center sm:justify-between"><div><h3 className="font-bold text-white">أفضل المرشحين</h3><p className="mt-1 text-xs text-slate-500">مرشحون مرتبين حسب توافقهم مع الوظائف النشطة</p></div><div className="flex gap-2"><button className="flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-400"><Filter size={14} /> تصفية</button><button onClick={() => setShowUpload(true)} className="flex items-center gap-2 rounded-lg bg-white/[0.06] px-3 py-2 text-xs text-slate-300 hover:bg-white/10"><Upload size={14} /> رفع سيرة ذاتية</button></div></div><div className="overflow-x-auto"><table className="w-full min-w-[620px] text-right text-sm"><thead className="text-[11px] text-slate-600"><tr><th className="px-5 py-4 font-medium">المرشح</th><th className="px-5 py-4 font-medium">الوظيفة</th><th className="px-5 py-4 font-medium">نسبة التوافق</th><th className="px-5 py-4 font-medium">المرحلة</th><th /></tr></thead><tbody>{filtered.map((candidate) => <tr key={candidate.name} className="border-t border-white/[0.05] transition hover:bg-white/[0.025]"><td className="px-5 py-4"><button onClick={() => setSelected(candidate)} className="flex items-center gap-3 text-right"><span className={`grid h-9 w-9 place-items-center rounded-full text-[11px] font-bold text-white ${candidate.color}`}>{candidate.initials}</span><span className="font-medium text-slate-200">{candidate.name}</span></button></td><td className="px-5 py-4 text-slate-400">{candidate.role}</td><td className="px-5 py-4"><Score value={candidate.score} /></td><td className="px-5 py-4"><span className={`rounded-md px-2 py-1 text-[10px] ${candidate.score > 85 ? 'bg-emerald-400/10 text-emerald-400' : 'bg-amber-400/10 text-amber-400'}`}>{candidate.stage}</span></td><td className="px-5 py-4"><button className="text-slate-600 hover:text-white" aria-label="المزيد"><MoreHorizontal size={17} /></button></td></tr>)}</tbody></table></div></div>
      </div>
    </section>
    {showJob && <Modal title="إنشاء وظيفة جديدة" onClose={() => setShowJob(false)}><div className="space-y-4"><label className="block text-sm text-slate-300">المسمى الوظيفي<input value={jobTitle} onChange={(event) => setJobTitle(event.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm outline-none focus:border-indigo-400" placeholder="مثال: مهندس برمجيات" /></label><label className="block text-sm text-slate-300">القسم<input value={jobDepartment} onChange={(event) => setJobDepartment(event.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm outline-none focus:border-indigo-400" placeholder="الهندسة" /></label><label className="block text-sm text-slate-300">وصف الوظيفة<textarea value={jobDescription} onChange={(event) => setJobDescription(event.target.value)} className="mt-2 min-h-24 w-full resize-none rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm outline-none focus:border-indigo-400" placeholder="أضف تفاصيل الوظيفة..." /></label><Button onClick={createJob} disabled={!jobTitle.trim()} className="w-full rounded-xl bg-indigo-500 py-3 text-white hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-50">إنشاء الوظيفة</Button></div></Modal>}
    {showUpload && <Modal title="تحليل سيرة ذاتية" onClose={() => { if (uploadState !== 'uploading') { setShowUpload(false); setUploadState('idle'); setUploadError('') } }}><div className="space-y-4"><label className="block text-sm text-slate-300">الوظيفة<select value={uploadJobId} onChange={(event) => setUploadJobId(event.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-[#0b1525] px-4 py-3 text-sm text-white outline-none focus:border-indigo-400"><option value="">اختر الوظيفة المستهدفة</option>{jobOptions.map((job) => <option key={job.id} value={job.id}>{job.title}</option>)}</select></label><label className="block cursor-pointer rounded-2xl border border-dashed border-indigo-400/40 bg-indigo-400/5 p-7 text-center"><Upload className="mx-auto mb-3 text-indigo-300" size={28} /><p className="text-sm font-medium text-white">{uploadFile?.name ?? 'اختر السيرة الذاتية'}</p><p className="mt-2 text-xs text-slate-500">PDF أو DOC أو DOCX أو RTF أو TXT، بحد أقصى 10 ميجابايت</p><input type="file" accept=".pdf,.doc,.docx,.rtf,.txt" className="sr-only" onChange={(event) => { setUploadFile(event.target.files?.[0] ?? null); setUploadState('idle'); setUploadError('') }} /></label>{uploadError && <p className="rounded-lg bg-red-400/10 px-3 py-2 text-xs text-red-300">{uploadError}</p>}{uploadState === 'success' && <p className="flex items-center gap-2 text-xs text-emerald-400"><Check size={14} /> تم تحليل السيرة وإضافتها إلى المرشحين.</p>}<Button onClick={analyzeCv} disabled={!uploadFile || !uploadJobId || uploadState === 'uploading'} className="w-full rounded-xl bg-indigo-500 py-3 text-white hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-50">{uploadState === 'uploading' ? 'جارٍ التحليل...' : 'تحليل وترتيب المرشح'}</Button></div></Modal>}
    {selected && <Modal title="تفاصيل المرشح" onClose={() => setSelected(null)}><div className="flex items-center gap-4 border-b border-white/[0.08] pb-5"><span className={`grid h-14 w-14 place-items-center rounded-full text-lg font-bold text-white ${selected.color}`}>{selected.initials}</span><div><h3 className="font-bold text-white">{selected.name}</h3><p className="mt-1 text-sm text-slate-400">{selected.role}</p></div><div className="mr-auto text-center"><Score value={selected.score} /><div className="mt-1 text-[10px] text-slate-500">التوافق العام</div></div></div><div className="grid grid-cols-2 gap-4 py-5 text-sm"><div><div className="text-xs text-slate-500">الموقع</div><div className="mt-1 text-slate-200">{selected.location}</div></div><div><div className="text-xs text-slate-500">الخبرة</div><div className="mt-1 text-slate-200">{selected.experience}</div></div></div><Button onClick={() => { if (selected.cvId) window.open(`/api/cvs/${selected.cvId}/download`, '_blank', 'noopener,noreferrer'); else setSelected(null) }} className="w-full rounded-xl bg-indigo-500 text-white hover:bg-indigo-400">عرض السيرة الذاتية</Button></Modal>}
  </main>
}
