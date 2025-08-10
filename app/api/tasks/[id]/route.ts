import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseServer'
import { getUserIdFromEnvDevOnly } from '@/lib/user'

export async function PATCH(req: NextRequest, { params }: { params: { id: string }}) {
  const { done } = await req.json()
  if (typeof done !== 'boolean') {
    return NextResponse.json({ error: 'done must be boolean' }, { status: 400 })
  }
  const userId = getUserIdFromEnvDevOnly()
  const admin = supabaseAdmin()

  // Ensure the task belongs to our dev user (defensive)
  const { data: task, error: fetchErr } = await admin
    .from('tasks')
    .select('id, user_id')
    .eq('id', params.id)
    .single()
  if (fetchErr || !task) return NextResponse.json({ error: fetchErr ?? 'Not found' }, { status: 404 })
  if (task.user_id !== userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { error } = await admin
    .from('tasks')
    .update({ done })
    .eq('id', params.id)

  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ ok: true })
}
