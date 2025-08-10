import { NextRequest, NextResponse } from 'next/server'
import { createSsrClient } from '@/lib/supabaseSsr'

export async function PATCH(req: NextRequest, { params }: { params: { id: string }}) {
  const supabase = createSsrClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { done } = await req.json()
  if (typeof done !== 'boolean') {
    return NextResponse.json({ error: 'done must be boolean' }, { status: 400 })
  }

  // RLS ensures only owner row can be updated
  const { error } = await supabase
    .from('tasks')
    .update({ done })
    .eq('id', params.id)

  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ ok: true })
}
