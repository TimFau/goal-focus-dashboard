'use client'
import { useEffect, useState } from 'react'
import EnergyToggle from '@/components/EnergyToggle'
import TopThree from '@/components/TopThree'
import CategoryList from '@/components/CategoryList'
import DayNav from '@/components/DayNav'
import { toISODate } from '@/lib/date'

type Task = { id: string; title: string; done: boolean; low_energy: boolean }
type Data = {
  focus: { title: string }[]
  career: Task[]
  langpulse: Task[]
  health: Task[]
  life: Task[]
}

async function fetchDashboard(date: string): Promise<Data> {
  const res = await fetch('/api/dashboard?date=' + date, { cache: 'no-store' })
  if (!res.ok) throw new Error('Failed')
  return res.json()
}

export default function Dashboard() {
  const [energy, setEnergy] = useState<'all'|'low'>('all')
  const [data, setData] = useState<Data | null>(null)

  useEffect(() => {
    const p = new URLSearchParams(window.location.search)
    const d = p.get('date') ?? toISODate()
    fetchDashboard(d).then(setData).catch(()=>{
      // fallback mock
      setData({
        focus: [{title:''},{title:''},{title:''}],
        career: [
          {id:'c1', title:'Update LinkedIn headline', done:false, low_energy:true},
          {id:'c2', title:'Add 1 resume bullet', done:false, low_energy:true}
        ],
        langpulse: [
          {id:'l1', title:'Open repo & review 1 file', done:false, low_energy:true},
          {id:'l2', title:'Fix 1 tiny styling bug', done:false, low_energy:false}
        ],
        health: [
          {id:'h1', title:'Log all meals', done:false, low_energy:false},
          {id:'h2', title:'5-min walk after dinner', done:false, low_energy:true}
        ],
        life: [
          {id:'lf1', title:'15-min tidy burst', done:false, low_energy:true},
          {id:'lf2', title:'Message 1 vendor', done:false, low_energy:false}
        ],
      })
    })
  }, [])

  const handlers = {
    async setFocus(items: {title?:string}[]) {
      await fetch('/api/focus', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ date: toISODate(), items }) })
    },
    async toggleTask(id: string, done: boolean) {
      await fetch('/api/tasks/'+id, { method:'PATCH', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ done }) })
      setData(d => d ? ({...d, 
        career: d.career.map(t=>t.id===id?{...t,done}:t),
        langpulse: d.langpulse.map(t=>t.id===id?{...t,done}:t),
        health: d.health.map(t=>t.id===id?{...t,done}:t),
        life: d.life.map(t=>t.id===id?{...t,done}:t),
      }) : d)
    },
    async addTask(category: 'career'|'langpulse'|'health'|'life', title: string) {
      const res = await fetch('/api/tasks', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ date: toISODate(), category, title }) })
      const created = await res.json()
      setData(d => d ? ({...d, [category]: [...(d as any)[category], created] }) : d)
    }
  }

  if (!data) return <div>Loading…</div>

  return (
    <main className="space-y-4">
      <DayNav />
      <TopThree initial={data.focus} onSet={(items)=>handlers.setFocus(items as any)} />
      <div>
        <EnergyToggle value={energy} onChange={setEnergy} />
      </div>
      <div className="grid gap-4">
        <CategoryList title="Career" tasks={data.career} energy={energy}
          onToggle={handlers.toggleTask} onAdd={(t)=>handlers.addTask('career', t)} />
        <CategoryList title="LangPulse" tasks={data.langpulse} energy={energy}
          onToggle={handlers.toggleTask} onAdd={(t)=>handlers.addTask('langpulse', t)} />
        <CategoryList title="Health" tasks={data.health} energy={energy}
          onToggle={handlers.toggleTask} onAdd={(t)=>handlers.addTask('health', t)} />
        <CategoryList title="Life/Wedding" tasks={data.life} energy={energy}
          onToggle={handlers.toggleTask} onAdd={(t)=>handlers.addTask('life', t)} />
      </div>
    </main>
  )
}
