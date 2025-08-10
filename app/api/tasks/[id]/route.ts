import { NextRequest, NextResponse } from 'next/server'
export async function PATCH(req: NextRequest, { params }: { params: { id: string }}) {
  const { done } = await req.json()
  // TODO: update in DB
  return NextResponse.json({ ok: true })
}
