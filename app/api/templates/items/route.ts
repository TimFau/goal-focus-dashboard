import { NextRequest, NextResponse } from 'next/server'
import { createSsrClient } from '@/lib/supabaseSsr'

export async function GET() {
  const supabase = createSsrClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: active, error: aErr } = await supabase
    .from('week_templates')
    .select('id')
    .eq('is_active', true)
    .maybeSingle()
  if (aErr) return NextResponse.json({ error: aErr }, { status: 500 })
  if (!active) return NextResponse.json({ items: [] })

  const { data, error } = await supabase
    .from('template_items')
    .select('id, category, title, low_energy, sort_index')
    .eq('template_id', active.id)
    .order('sort_index', { ascending: true })

  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ items: data ?? [] })
}

export async function POST(req: NextRequest) {
  const supabase = createSsrClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { category, title, low_energy } = await req.json()
  if (!category || !title) {
    return NextResponse.json({ error: 'Missing category/title' }, { status: 400 })
  }

  const { data: active, error: aErr } = await supabase
    .from('week_templates')
    .select('id')
    .eq('is_active', true)
    .maybeSingle()
  if (aErr) return NextResponse.json({ error: aErr }, { status: 500 })
  if (!active) return NextResponse.json({ error: 'No active template' }, { status: 400 })

  const { data, error } = await supabase
    .from('template_items')
    .insert({ template_id: active.id, category, title, low_energy: low_energy ?? true })
    .select('id, category, title, low_energy, sort_index')
    .single()

  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
} 