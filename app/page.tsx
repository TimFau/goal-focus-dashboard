'use client'
import { useEffect, useMemo, useState } from 'react'
import EnergyToggle from '@/components/EnergyToggle'
import TopThree from '@/components/TopThree'
import CategoryList from '@/components/CategoryList'
import DayNav from '@/components/DayNav'
import { toISODate } from '@/lib/date'
import CarryOverCard from '@/components/CarryOverCard'
import { DndProvider, Droppable } from '@/components/DnD'
import type { DragEndEvent } from '@dnd-kit/core'
import { useRouter, useSearchParams } from 'next/navigation'
import { CheckIconButton } from '@/components/IconButton'

type Task = { id: string; title: string; done: boolean; low_energy: boolean; category: 'career'|'langpulse'|'health'|'life'; due_date?: string }
type Data = {
  focus: { title: string }[]
  view: 'planned' | 'all'
  today: string
  plannedToday: Task[]
  carryOver: Task[]
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
  const router = useRouter()
  const params = useSearchParams()

  const date = params.get('date') ?? toISODate()
  const view = (params.get('view') as 'planned'|'all') || 'planned'

  const [energy, setEnergy] = useState<'all'|'low'>('all')
  const [data, setData] = useState<Data | null>(null)

  const load = async (d: string, v: 'planned'|'all') => {
    const payload = await fetchDashboard(d, v)
    setData(payload)
  }

  useEffect(() => { load(date, view).catch(()=>{}) }, [date, view])

  const handlers = {
    async setFocus(items: {title?:string}[]) {
      await fetch('/api/focus', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ date, items: items.map(i => ({ free_text: i?.title ?? '' })) }) })
      await load(date, view)
    },
    async toggleTask(id: string, done: boolean) {
      await fetch('/api/tasks/'+id, { method:'PATCH', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ done }) })
      await load(date, view)
    },
    async addTask(category: 'career'|'langpulse'|'health'|'life', title: string) {
      await fetch('/api/tasks', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ date, category, title }) })
      await load(date, view)
    },
    async promote(ids: string[], category: Task['category'], when: string) {
      await fetch('/api/tasks/bulk', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ ids, op:'promote', category, date: when }) })
      await load(date, view)
    },
    async snooze(ids: string[], when: string) {
      await fetch('/api/tasks/bulk', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ ids, op:'snooze', date: when }) })
      await load(date, view)
    },
    async del(ids: string[]) {
      await fetch('/api/tasks/bulk', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ ids, op:'delete' }) })
      await load(date, view)
    },
    async complete(ids: string[]) {
      await fetch('/api/tasks/bulk', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ ids, op:'complete' }) })
      await load(date, view)
    },
    setView(v: 'planned'|'all') {
      const q = new URLSearchParams(params.toString())
      q.set('view', v); q.set('date', date)
      router.replace('/?'+q.toString())
    }
  }

  if (!data) return <div>Loading…</div>

  const filterByEnergy = (tasks: Task[]) => energy==='all' ? tasks : tasks.filter(t=>t.low_energy)
  const carryOver = filterByEnergy(data.carryOver || [])
  const plannedToday = filterByEnergy(data.plannedToday || [])

  const onDragEnd = async (e: DragEndEvent) => {
    const task = e.active?.data?.current?.task as Task | undefined
    const target = e.over?.id as 'career'|'langpulse'|'health'|'life'|undefined
    if (!task || !target) return
    // Promote to today + set category from drop target
    await handlers.promote([task.id], target, toISODate())
  }

  return (
    <DndProvider onDragEnd={onDragEnd}>
      <main className="space-y-4">
        <DayNav />
        <div className="flex items-center gap-2">
          <div className="card p-2">
            <div className="inline-flex overflow-hidden rounded-md border border-white/10">
              <button className={`px-3 py-2 ${view==='planned' ? 'bg-white/10' : ''}`} onClick={()=>handlers.setView('planned')}>Planned</button>
              <button className={`px-3 py-2 ${view==='all' ? 'bg-white/10' : ''}`} onClick={()=>handlers.setView('all')}>All Active</button>
            </div>
          </div>
          <EnergyToggle value={energy} onChange={setEnergy} />
        </div>

        <TopThree initial={data.focus} onSet={(items)=>handlers.setFocus(items as any)} />

        {view === 'planned' ? (
          <>
            <CarryOverCard
              items={carryOver}
              onPromote={handlers.promote}
              onSnooze={handlers.snooze}
              onDelete={handlers.del}
              onComplete={handlers.complete}
            />

            <div className="grid gap-4">
              <Droppable id="career">
                <CategoryList title="Career" tasks={(data.career ?? []).filter(t=>plannedToday.some(p=>p.id===t.id))}
                  energy={energy} onToggle={handlers.toggleTask} onAdd={(t)=>handlers.addTask('career', t)} />
              </Droppable>
              <Droppable id="langpulse">
                <CategoryList title="LangPulse" tasks={(data.langpulse ?? []).filter(t=>plannedToday.some(p=>p.id===t.id))}
                  energy={energy} onToggle={handlers.toggleTask} onAdd={(t)=>handlers.addTask('langpulse', t)} />
              </Droppable>
              <Droppable id="health">
                <CategoryList title="Health" tasks={(data.health ?? []).filter(t=>plannedToday.some(p=>p.id===t.id))}
                  energy={energy} onToggle={handlers.toggleTask} onAdd={(t)=>handlers.addTask('health', t)} />
              </Droppable>
              <Droppable id="life">
                <CategoryList title="Life/Wedding" tasks={(data.life ?? []).filter(t=>plannedToday.some(p=>p.id===t.id))}
                  energy={energy} onToggle={handlers.toggleTask} onAdd={(t)=>handlers.addTask('life', t)} />
              </Droppable>
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
                      <CheckIconButton aria-label={t.done ? 'Mark task as not done' : 'Mark task as done'} title={t.done ? 'Mark task as not done' : 'Mark task as done'} onClick={()=>handlers.toggleTask(t.id, !t.done)} />
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
