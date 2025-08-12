'use client'
import { useEffect, useMemo, useState } from 'react'
import { useDraggable } from '@dnd-kit/core'
import { addDays, nextMonday, toISODate, ageInDays } from '@/lib/date'

type Task = { id: string; title: string; done: boolean; low_energy: boolean; category: 'career'|'langpulse'|'health'|'life'; due_date?: string }

function DraggableItem({ task }: { task: Task }) {
  const { attributes, listeners, setNodeRef, isDragging, transform } = useDraggable({ id: task.id, data: { task } })
  const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, zIndex: 20 } : undefined
  return (
    <li ref={setNodeRef} {...listeners} {...attributes}
      style={style}
      className={`flex items-center gap-3 p-2 rounded cursor-grab active:cursor-grabbing ${isDragging?'bg-white/10 shadow-lg ring-1 ring-white/20':'hover:bg-white/5'}`}>
      <input className="chk" type="checkbox" checked={task.done} readOnly />
      <span className={task.done ? 'line-through opacity-50' : ''}>{task.title}</span>
      <span className="ml-auto text-xs opacity-60">{task.category} · {task.due_date}</span>
    </li>
  )
}

export default function CarryOverCard({
  items,
  onPromote,     // (ids, category, date) => Promise<void>
  onSnooze,      // (ids, date) => Promise<void>
  onDelete,      // (ids) => Promise<void>
}: {
  items: Task[]
  onPromote: (ids: string[], category: Task['category'], date: string) => Promise<void>
  onSnooze: (ids: string[], date: string) => Promise<void>
  onDelete: (ids: string[]) => Promise<void>
}) {
  const [expanded, setExpanded] = useState<boolean>(false)
  const [selected, setSelected] = useState<Record<string, boolean>>({})
  const [cat, setCat] = useState<Task['category']>('career')
  const [showCount, setShowCount] = useState(5)
  const [initialized, setInitialized] = useState(false)

  // Persist collapse state per day; optionally auto-open once/day if many items
  useEffect(() => {
    const dayKey = toISODate(new Date())
    const collapseKey = 'carry.collapse.' + dayKey
    const triageKey = 'triage.done.' + dayKey
    const saved = localStorage.getItem(collapseKey)
    const triaged = localStorage.getItem(triageKey) === '1'

    if (saved !== null) {
      setExpanded(saved === '1')
      setInitialized(true)
      return
    }

    // If first load of the day and lots of carry-over, open once
    if (!triaged && items.length > 3) {
      setExpanded(true)
      localStorage.setItem(triageKey, '1')
    } else {
      setExpanded(false)
    }
    setInitialized(true)
  // Run once when items arrive; avoid toggling after user changes state
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.length])

  useEffect(() => {
    if (!initialized) return
    const key = 'carry.collapse.'+toISODate(new Date())
    localStorage.setItem(key, expanded ? '1' : '0')
  }, [expanded, initialized])

  const oldestAge = useMemo(() => {
    const today = new Date()
    const ages = items.map(i => i.due_date ? ageInDays(i.due_date, today) : 0)
    return ages.length ? Math.max(...ages) : 0
  }, [items])

  const top = useMemo<[Task[], number]>(() => {
    const sorted = [...items].sort((a,b)=> (a.due_date??'').localeCompare(b.due_date??'') || a.title.localeCompare(b.title))
    const visible = sorted.slice(0, showCount)
    const remaining = Math.max(0, sorted.length - showCount)
    return [visible, remaining]
  }, [items, showCount])

  const idsSelected = Object.entries(selected).filter(([,v])=>v).map(([k])=>k)
  const anySelected = idsSelected.length>0

  const quickSnooze = async (offset: number) => {
    const date = toISODate(addDays(new Date(), offset))
    await onSnooze(idsSelected.length?idsSelected:items.map(i=>i.id), date)
    setSelected({})
  }

  const snoozeNextMon = async () => {
    await onSnooze(idsSelected.length?idsSelected:items.map(i=>i.id), toISODate(nextMonday(new Date())))
    setSelected({})
  }

  return (
    <div className="card p-4">
      <div className="flex items-center gap-3">
        <h3 className="font-semibold">Carry Over</h3>
        <span className="text-xs opacity-70">· {items.length} {items.length===1?'item':'items'}{oldestAge>0?` (oldest ${oldestAge}d)`:''}</span>
        <button className="btn ml-auto" onClick={()=>setExpanded(!expanded)}>{expanded?'Hide':'Show'}</button>
      </div>

      {expanded && (
        <>
          {/* Bulk bar */}
          <div className="mt-3 flex items-center gap-2">
            <label className="text-sm opacity-70">{anySelected ? `${idsSelected.length} selected` : 'Bulk actions:'}</label>
            <select className="max-w-[160px]" value={cat} onChange={e=>setCat(e.target.value as any)}>
              <option value="career">Career</option>
              <option value="langpulse">LangPulse</option>
              <option value="health">Health</option>
              <option value="life">Life</option>
            </select>
            <button className="btn" onClick={async()=>{ await onPromote(anySelected?idsSelected:items.map(i=>i.id), cat, toISODate()); setSelected({}) }}>Promote to Today</button>
            <button className="btn" onClick={()=>quickSnooze(1)}>Snooze → Tomorrow</button>
            <button className="btn" onClick={()=>quickSnooze(3)}>Snooze → +3d</button>
            <button className="btn" onClick={snoozeNextMon}>Snooze → Next Mon</button>
            <button className="btn" onClick={async()=>{ await onDelete(anySelected?idsSelected:items.map(i=>i.id)); setSelected({}) }}>Delete</button>
          </div>

          {/* List (top N + show more) */}
          <ul className="mt-3 space-y-1">
            {top[0].map((t) => (
              <li key={t.id} className="flex items-center gap-3 p-2 rounded hover:bg-white/5">
                <input type="checkbox" className="chk" checked={!!selected[t.id]} onChange={e=>setSelected(s=>({...s,[t.id]:e.target.checked}))} />
                {/* Draggable handle via whole item for simplicity */}
                <DraggableItem task={t} />
                {/* Inline quick actions */}
                <div className="ml-auto flex items-center gap-2">
                  <select className="text-sm" onChange={async e=>{
                    await onPromote([t.id], e.target.value as any, toISODate()); e.currentTarget.selectedIndex = 0
                  }}>
                    <option value="">Promote…</option>
                    <option value="career">→ Career</option>
                    <option value="langpulse">→ LangPulse</option>
                    <option value="health">→ Health</option>
                    <option value="life">→ Life</option>
                  </select>
                  <button className="btn" onClick={()=>onSnooze([t.id], toISODate(addDays(new Date(),1)))}>Snooze</button>
                  <button className="btn" onClick={()=>onDelete([t.id])}>Delete</button>
                </div>
              </li>
            ))}
          </ul>
          {top[1] > 0 && (
            <div className="mt-2">
              <button className="btn" onClick={()=>setShowCount(c=>c+5)}>Show {Math.min(5, top[1])} more</button>
            </div>
          )}
        </>
      )}
    </div>
  )
} 