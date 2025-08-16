'use client'
type Task = { id: string; title: string; done: boolean; low_energy: boolean; focus_minutes?: number }
type Props = {
  title: string
  tasks: Task[]
  onToggle: (id: string, done: boolean) => Promise<void>
  onAdd: (title: string) => Promise<void>
  energy: 'all'|'low'
  accent?: 'backlog' | 'default'
  babautaModeEnabled: boolean
  top3FocusTargetMinutes: number
}
import { useState, useMemo } from 'react'
import { CheckIconButton } from '@/components/IconButton'
import CircularProgress from '@mui/material/CircularProgress'

export default function CategoryList({title, tasks, onToggle, onAdd, energy, accent = 'default', babautaModeEnabled, top3FocusTargetMinutes}: Props) {
  const [adding, setAdding] = useState('')
  const filtered = useMemo(()=> energy==='all' ? tasks : tasks.filter(t=>t.low_energy), [tasks, energy])
  const add = async () => {
    if (!adding.trim()) return
    await onAdd(adding.trim())
    setAdding('')
  }
  return (
    <div className={`card p-4 ${accent==='backlog' ? 'card-backlog accent-backlog' : ''}`}>
      <h3 className="font-semibold mb-2">{title}</h3>
      <ul className="space-y-2">
        {filtered.map(t => (
          <li key={t.id} className="flex items-center gap-3">
            <CheckIconButton aria-label={t.done ? 'Mark task as not done' : 'Mark task as done'} title={t.done ? 'Mark task as not done' : 'Mark task as done'} onClick={()=>onToggle(t.id, !t.done)} />
            <label className={t.done ? 'line-through opacity-50' : ''}>{t.title}</label>
            {t.low_energy && <span className="ml-auto text-xs opacity-60">low</span>}
            {babautaModeEnabled && t.focus_minutes !== undefined && t.focus_minutes > 0 && (
              <span className="ml-auto flex items-center gap-1 text-xs opacity-60">
                <CircularProgress 
                  variant="determinate" 
                  value={(t.focus_minutes / top3FocusTargetMinutes) * 100} 
                  size={16} 
                  thickness={4}
                  className="text-amber-300"
                />
                {t.focus_minutes}m
              </span>
            )}
          </li>
        ))}
      </ul>
      <div className="mt-3 flex gap-2">
        <input type="text" placeholder="Quick add…" value={adding} onChange={e=>setAdding(e.target.value)} />
        <button className="btn btn-backlog" onClick={add}>Add</button>
      </div>
    </div>
  )
}
