'use client'
import { useEffect, useMemo, useState } from 'react'
import EnergyToggle from '@/components/EnergyToggle'
import TopThree from '@/components/TopThree'
import CategoryList from '@/components/CategoryList'
import DayNav from '@/components/DayNav'
import { toISODate } from '@/lib/date'

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
  const [energy, setEnergy] = useState<'all'|'low'>('all')
  const [view, setView] = useState<'planned'|'all'>('planned')
  const [date, setDate] = useState<string>(() => {
    const p = new URLSearchParams(window.location.search)
    return p.get('date') ?? toISODate()
  })
  const [data, setData] = useState<Data | null>(null)

  const load = async () => {
    const p = new URLSearchParams(window.location.search)
    const d = p.get('date') ?? toISODate()
    const v = (p.get('view') as 'planned'|'all') || view
    setDate(d); setView(v)
    const payload = await fetchDashboard(d, v)
    setData(payload)
  }

  useEffect(() => { load().catch(()=>{}) }, [])

  const handlers = {
    async setFocus(items: {title?:string}[]) {
      await fetch('/api/focus', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ date, items: items.map(i => ({ free_text: i?.title ?? '' })) }) })
      await load()
    },
    async toggleTask(id: string, done: boolean) {
      await fetch('/api/tasks/'+id, { method:'PATCH', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ done }) })
      await load()
    },
    async addTask(category: 'career'|'langpulse'|'health'|'life', title: string) {
      const res = await fetch('/api/tasks', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ date, category, title }) })
      if (!res.ok) return
      await load()
    },
    setView(v: 'planned'|'all') {
      const q = new URLSearchParams(window.location.search)
      q.set('view', v); q.set('date', date)
      history.replaceState(null, '', '/?'+q.toString())
      setView(v)
      fetchDashboard(date, v).then(setData).catch(()=>{})
    }
  }

  if (!data) return <div>Loading…</div>

  // Helpers
  const filterByEnergy = (tasks: Task[]) => energy==='all' ? tasks : tasks.filter(t=>t.low_energy)

  const carryOver = filterByEnergy(data.carryOver || [])
  const plannedToday = filterByEnergy(data.plannedToday || [])

  return (
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
          {carryOver.length > 0 && (
            <div className="card p-4">
              <h3 className="font-semibold mb-2">Carry Over</h3>
              <ul className="space-y-2">
                {carryOver.map(t => (
                  <li key={t.id} className="flex items-center gap-3">
                    <input className="chk" type="checkbox" checked={t.done} onChange={e=>handlers.toggleTask(t.id, e.target.checked)} />
                    <span className={t.done ? 'line-through opacity-50' : ''}>{t.title}</span>
                    <span className="ml-auto text-xs opacity-60">{t.category}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="grid gap-4">
            <CategoryList title="Career" tasks={(data.career ?? []).filter(t=>plannedToday.some(p=>p.id===t.id))} energy={energy}
              onToggle={handlers.toggleTask} onAdd={(t)=>handlers.addTask('career', t)} />
            <CategoryList title="LangPulse" tasks={(data.langpulse ?? []).filter(t=>plannedToday.some(p=>p.id===t.id))} energy={energy}
              onToggle={handlers.toggleTask} onAdd={(t)=>handlers.addTask('langpulse', t)} />
            <CategoryList title="Health" tasks={(data.health ?? []).filter(t=>plannedToday.some(p=>p.id===t.id))} energy={energy}
              onToggle={handlers.toggleTask} onAdd={(t)=>handlers.addTask('health', t)} />
            <CategoryList title="Life/Wedding" tasks={(data.life ?? []).filter(t=>plannedToday.some(p=>p.id===t.id))} energy={energy}
              onToggle={handlers.toggleTask} onAdd={(t)=>handlers.addTask('life', t)} />
          </div>
        </>
      ) : (
        <>
          <div className="card p-4">
            <h3 className="font-semibold mb-2">All Active (incomplete)</h3>
            <p className="text-sm opacity-70 mb-3">Everything not done, sorted by date.</p>
            <ul className="space-y-2">
              {filterByEnergy([...(data.career ?? []), ...(data.langpulse ?? []), ...(data.health ?? []), ...(data.life ?? [])]
                .sort((a,b)=>(a.due_date??'').localeCompare(b.due_date??'')))
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
  )
}
