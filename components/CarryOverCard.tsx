'use client'
import { useEffect, useMemo, useState } from 'react'
import { useDraggable } from '@dnd-kit/core'
import { addDays, nextMonday, toISODate, ageInDays } from '@/lib/date'

type Task = { id: string; title: string; done: boolean; low_energy: boolean; category: 'career'|'langpulse'|'health'|'life'; due_date?: string }

import { CheckIconButton } from '@/components/IconButton'
import SnoozeIcon from '@mui/icons-material/Snooze'
import PushPinIcon from '@mui/icons-material/PushPin'
import DeleteIcon from '@mui/icons-material/Delete'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import EditIcon from '@mui/icons-material/Edit'
import AddIcon from '@mui/icons-material/Add'
import TodayIcon from '@mui/icons-material/Today'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import HistoryIcon from '@mui/icons-material/History'

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
  snoozedItems,  // tasks with future due dates
}: {
  items: Task[]
  onPromote: (ids: string[], category: Task['category'], date: string) => Promise<void>
  onSnooze: (ids: string[], date: string) => Promise<void>
  onDelete: (ids: string[]) => Promise<void>
  onComplete: (ids: string[]) => Promise<void>
  onAddToTop3: (ids: string[]) => Promise<void>
  snoozedItems?: Task[]
}) {
  const [expanded, setExpanded] = useState<boolean>(false)
  const [selected, setSelected] = useState<Record<string, boolean>>({})
  const [cat, setCat] = useState<'keep'|Task['category']>('keep')
  const [showCount, setShowCount] = useState(5)
  const [initialized, setInitialized] = useState(false)
  const [showBulkActions, setShowBulkActions] = useState(false)
  const [showSnoozedModal, setShowSnoozedModal] = useState(false)

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
        <div>
          <h3 className="font-semibold text-violet-300">Carry Over</h3>
          <p className="text-xs opacity-60 mt-1">Triage to lighten the load—just a few clicks</p>
        </div>
        <span className="text-xs opacity-70">· {items.length} {items.length===1?'item':'items'}{oldestAge>0?` (oldest ${oldestAge}d)`:''}</span>
        <div className="ml-auto flex items-center gap-2">
          {/* Snoozed items indicator */}
          {snoozedItems && snoozedItems.length > 0 && (
            <button 
              className="btn btn-sm flex items-center gap-1 opacity-70 hover:opacity-100" 
              onClick={() => setShowSnoozedModal(true)}
              title={`${snoozedItems.length} snoozed item${snoozedItems.length === 1 ? '' : 's'}`}
            >
              <HistoryIcon sx={{ fontSize: 16 }} />
              <span className="text-xs">{snoozedItems.length}</span>
            </button>
          )}
          {expanded && (
            <button 
              className="btn btn-sm flex items-center gap-1" 
              onClick={()=>setShowBulkActions(!showBulkActions)}
              title="Toggle bulk actions"
            >
              <EditIcon sx={{ fontSize: 16 }} />
              {showBulkActions ? 'Hide Bulk' : 'Bulk Edit'}
            </button>
          )}
          <button className="btn flex items-center gap-1" onClick={()=>setExpanded(!expanded)}>
            {expanded ? (
              <>
                <ExpandLessIcon sx={{ fontSize: 18 }} />
                Hide
              </>
            ) : (
              <>
                <ExpandMoreIcon sx={{ fontSize: 18 }} />
                Show
              </>
            )}
          </button>
        </div>
      </div>

      {expanded && (
        <>
          {/* Bulk actions - only show when toggled on */}
          {showBulkActions && (
            <div className="mt-3 space-y-3 p-3 rounded border border-white/10 bg-white/5">
              {/* Header row */}
              <div className="flex items-center gap-3">
                <label className="text-sm opacity-70 flex-shrink-0">
                  {anySelected ? `${idsSelected.length} selected` : 'Category:'}
                </label>
                <select
                  value={cat}
                  onChange={e=>setCat(e.target.value as any)}
                  title="Choose category for selected tasks (default: keep existing category)"
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
                {/* Add to Today */}
                <button
                  className="btn btn-sm btn-backlog flex items-center gap-1"
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
                  title={cat === 'keep' ? 'Add to On Deck and keep existing categories' : 'Add to On Deck and change to selected category'}
                >
                  <TodayIcon sx={{ fontSize: 16 }} />
                  Add to On Deck
                </button>

                {/* Pin to Top 3 */}
                <button
                  className="btn btn-sm btn-top3 flex items-center gap-1"
                  onClick={async()=>{
                    const ids = (anySelected ? idsSelected : items.map(i=>i.id))
                    await onAddToTop3(ids)
                    setSelected({})
                  }}
                  title="Pin to Top 3"
                >
                  <PushPinIcon sx={{ fontSize: 16 }} />
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
                    className="btn btn-sm flex items-center gap-1" 
                    onClick={async()=>{ await onComplete(anySelected?idsSelected:items.map(i=>i.id)); setSelected({}) }}
                  >
                    <CheckCircleIcon sx={{ fontSize: 16 }} />
                    Complete
                  </button>
                  <button 
                    className="btn btn-sm flex items-center gap-1 text-red-400 hover:text-red-300" 
                    onClick={async()=>{ await onDelete(anySelected?idsSelected:items.map(i=>i.id)); setSelected({}) }}
                  >
                    <DeleteIcon sx={{ fontSize: 16 }} />
                    Delete
                  </button>
                </div>
              </div>
              <div className="text-xs opacity-60">
                "Add to On Deck" does not add to Top 3
              </div>
            </div>
          )}

          {/* List (top N + show more) */}
          <ul className="mt-3 space-y-1">
            {top[0].map((t) => (
              <li key={t.id} className="p-3 rounded border border-white/5 hover:border-white/10 hover:bg-white/5">
                {/* Responsive layout that wraps actions when needed */}
                <div className="flex flex-wrap items-center gap-3">
                  {/* Left: Selection (bulk mode) + Task info */}
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {showBulkActions && (
                      <input type="checkbox" className="chk flex-shrink-0" checked={!!selected[t.id]} onChange={e=>setSelected(s=>({...s,[t.id]:e.target.checked}))} />
                    )}
                    {/* Task with completion button and metadata */}
                    <div className="flex-1 min-w-0">
                      <DraggableItem task={t} left={<CheckIconButton onClick={async (e)=>{ e.stopPropagation(); await onComplete([t.id]) }} />} />
                      <div className="text-xs opacity-60 mt-1 ml-6">{t.category} · {t.due_date}</div>
                    </div>
                  </div>
                  
                  {/* Right: Action buttons grouped by priority - will wrap on small screens */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {/* Primary actions - what users come here to do */}
                    <button 
                      className="btn btn-sm btn-top3 flex items-center gap-1" 
                      onClick={()=>onAddToTop3([t.id])}
                      title="Pin to Top 3"
                    >
                      <PushPinIcon sx={{ fontSize: 16 }} />
                      <span className="hidden sm:inline" style={{ whiteSpace: 'nowrap' }}>Top 3</span>
                    </button>
                    <select 
                      className="btn btn-sm btn-backlog text-sm min-w-0" 
                      onChange={async e=>{
                        const selectEl = e.currentTarget
                        const value = selectEl.value as any
                        // Reset UI immediately; element may unmount after the action
                        selectEl.selectedIndex = 0
                        if (!value) return
                        await onPromote([t.id], value, toISODate())
                      }}
                      title="Add to On Deck for today"
                    >
                      <option value="">Add to On Deck</option>
                      <option value="career">→ Career</option>
                      <option value="langpulse">→ LangPulse</option>
                      <option value="health">→ Health</option>
                      <option value="life">→ Life</option>
                    </select>
                    
                    {/* Secondary actions - management */}
                    <div className="flex items-center gap-1 opacity-70 hover:opacity-100 transition-opacity">
                      <button 
                        className="btn btn-sm px-2 flex items-center gap-1" 
                        onClick={()=>onSnooze([t.id], toISODate(addDays(new Date(),1)))}
                        title="Snooze until tomorrow"
                      >
                        <SnoozeIcon sx={{ fontSize: 16 }} />
                        <span className="hidden sm:inline text-xs">Snooze</span>
                      </button>
                      <button 
                        className="btn btn-sm px-2 text-red-400 hover:text-red-300 flex items-center gap-1" 
                        onClick={()=>onDelete([t.id])}
                        title="Delete task"
                        aria-label="Delete task"
                      >
                        <DeleteIcon sx={{ fontSize: 16 }} />
                      </button>
                    </div>
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

      {/* Snoozed Items Modal */}
      {showSnoozedModal && snoozedItems && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="w-full max-w-lg card p-4 max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold flex items-center gap-2">
                <HistoryIcon sx={{ fontSize: 20 }} />
                Snoozed Items
              </h3>
              <button 
                className="btn btn-sm" 
                onClick={() => setShowSnoozedModal(false)}
              >
                Close
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              {snoozedItems.length === 0 ? (
                <p className="text-center opacity-60 py-8">No snoozed items</p>
              ) : (
                <ul className="space-y-2">
                  {snoozedItems
                    .sort((a, b) => (a.due_date ?? '').localeCompare(b.due_date ?? ''))
                    .map((task) => (
                    <li key={task.id} className="p-3 rounded border border-white/10 hover:bg-white/5">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium">{task.title}</div>
                          <div className="text-xs opacity-60 mt-1">
                            {task.category} · Due {task.due_date}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <button 
                            className="btn btn-sm btn-backlog flex items-center gap-1"
                            onClick={async () => {
                              await onPromote([task.id], task.category, toISODate())
                              setShowSnoozedModal(false)
                            }}
                            title="Bring back to today"
                          >
                            <TodayIcon sx={{ fontSize: 14 }} />
                            <span className="text-xs">Today</span>
                          </button>
                          <button 
                            className="btn btn-sm flex items-center gap-1 text-red-400 hover:text-red-300"
                            onClick={async () => {
                              await onDelete([task.id])
                              setShowSnoozedModal(false)
                            }}
                            title="Delete permanently"
                            aria-label="Delete permanently"
                          >
                            <DeleteIcon sx={{ fontSize: 14 }} />
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 