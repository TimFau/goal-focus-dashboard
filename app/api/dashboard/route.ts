import { NextRequest, NextResponse } from 'next/server'
import { createSsrClient } from '@/lib/supabaseSsr'

type Task = { id: string; title: string; done: boolean; low_energy: boolean; category: string }

type FocusRow = { slot: number; task_id: string | null; free_text: string | null }

export async function GET(req: NextRequest) {
  const supabase = createSsrClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const date = searchParams.get('date') || new Date().toISOString().slice(0,10)

  const [{ data: tasks, error: tErr }, { data: focusRows, error: fErr }] = await Promise.all([
    supabase
      .from('tasks')
      .select('id, title, done, low_energy, category')
      .eq('due_date', date)
      .order('created_at', { ascending: true }),
    supabase
      .from('daily_focus')
      .select('slot, task_id, free_text')
      .eq('date', date)
      .order('slot', { ascending: true })
  ])

  if (tErr) return NextResponse.json({ error: tErr }, { status: 500 })
  if (fErr) return NextResponse.json({ error: fErr }, { status: 500 })

  const pick = (cat: string) => (tasks ?? [] as Task[]).filter(t => t.category === cat)

  const focus = [1,2,3].map(i => {
    const row = (focusRows ?? [] as FocusRow[]).find(r => r.slot === i)
    if (!row) return { title: '' }
    if (row.free_text) return { title: row.free_text }
    const task = (tasks ?? [] as Task[]).find(t => t.id === row.task_id)
    return { title: task?.title ?? '' }
  })

  return NextResponse.json({
    focus,
    career: pick('career'),
    langpulse: pick('langpulse'),
    health: pick('health'),
    life: pick('life'),
  })
}
