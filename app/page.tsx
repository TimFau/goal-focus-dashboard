'use client'
import { useCallback, useEffect, useState } from 'react'
import EnergyToggle from '@/components/EnergyToggle'
import TopThree from '@/components/TopThree'
import CategoryList from '@/components/CategoryList'
import DayNav from '@/components/DayNav'
import { toISODate } from '@/lib/date'
import CarryOverCard from '@/components/CarryOverCard'
import TopThreeModal from '@/components/TopThreeModal'
import { DndProvider, Droppable } from '@/components/DnD'
import type { DragEndEvent } from '@dnd-kit/core'

type Task = { id: string; title: string; done: boolean; low_energy: boolean; category: 'career'|'langpulse'|'health'|'life'; due_date?: string }
type Data = {
  focus: Array<{ title?: string; task_id?: string } | null>
  view: 'planned' | 'all'
  today: string
  plannedToday: Task[]
  carryOver: Task[]
  snoozedItems?: Task[]
  career?: Task[]
  langpulse?: Task[]
  health?: Task[]
  life?: Task[]
}

async function fetchDashboard(date: string, view: 'planned'|'all'): Promise<Data> {
  const res = await fetch(`/api/dashboard?date=${date}&view=${view}`, { cache: 'no-store' })
  if (!res.ok) throw new Error('Failed')
  return res.json()
}

export default function Dashboard() {
  const [energy, setEnergy] = useState<'all'|'low'>('all')
  const [view, setView] = useState<'planned'|'all'>('planned')
  const [date, setDate] = useState<string>(() => {
    if (typeof window === 'undefined') return toISODate()
    const p = new URLSearchParams(window.location.search)
    return p.get('date') ?? toISODate()
  })
  const [data, setData] = useState<Data | null>(null)
  const [showTop3Modal, setShowTop3Modal] = useState(false)
  const [onDeckExpanded, setOnDeckExpanded] = useState<boolean>(false)
  const [initializedOnDeck, setInitializedOnDeck] = useState<boolean>(false)
  
  // Memoize load function to prevent unnecessary re-renders
  const load = useCallback(async () => {
    const p = new URLSearchParams(window.location.search)
    const d = p.get('date') ?? toISODate()
    const v = (p.get('view') as 'planned'|'all') || view
    setDate(d); setView(v)
    const payload = await fetchDashboard(d, v)
    setData(payload)

    // Morning prompt: if all three are blank and we haven't prompted today, show it
    const allBlank = !(payload.focus?.[0]?.title || payload.focus?.[1]?.title || payload.focus?.[2]?.title)
    const key = 'top3.prompt.'+toISODate()
    const prompted = localStorage.getItem(key) === '1'
    if (allBlank && !prompted) {
      setShowTop3Modal(true)
      localStorage.setItem(key, '1')
    }
  }, [view]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { 
    load().catch(()=>{})
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  
  // Initialize collapsible On Deck per-day state
  useEffect(() => {
    const key = 'ondeck.expanded.' + toISODate()
    const saved = localStorage.getItem(key)
    if (saved !== null) {
      setOnDeckExpanded(saved === '1')
    } else {
      setOnDeckExpanded(false)
    }
    setInitializedOnDeck(true)
  }, [])
  useEffect(() => {
    if (!initializedOnDeck) return
    const key = 'ondeck.expanded.' + toISODate()
    localStorage.setItem(key, onDeckExpanded ? '1' : '0')
  }, [onDeckExpanded, initializedOnDeck])
  
  // Check for URL changes periodically and on navigation events
  useEffect(() => {
    const checkForChanges = () => {
      const currentDate = new URLSearchParams(window.location.search).get('date') ?? toISODate()
      const currentView = (new URLSearchParams(window.location.search).get('view') as 'planned'|'all') || view
      if (currentDate !== date || currentView !== view) {
        load().catch(()=>{})
      }
    }
    
    // Check on navigation events
    const handleNavigation = () => checkForChanges()
    window.addEventListener('popstate', handleNavigation)
    
    // Also check periodically for programmatic changes
    // Use a longer interval in development to reduce hot reload issues
    const interval = setInterval(checkForChanges, process.env.NODE_ENV === 'development' ? 1000 : 500)
    
    return () => {
      window.removeEventListener('popstate', handleNavigation)
      clearInterval(interval)
    }
  }, [date, view, load]) // eslint-disable-line react-hooks/exhaustive-deps

  const handlers = {
    async setFocus(items: Array<{ title?: string; task_id?: string } | null>) {
      const payload = items.map(i => i ? ({ task_id: i.task_id, free_text: i.title && !i.task_id ? i.title : undefined }) : null)
      await fetch('/api/focus', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ date, items: payload }) })
      await load()
    },
    async markTaskDone(taskId: string) {
      await fetch('/api/tasks/'+taskId, { method:'PATCH', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ done: true }) })
      await load()
    },
    async toggleTask(id: string, done: boolean) {
      await fetch('/api/tasks/'+id, { method:'PATCH', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ done }) })
      await load()
    },
    async addTask(category: 'career'|'langpulse'|'health'|'life', title: string) {
      await fetch('/api/tasks', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ date, category, title }) })
      await load()
    },
    async promote(ids: string[], category: Task['category'], when: string) {
      await fetch('/api/tasks/bulk', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ ids, op:'promote', category, date: when }) })
      await load()
    },
    async snooze(ids: string[], when: string) {
      await fetch('/api/tasks/bulk', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ ids, op:'snooze', date: when }) })
      await load()
    },
    async del(ids: string[]) {
      await fetch('/api/tasks/bulk', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ ids, op:'delete' }) })
      await load()
    },
    setView(v: 'planned'|'all') {
      const q = new URLSearchParams(window.location.search)
      q.set('view', v); q.set('date', date)
      history.replaceState(null, '', '/?'+q.toString())
      setView(v)
      fetchDashboard(date, v).then(setData).catch(()=>{})
    },
    async addToTop3(ids: string[]) {
      if (!data) return
      // Build a lookup of all tasks by id (planned + carryOver + categories)
      const allTasks: Task[] = [
        ...(data.plannedToday ?? []),
        ...(data.carryOver ?? []),
        ...(data.career ?? []),
        ...(data.langpulse ?? []),
        ...(data.health ?? []),
        ...(data.life ?? []),
      ]
      const byId: Record<string, Task> = {}
      allTasks.forEach(t => { byId[t.id] = t })

      // Start with current focus from server (preserve task links)
      const current: Array<{ title?: string; task_id?: string } | null> = [0,1,2].map(i => ({
        title: (data.focus?.[i] as any)?.title ?? '',
        task_id: (data.focus?.[i] as any)?.task_id
      }))

      // Fill available slots with selected tasks (in order), without overwriting existing non-empty slots
      let slotIndex = 0
      for (const id of ids) {
        // Find next empty slot
        while (slotIndex < 3 && (current[slotIndex]?.title && current[slotIndex]?.title !== '')) slotIndex++
        if (slotIndex >= 3) break
        const task = byId[id]
        if (task) {
          current[slotIndex] = { title: task.title, task_id: task.id }
          slotIndex++
        }
      }
      await handlers.setFocus(current)
    }
  }

  if (!data) return <div>Loading…</div>

  const filterByEnergy = (tasks: Task[]) => energy==='all' ? tasks : tasks.filter(t=>t.low_energy)
  const carryOver = filterByEnergy(data.carryOver || [])
  const plannedToday = filterByEnergy(data.plannedToday || [])

  const onDragEnd = async (e: DragEndEvent) => {
    const task = e.active?.data?.current?.task as Task | undefined
    const target = e.over?.id as string | undefined
    if (!task || !target) return

    if (target.startsWith('top3-slot-')) {
      const slotNum = Number(target.split('-').pop())
      // Update Top 3 with this task and auto-save, preserving existing task links
      const current: Array<{ title?: string; task_id?: string } | null> = [0,1,2].map(i => ({
        title: (data.focus?.[i] as any)?.title ?? '',
        task_id: (data.focus?.[i] as any)?.task_id
      }))
      current[slotNum-1] = { title: task.title, task_id: task.id }
      await handlers.setFocus(current)
      return
    }

    // Dropped into category: add to today
    if (['career','langpulse','health','life'].includes(target)) {
      await handlers.promote([task.id], target as any, toISODate())
    }
  }

  return (
    <DndProvider onDragEnd={onDragEnd}>
      <main className="space-y-4">
        <DayNav />
        <div className="flex items-center gap-2">
          <div className="card p-2">
            <div className="inline-flex overflow-hidden rounded-md border border-white/10">
              <button className={`px-3 py-2 ${view==='planned' ? 'bg-white/10' : ''}`} onClick={()=>handlers.setView('planned')}>Today</button>
              <button className={`px-3 py-2 ${view==='all' ? 'bg-white/10' : ''}`} onClick={()=>handlers.setView('all')}>All</button>
            </div>
          </div>
          <EnergyToggle value={energy} onChange={setEnergy} />
        </div>

        <TopThree
          initial={data.focus}
          onSet={handlers.setFocus}
          onMarkTaskDone={handlers.markTaskDone}
          carryOverTasks={carryOver}
          plannedTasks={data.plannedToday}
          selectedDate={date}
          onPromote={handlers.promote}
          onSnooze={handlers.snooze}
        />

        <TopThreeModal
          open={showTop3Modal}
          onClose={()=>setShowTop3Modal(false)}
          plannedToday={plannedToday}
          carryOver={carryOver}
          onAccept={async (items: Array<{ title: string; task_id?: string }>)=>{ await handlers.setFocus(items); }}
          selectedDate={date}
        />

        {view === 'planned' ? (
          <>
            <section className="space-y-3">
              <CarryOverCard
                items={carryOver}
                onPromote={handlers.promote}
                onSnooze={handlers.snooze}
                onDelete={handlers.del}
                onComplete={async (ids)=>{ await fetch('/api/tasks/bulk', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ ids, op:'complete' }) }); await load() }}
                onAddToTop3={handlers.addToTop3}
                snoozedItems={data.snoozedItems}
              />
            </section>
            <div className="card p-4">
              <div className="flex items-center gap-3">
                <h3 className="font-semibold">On Deck <span className="opacity-60 text-sm">(Optional Wins)</span></h3>
                <span className="text-xs opacity-70">· {plannedToday.length} {plannedToday.length===1?'item':'items'}</span>
                <div className="ml-auto">
                  <button className="btn" onClick={()=>setOnDeckExpanded(!onDeckExpanded)}>{onDeckExpanded ? 'Hide' : 'Show'}</button>
                </div>
              </div>
              {!onDeckExpanded && (
                <p className="text-xs opacity-60 mt-2">Finish your Top 3 first. Peek when you want more.</p>
              )}
              {onDeckExpanded && (
                <div className="mt-4 grid gap-4">
                  <Droppable id="career">
                    <CategoryList title="Career" accent="backlog" tasks={(data.career ?? []).filter(t=>plannedToday.some(p=>p.id===t.id))}
                      energy={energy} onToggle={handlers.toggleTask} onAdd={(t)=>handlers.addTask('career', t)} />
                  </Droppable>
                  <Droppable id="langpulse">
                    <CategoryList title="LangPulse" accent="backlog" tasks={(data.langpulse ?? []).filter(t=>plannedToday.some(p=>p.id===t.id))}
                      energy={energy} onToggle={handlers.toggleTask} onAdd={(t)=>handlers.addTask('langpulse', t)} />
                  </Droppable>
                  <Droppable id="health">
                    <CategoryList title="Health" accent="backlog" tasks={(data.health ?? []).filter(t=>plannedToday.some(p=>p.id===t.id))}
                      energy={energy} onToggle={handlers.toggleTask} onAdd={(t)=>handlers.addTask('health', t)} />
                  </Droppable>
                  <Droppable id="life">
                    <CategoryList title="Life/Wedding" accent="backlog" tasks={(data.life ?? []).filter(t=>plannedToday.some(p=>p.id===t.id))}
                      energy={energy} onToggle={handlers.toggleTask} onAdd={(t)=>handlers.addTask('life', t)} />
                  </Droppable>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <div className="card p-4">
              <h3 className="font-semibold mb-2">All Active (incomplete)</h3>
              <p className="text-sm opacity-70 mb-3">Everything not done, sorted by date.</p>
              <ul className="space-y-2">
                {[...(data.career ?? []), ...(data.langpulse ?? []), ...(data.health ?? []), ...(data.life ?? [])]
                  .filter(t => (energy==='all' ? true : t.low_energy))
                  .sort((a,b)=>(a.due_date??'').localeCompare(b.due_date??''))
                  .map(t => (
                    <li key={t.id} className="flex items-center gap-3">
                      <input className="chk" type="checkbox" checked={t.done} onChange={e=>handlers.toggleTask(t.id, e.target.checked)} />
                      <span className={t.done ? 'line-through opacity-50' : ''}>{t.title}</span>
                      <span className="ml-auto text-xs opacity-60">{t.category} · {t.due_date}</span>
                    </li>
                  ))
                }
              </ul>
            </div>
          </>
        )}
      </main>
    </DndProvider>
  )
}
