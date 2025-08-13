import { NextRequest, NextResponse } from 'next/server'
import { createSsrClient } from '@/lib/supabaseSsr'

type Op = 'promote' | 'snooze' | 'delete' | 'complete'

export async function POST(req: NextRequest) {
  const supabase = createSsrClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json() as {
    ids: string[]
    op: Op
    category?: 'career'|'langpulse'|'health'|'life'
    date?: string
  }

  if (!Array.isArray(body.ids) || body.ids.length === 0) {
    return NextResponse.json({ error: 'ids required' }, { status: 400 })
  }

  if (body.op === 'delete') {
    const { error } = await supabase.from('tasks').delete().in('id', body.ids)
    if (error) return NextResponse.json({ error }, { status: 500 })
    return NextResponse.json({ ok: true, deleted: body.ids.length })
  }

  if (body.op === 'promote') {
    if (!body.category || !body.date) return NextResponse.json({ error: 'category and date required' }, { status: 400 })
    const { error } = await supabase
      .from('tasks')
      .update({ category: body.category, due_date: body.date })
      .in('id', body.ids)
    if (error) return NextResponse.json({ error }, { status: 500 })
    return NextResponse.json({ ok: true, updated: body.ids.length })
  }

  if (body.op === 'snooze') {
    if (!body.date) return NextResponse.json({ error: 'date required' }, { status: 400 })
    const { error } = await supabase
      .from('tasks')
      .update({ due_date: body.date })
      .in('id', body.ids)
    if (error) return NextResponse.json({ error }, { status: 500 })
    return NextResponse.json({ ok: true, updated: body.ids.length })
  }

  if (body.op === 'complete') {
    const { error } = await supabase
      .from('tasks')
      .update({ done: true })
      .in('id', body.ids)
    if (error) return NextResponse.json({ error }, { status: 500 })
    return NextResponse.json({ ok: true, updated: body.ids.length })
  }

  return NextResponse.json({ error: 'invalid op' }, { status: 400 })
} 