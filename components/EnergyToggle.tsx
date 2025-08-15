'use client'
import SelfImprovementIcon from '@mui/icons-material/SelfImprovement'

type Props = { value: 'all' | 'low', onChange: (v: 'all'|'low') => void }
export default function EnergyToggle({value, onChange}: Props) {
  return (
    <div className="card p-2" title="Energy mode">
      <div className="text-xs opacity-70 mb-2">Energy mode</div>
      <div className="inline-flex rounded-lg border border-white/10 overflow-hidden">
        <button className={`px-3 py-2 ${value==='all'?'bg-white/10':''}`} onClick={()=>onChange('all')}>All</button>
        <button 
          className={`px-3 py-2 flex items-center gap-1 ${value==='low'?'bg-blue-300/10 text-blue-300':'text-blue-200'}`} 
          onClick={()=>onChange('low')}
          title="Low shows tasks marked low energy—great for depleted moments"
        >
          <SelfImprovementIcon sx={{ fontSize: 14 }} />
          Low
        </button>
      </div>
    </div>
  )
}
