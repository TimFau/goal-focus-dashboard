import { NextRequest, NextResponse } from 'next/server'
import { createSsrClient } from '@/lib/supabaseSsr'

export async function PATCH(req: NextRequest, { params }: { params: { id: string }}) {
  const supabase = createSsrClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const payload = await req.json()

  const { error } = await supabase
    .from('template_items')
    .update(payload)
    .eq('id', params.id)

  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string }}) {
  const supabase = createSsrClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { error } = await supabase
    .from('template_items')
    .delete()
    .eq('id', params.id)

  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ ok: true })
} 