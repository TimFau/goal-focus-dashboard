import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseServer'

export async function GET() {
  const admin = supabaseAdmin()
  const { data, error } = await admin.from('profiles').select('*')
  return NextResponse.json({
    ok: !error,
    source: 'admin',
    dataCount: Array.isArray(data) ? data.length : null,
    hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    error
  })
} 