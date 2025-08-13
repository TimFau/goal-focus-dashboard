'use client'
import { toISODate, fromISODateLocal, addDays } from '@/lib/date'
import { useRouter, useSearchParams } from 'next/navigation'

export default function DayNav() {
  const router = useRouter()
  const params = useSearchParams()
  const d = params.get('date') ?? toISODate()
  const curr = fromISODateLocal(d)
  const prev = addDays(curr, -1)
  const next = addDays(curr, 1)

  const nav = (date: Date) => {
    const q = new URLSearchParams(params.toString())
    q.set('date', toISODate(date))
    router.push('/?'+q.toString())
  }

  return (
    <div className="flex items-center justify-between my-3">
      <button className="btn" onClick={()=>nav(prev)}>← Prev</button>
      <div className="opacity-80">{curr.toDateString()}</div>
      <button className="btn" onClick={()=>nav(next)}>Next →</button>
    </div>
  )
}
