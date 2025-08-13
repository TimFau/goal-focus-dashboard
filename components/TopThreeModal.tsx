'use client'
import { useEffect, useMemo, useState } from 'react'
import { toISODate } from '@/lib/date'

type Task = { id: string; title: string; due_date?: string; category: 'career'|'langpulse'|'health'|'life'; done: boolean }

export default function TopThreeModal({
  open,
  onClose,
  plannedToday,
  carryOver,
  onAccept,
  selectedDate
}: {
  open: boolean
  onClose: () => void
  plannedToday: Task[]
  carryOver: Task[]
  onAccept: (items: Array<{ title: string, task_id?: string }>) => Promise<void>
  selectedDate: string
}) {
  const suggestions = useMemo(() => {
    // Filter tasks for the selected date
    const planned = plannedToday.filter(t => t.due_date === selectedDate)
    const carry = carryOver.filter(t => t.due_date && t.due_date < selectedDate).sort((a,b)=>(a.due_date??'').localeCompare(b.due_date??''))
    const pool = [...planned, ...carry]
    const picked = pool.slice(0,3)
    return picked.map(t => ({ title: t.title, task_id: t.id }))
  }, [plannedToday, carryOver, selectedDate])

  const [draft, setDraft] = useState<Array<{ title: string, task_id?: string }>>(() => [
    suggestions[0] ?? { title: '' },
    suggestions[1] ?? { title: '' },
    suggestions[2] ?? { title: '' },
  ])

  useEffect(() => {
    setDraft([
      suggestions[0] ?? { title: '' },
      suggestions[1] ?? { title: '' },
      suggestions[2] ?? { title: '' },
    ])
  }, [JSON.stringify(suggestions)])

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="w-full max-w-lg card p-4">
        <h3 className="font-semibold mb-2">Pick your Top 3 for {selectedDate}</h3>
        <div className="grid gap-2">
          {draft.map((d, i) => (
            <input key={i} className="p-2 rounded bg-white/5 outline-none"
              placeholder={`Top ${i+1}`} value={d.title}
              onChange={e => {
                const v = e.target.value
                setDraft(prev => {
                  const next = [...prev]; next[i] = v ? { title: v } : { title: '' }; return next
                })
              }}
            />
          ))}
        </div>
        <div className="mt-4 flex gap-2 justify-end">
          <button className="btn" onClick={onClose}>Skip</button>
          <button className="btn" onClick={async()=>{ await onAccept(draft); onClose() }}>Save</button>
        </div>
        <p className="mt-2 text-xs opacity-60">Suggestions are prefilled from today’s plan and oldest carry‑over.</p>
      </div>
    </div>
  )
} 