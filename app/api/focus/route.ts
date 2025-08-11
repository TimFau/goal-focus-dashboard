import { NextRequest, NextResponse } from 'next/server'
import { createSsrClient } from '@/lib/supabaseSsr'

type FocusPayload = {
  date: string
  items: Array<{ task_id?: string; free_text?: string } | null>
}

export async function POST(req: NextRequest) {
  const supabase = createSsrClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = (await req.json()) as FocusPayload
  if (!body?.date || !Array.isArray(body.items) || body.items.length !== 3) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  const userId = auth.user.id
  const rows = body.items.map((v, i) => ({
    user_id: userId,
    date: body.date,
    slot: i + 1,
    task_id: v?.task_id ?? null,
    free_text: v?.free_text ?? null,
  }))

  const { error } = await supabase
    .from('daily_focus')
    .upsert(rows, { onConflict: 'user_id,date,slot' })

  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ ok: true })
}
