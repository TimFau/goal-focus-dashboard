import { NextRequest, NextResponse } from 'next/server'
import { createSsrClient } from '@/lib/supabaseSsr'

function nextISODate(date: string) {
  const d = new Date(date)
  d.setDate(d.getDate() + 1)
  d.setHours(0,0,0,0)
  return d.toISOString().slice(0,10)
}

export async function POST(req: NextRequest) {
  const supabase = createSsrClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({})) as { date?: string }
  const date = body?.date || new Date().toISOString().slice(0,10)
  const tomorrow = nextISODate(date)

  const { data, error } = await supabase
    .from('tasks')
    .update({ due_date: tomorrow })
    .eq('due_date', date)
    .eq('done', false)
    .select('id')

  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ ok: true, rolledOverCount: Array.isArray(data) ? data.length : 0 })
} 