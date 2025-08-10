import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
export async function POST(req: NextRequest) {
  const body = await req.json()
  const created = { id: randomUUID(), title: body.title, done:false, low_energy:true }
  // TODO: insert into DB
  return NextResponse.json(created, { status: 201 })
}
