import { NextResponse } from 'next/server'
import { createSsrClient } from '@/lib/supabaseSsr'

export async function POST() {
  const supabase = createSsrClient()
  await supabase.auth.signOut()
  return NextResponse.json({ ok: true })
} 