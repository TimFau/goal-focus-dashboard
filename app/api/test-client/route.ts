import { NextResponse } from 'next/server'
import { supabaseServerAnon } from '@/lib/supabaseServerAnon'

export async function GET() {
  const supabase = supabaseServerAnon()
  const { data, error } = await supabase.from('profiles').select('*')
  return NextResponse.json({ ok: !error, source: 'client', dataCount: Array.isArray(data) ? data.length : null, error })
} 