import { NextRequest, NextResponse } from 'next/server'
import { createSsrClient } from '@/lib/supabaseSsr'

type Task = { id: string; title: string; done: boolean; low_energy: boolean; category: string }

export async function GET(req: NextRequest) {
  const supabase = createSsrClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const date = searchParams.get('date') || new Date().toISOString().slice(0,10)

  // With RLS on, we can just select and the policy filters to this user.
  const { data: tasks, error } = await supabase
    .from('tasks')
    .select('id, title, done, low_energy, category')
    .eq('due_date', date)
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error }, { status: 500 })

  const pick = (cat: string) => (tasks ?? [] as Task[]).filter(t => t.category === cat)
  return NextResponse.json({
    focus: [{ title:'' }, { title:'' }, { title:'' }], // daily_focus later
    career: pick('career'),
    langpulse: pick('langpulse'),
    health: pick('health'),
    life: pick('life'),
  })
}
