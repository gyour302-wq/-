'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(event: FormEvent) {
    event.preventDefault(); setLoading(true); setError('')
    const { error: authError } = await createClient().auth.signInWithPassword({ email, password })
    if (authError) { setError(authError.message.includes('confirm') ? 'يرجى تأكيد بريدك الإلكتروني أولاً.' : 'البريد الإلكتروني أو كلمة المرور غير صحيحة.'); setLoading(false); return }
    router.push('/dashboard'); router.refresh()
  }

  return <main dir="rtl" className="flex min-h-screen items-center justify-center bg-[#08111f] px-5 text-slate-200"><div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#0d192b] p-7 shadow-2xl"><div className="mb-8"><div className="mb-5 grid h-11 w-11 place-items-center rounded-xl bg-indigo-500 font-bold text-white">IQ</div><h1 className="text-2xl font-bold text-white">تسجيل الدخول</h1><p className="mt-2 text-sm text-slate-500">ادخل إلى مساحة التوظيف الخاصة بك.</p></div><form onSubmit={submit} className="space-y-4"><label className="block text-sm">البريد الإلكتروني<input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 outline-none focus:border-indigo-400" /></label><label className="block text-sm">كلمة المرور<input required type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 outline-none focus:border-indigo-400" /></label>{error && <p className="rounded-lg bg-red-400/10 px-3 py-2 text-xs text-red-300">{error}</p>}<button disabled={loading} className="w-full rounded-xl bg-indigo-500 py-3 font-semibold text-white disabled:opacity-50">{loading ? 'جارٍ الدخول...' : 'تسجيل الدخول'}</button></form><p className="mt-6 text-center text-sm text-slate-500">ليس لديك حساب؟ <a className="text-indigo-300 hover:text-indigo-200" href="/auth/sign-up">إنشاء حساب</a></p></div></main>
}
