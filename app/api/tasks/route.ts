import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseServer'
import { getUserIdFromEnvDevOnly } from '@/lib/user'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { date, category, title, low_energy } = body as {
    date: string, category: 'career'|'langpulse'|'health'|'life', title: string, low_energy?: boolean
  }

  if (!date || !category || !title) {
    return NextResponse.json({ error: 'Missing date/category/title' }, { status: 400 })
  }

  const userId = getUserIdFromEnvDevOnly()
  const admin = supabaseAdmin()

  // Ensure dev user has a profile row (schema: profiles.user_id)
  {
    const { data: existingProfile, error: profileErr } = await admin
      .from('profiles')
      .select('user_id')
      .eq('user_id', userId)
      .maybeSingle()
    if (profileErr) return NextResponse.json({ error: profileErr }, { status: 500 })
    if (!existingProfile) {
      return NextResponse.json({
        error: 'DEV user not found in profiles. Set DEV_USER_ID to a valid auth user UUID that has a profile row.'
      }, { status: 400 })
    }
  }

  // Upsert a week row for convenience
  const d = new Date(date)
  const weekStart = new Date(d)
  weekStart.setDate(weekStart.getDate() - ((weekStart.getDay()+6)%7)) // Monday start
  const weekStartISO = weekStart.toISOString().slice(0,10)

  let weekId: string | null = null
  {
    // ensure weeks row exists
    const { data: existing, error } = await admin
      .from('weeks')
      .select('id')
      .eq('user_id', userId)
      .eq('week_start', weekStartISO)
      .maybeSingle()
    if (error) return NextResponse.json({ error }, { status: 500 })

    if (existing) {
      weekId = existing.id
    } else {
      const { data: created, error: createErr } = await admin
        .from('weeks')
        .insert({
          user_id: userId,
          week_start: weekStartISO,
        })
        .select('id')
        .single()
      if (createErr) return NextResponse.json({ error: createErr }, { status: 500 })
      weekId = created.id
    }
  }

  const { data, error } = await admin
    .from('tasks')
    .insert({
      user_id: userId,
      week_id: weekId,
      due_date: date,
      category,
      title,
      low_energy: low_energy ?? true
    })
    .select('id, title, done, low_energy')
    .single()

  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
