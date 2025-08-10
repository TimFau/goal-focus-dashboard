import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseServer'
import { getUserIdFromEnvDevOnly } from '@/lib/user'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const date = searchParams.get('date') || new Date().toISOString().slice(0,10)
  const userId = getUserIdFromEnvDevOnly()
  const admin = supabaseAdmin()

  // Fetch tasks due on this date
  const { data: tasks, error } = await admin
    .from('tasks')
    .select('id, title, done, low_energy, category')
    .eq('user_id', userId)
    .eq('due_date', date)
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error }, { status: 500 })

  const pick = (cat: string) => (tasks ?? []).filter(t => t.category === cat)
  return NextResponse.json({
    focus: [{ title:'' }, { title:'' }, { title:'' }], // wire daily_focus later
    career: pick('career'),
    langpulse: pick('langpulse'),
    health: pick('health'),
    life: pick('life'),
  })
}
