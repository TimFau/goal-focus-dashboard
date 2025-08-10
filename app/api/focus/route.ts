import { NextRequest, NextResponse } from 'next/server'
export async function POST(req: NextRequest) {
  const { date, items } = await req.json()
  // TODO: upsert daily focus items for date
  return NextResponse.json({ ok: true })
}
