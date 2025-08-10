import { NextRequest, NextResponse } from 'next/server'
import { createSsrClient } from '@/lib/supabaseSsr'

function mondayOf(d: Date) {
  const copy = new Date(d)
  const day = (copy.getDay() + 6) % 7
  copy.setDate(copy.getDate() - day)
  copy.setHours(0,0,0,0)
  return copy
}

export async function POST(req: NextRequest) {
  const supabase = createSsrClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { date, category, title, low_energy } = body as {
    date: string, category: 'career'|'langpulse'|'health'|'life', title: string, low_energy?: boolean
  }
  if (!date || !category || !title) {
    return NextResponse.json({ error: 'Missing date/category/title' }, { status: 400 })
  }

  const userId = auth.user.id
  const d = new Date(date)
  const weekStartISO = mondayOf(d).toISOString().slice(0,10)

  // ensure week row exists for this user
  const { data: existing, error: wkErr } = await supabase
    .from('weeks')
    .select('id')
    .eq('user_id', userId)
    .eq('week_start', weekStartISO)
    .maybeSingle()
  if (wkErr) return NextResponse.json({ error: wkErr }, { status: 500 })

  let weekId = existing?.id as string | null
  if (!weekId) {
    const { data: created, error: cErr } = await supabase
      .from('weeks')
      .insert({ user_id: userId, week_start: weekStartISO })
      .select('id')
      .single()
    if (cErr) return NextResponse.json({ error: cErr }, { status: 500 })
    weekId = created.id
  }

  const { data, error } = await supabase
    .from('tasks')
    .insert({
      user_id: userId,
      week_id: weekId,
      due_date: date,
      category,
      title,
      low_energy: low_energy ?? true,
    })
    .select('id, title, done, low_energy, category')
    .single()

  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
