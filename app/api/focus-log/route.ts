import { NextRequest, NextResponse } from 'next/server'
import { createSsrClient } from '@/lib/supabaseSsr'

type FocusLogPayload = {
  date: string
  taskId: string
  minutes: number
  source: 'timer' | 'manual'
}

export async function POST(req: NextRequest) {
  const supabase = createSsrClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = (await req.json()) as FocusLogPayload
  const { date, taskId, minutes, source } = body

  if (!date || !taskId || minutes === undefined || !source) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('task_focus_log')
    .insert({
      user_id: auth.user.id,
      task_id: taskId,
      date,
      minutes,
      source,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
