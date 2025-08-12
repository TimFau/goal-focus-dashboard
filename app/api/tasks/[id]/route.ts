import { NextRequest, NextResponse } from 'next/server'
import { createSsrClient } from '@/lib/supabaseSsr'

export async function PATCH(req: NextRequest, { params }: { params: { id: string }}) {
  const supabase = createSsrClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const payload = await req.json() as { done?: boolean; category?: 'career'|'langpulse'|'health'|'life'; due_date?: string }
  if (payload.done === undefined && payload.category === undefined && payload.due_date === undefined) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
  }

  const { error } = await supabase
    .from('tasks')
    .update(payload as any)
    .eq('id', params.id)

  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ ok: true })
}
