'use client'
type Props = { value: 'all' | 'low', onChange: (v: 'all'|'low') => void }
export default function EnergyToggle({value, onChange}: Props) {
  return (
    <div className="mb-3 inline-flex rounded-lg border border-white/10 overflow-hidden">
      <button className={`px-3 py-2 ${value==='all'?'bg-white/10':''}`} onClick={()=>onChange('all')}>All</button>
      <button className={`px-3 py-2 ${value==='low'?'bg-white/10':''}`} onClick={()=>onChange('low')}>Low-energy only</button>
    </div>
  )
}
