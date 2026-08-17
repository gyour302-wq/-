import { gateway } from '@ai-sdk/gateway'
import { generateObject } from 'ai'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { extractCvText, isSupportedCv } from '@/lib/cv-parser'

export const runtime = 'nodejs'

const MAX_FILE_SIZE = 10 * 1024 * 1024
const analysisSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().or(z.literal('')),
  phone: z.string().default(''),
  skills: z.array(z.string()).max(20),
  experienceYears: z.number().int().min(0).max(60),
  summary: z.string().max(1200),
  matchScore: z.number().int().min(0).max(100),
  recommendation: z.enum(['shortlisted', 'reviewed', 'rejected']),
})

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'يجب تسجيل الدخول أولاً.' }, { status: 401 })

  const formData = await request.formData()
  const file = formData.get('file')
  const jobId = formData.get('jobId')
  if (!(file instanceof File) || typeof jobId !== 'string') return NextResponse.json({ error: 'الملف والوظيفة مطلوبان.' }, { status: 400 })
  if (file.size > MAX_FILE_SIZE) return NextResponse.json({ error: 'حجم الملف يتجاوز 10 ميجابايت.' }, { status: 413 })
  if (!isSupportedCv(file.name, file.type)) return NextResponse.json({ error: 'الصيغ المدعومة: PDF وDOC وDOCX وRTF وTXT.' }, { status: 415 })

  const { data: job } = await supabase.from('jobs').select('id,title,description').eq('id', jobId).eq('user_id', user.id).single()
  if (!job) return NextResponse.json({ error: 'الوظيفة غير موجودة أو لا تملك صلاحية الوصول إليها.' }, { status: 404 })

  const buffer = Buffer.from(await file.arrayBuffer())
  let resumeText: string
  try {
    resumeText = await extractCvText(buffer, file.name)
  } catch {
    return NextResponse.json({ error: 'تعذر قراءة السيرة الذاتية. تأكد من أن الملف غير تالف.' }, { status: 422 })
  }
  if (resumeText.trim().length < 30) return NextResponse.json({ error: 'لم يتم العثور على نص قابل للتحليل في الملف.' }, { status: 422 })

  const storagePath = `${user.id}/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`
  const upload = await supabase.storage.from('cvs').upload(storagePath, buffer, { contentType: file.type || 'application/octet-stream', upsert: false })
  if (upload.error) return NextResponse.json({ error: 'تعذر حفظ الملف بشكل آمن.' }, { status: 500 })

  try {
    const { object } = await generateObject({
      model: gateway('google/gemini-3.1-flash-lite'),
      schema: analysisSchema,
      system: 'أنت محلل سير ذاتية متخصص في التوظيف. أجب بالعربية أو بنفس لغة السيرة الذاتية. لا تخترع بيانات غير موجودة. احسب matchScore من 0 إلى 100 بناءً على توافق المرشح مع الوظيفة، وأعد summary موجزاً ودقيقاً.',
      prompt: `الوظيفة: ${job.title}\nوصف الوظيفة: ${job.description}\n\nالسيرة الذاتية:\n${resumeText}`,
    })
    const { data: candidate, error } = await supabase.from('candidates').insert({ job_id: job.id, name: object.name, email: object.email, phone: object.phone, skills: object.skills, experience_years: object.experienceYears, summary: object.summary, cv_path: storagePath, match_score: object.matchScore, status: object.recommendation }).select('id,name,match_score,status').single()
    if (error) throw error
    return NextResponse.json({ candidate })
  } catch {
    await supabase.storage.from('cvs').remove([storagePath])
    return NextResponse.json({ error: 'تعذر تحليل السيرة الذاتية حالياً. تحقق من إعدادات مزود الذكاء الاصطناعي ثم حاول مرة أخرى.' }, { status: 502 })
  }
}
