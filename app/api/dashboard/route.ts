import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const date = searchParams.get('date') || new Date().toISOString().slice(0,10)

  // TODO: Replace with DB reads
  return NextResponse.json({
    focus: [{title:''},{title:''},{title:''}],
    career: [], langpulse: [], health: [], life: []
  })
}
