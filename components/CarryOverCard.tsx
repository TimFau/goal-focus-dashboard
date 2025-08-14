'use client'
import { useEffect, useMemo, useState } from 'react'
import { useDraggable } from '@dnd-kit/core'
import { addDays, nextMonday, toISODate, ageInDays } from '@/lib/date'

type Task = { id: string; title: string; done: boolean; low_energy: boolean; category: 'career'|'langpulse'|'health'|'life'; due_date?: string }

import { CheckIconButton } from '@/components/IconButton'

function DraggableItem({ task, left }: { task: Task; left: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, isDragging, transform } = useDraggable({ id: task.id, data: { task } })
  const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, zIndex: 20 } : undefined
  return (
    <div ref={setNodeRef} {...listeners} {...attributes}
      style={style}
      className={`flex-1 flex items-center gap-2 p-2 rounded cursor-grab active:cursor-grabbing ${isDragging?'bg-white/10 shadow-lg ring-1 ring-white/20':'hover:bg-white/5'}`}>
      {left}
      <span className={task.done ? 'line-through opacity-50' : ''}>{task.title}</span>
    </div>
  )
}

export default function CarryOverCard({
  items,
  onPromote,     // (ids, category, date) => Promise<void>
  onSnooze,      // (ids, date) => Promise<void)
  onDelete,      // (ids) => Promise<void>
  onComplete,    // (ids) => Promise<void>
  onAddToTop3,   // (ids) => Promise<void>
}: {
  items: Task[]
  onPromote: (ids: string[], category: Task['category'], date: string) => Promise<void>
  onSnooze: (ids: string[], date: string) => Promise<void>
  onDelete: (ids: string[]) => Promise<void>
  onComplete: (ids: string[]) => Promise<void>
  onAddToTop3: (ids: string[]) => Promise<void>
}) {
  const [expanded, setExpanded] = useState<boolean>(false)
  const [selected, setSelected] = useState<Record<string, boolean>>({})
  const [cat, setCat] = useState<'keep'|Task['category']>('keep')
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
    <div className="card card-carry accent-carry p-4">
      <div className="flex items-center gap-3">
        <h3 className="font-semibold text-violet-300">Carry Over</h3>
        <span className="text-xs opacity-70">· {items.length} {items.length===1?'item':'items'}{oldestAge>0?` (oldest ${oldestAge}d)`:''}</span>
        <button className="btn ml-auto" onClick={()=>setExpanded(!expanded)}>{expanded?'Hide':'Show'}</button>
      </div>

      {expanded && (
        <>
          {/* Bulk actions */}
          <div className="mt-3 space-y-3">
            {/* Header row */}
            <div className="flex items-center gap-3">
              <label className="text-sm opacity-70 flex-shrink-0">
                {anySelected ? `${idsSelected.length} selected` : 'Category:'}
              </label>
              <select
                value={cat}
                onChange={e=>setCat(e.target.value as any)}
                title="Choose category override (default: keep existing)"
              >
                <option value="keep">Keep existing category</option>
                <option value="career">Career</option>
                <option value="langpulse">LangPulse</option>
                <option value="health">Health</option>
                <option value="life">Life</option>
              </select>
            </div>
            
            {/* Action buttons - grouped by function */}
            <div className="flex flex-wrap gap-2">
              {/* Promote */}
              <button
                className="btn btn-sm btn-backlog"
                onClick={async()=>{
                  const ids = (anySelected ? idsSelected : items.map(i=>i.id))
                  if (cat === 'keep') {
                    // Group by each task's current category to preserve categories while promoting
                    const groups: Record<Task['category'], string[]> = { career: [], langpulse: [], health: [], life: [] }
                    ids.forEach(id => {
                      const t = items.find(it => it.id === id)
                      if (t) groups[t.category].push(id)
                    })
                    for (const [groupCat, groupIds] of Object.entries(groups) as [Task['category'], string[]][]) {
                      if (groupIds.length) {
                        await onPromote(groupIds, groupCat, toISODate())
                      }
                    }
                  } else {
                    await onPromote(ids, cat, toISODate())
                  }
                  setSelected({})
                }}
                title={cat === 'keep' ? 'Adds to today and keeps category' : 'Adds to today and changes category'}
              >
                Add to Today (Backlog)
              </button>

              {/* Pin to Top 3 */}
              <button
                className="btn btn-sm btn-top3"
                onClick={async()=>{
                  const ids = (anySelected ? idsSelected : items.map(i=>i.id))
                  await onAddToTop3(ids)
                  setSelected({})
                }}
                title="Add to today’s Top 3"
              >
                Pin to Top 3
              </button>
              
              {/* Snooze group */}
              <div className="flex gap-1">
                <button className="btn btn-sm" onClick={()=>quickSnooze(1)}>Tomorrow</button>
                <button className="btn btn-sm" onClick={()=>quickSnooze(3)}>+3d</button>
                <button className="btn btn-sm" onClick={snoozeNextMon}>Next Mon</button>
              </div>
              
              {/* Complete/Delete */}
              <div className="flex gap-1">
                <button 
                  className="btn btn-sm" 
                  onClick={async()=>{ await onComplete(anySelected?idsSelected:items.map(i=>i.id)); setSelected({}) }}
                >
                  Complete
                </button>
                <button 
                  className="btn btn-sm" 
                  onClick={async()=>{ await onDelete(anySelected?idsSelected:items.map(i=>i.id)); setSelected({}) }}
                >
                  Delete
                </button>
              </div>
            </div>
            <div className="text-xs opacity-60">
              “Add to Today (Backlog)” does not add to Top 3
            </div>
          </div>

          {/* List (top N + show more) */}
          <ul className="mt-3 space-y-1">
            {top[0].map((t) => (
              <li key={t.id} className="p-2 rounded hover:bg-white/5">
                {/* First row: checkbox, task content, Pin to Top 3 */}
                <div className="flex items-center gap-3">
                  <input type="checkbox" className="chk" checked={!!selected[t.id]} onChange={e=>setSelected(s=>({...s,[t.id]:e.target.checked}))} />
                  {/* Draggable area with inline completion icon and title */}
                  <DraggableItem task={t} left={<CheckIconButton onClick={async (e)=>{ e.stopPropagation(); await onComplete([t.id]) }} />} />
                  <button 
                    className="btn btn-sm btn-top3 ml-auto" 
                    onClick={()=>onAddToTop3([t.id])}
                    title="Pin to Top 3"
                  >
                    Pin to Top 3
                  </button>
                </div>
                
                {/* Second row: category/date and other actions */}
                <div className="mt-2 flex items-center justify-between text-xs opacity-60">
                  <span>{t.category} · {t.due_date}</span>
                  <div className="flex items-center gap-2">
                    <select className="text-sm" onChange={async e=>{
                      await onPromote([t.id], e.target.value as any, toISODate()); e.currentTarget.selectedIndex = 0
                    }}>
                      <option value="">Promote…</option>
                      <option value="career">→ Career</option>
                      <option value="langpulse">→ LangPulse</option>
                      <option value="health">→ Health</option>
                      <option value="life">→ Life</option>
                    </select>
                    <button className="btn btn-sm" onClick={()=>onSnooze([t.id], toISODate(addDays(new Date(),1)))}>Snooze</button>
                    <button className="btn btn-sm" onClick={()=>onDelete([t.id])}>Delete</button>
                  </div>
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