'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

export default function SignUpPage() {
  const r = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const signUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setErr(null)
    const { error } = await supabase.auth.signUp({ email, password })
    setLoading(false)
    if (error) setErr(error.message)
    else r.replace('/')
  }

  return (
    <main className="max-w-sm mx-auto card p-4">
      <h2 className="font-semibold mb-3">Create account</h2>
      <form onSubmit={signUp} className="grid gap-3">
        <input type="email" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} required />
        <input type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} required />
        {err && <div className="text-red-400 text-sm">{err}</div>}
        <button className="btn" disabled={loading}>{loading ? 'Creating…' : 'Sign up'}</button>
      </form>
      <a href="/sign-in" className="block mt-3 opacity-80">Have an account? Sign in</a>
    </main>
  )
} 