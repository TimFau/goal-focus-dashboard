'use client'
import { useState } from 'react'

export default function SettingsPage() {
  const [tz, setTz] = useState('America/New_York')
  const [morning, setMorning] = useState('08:30')
  const [midday, setMidday] = useState('13:00')
  const [evening, setEvening] = useState('20:30')
  return (
    <main className="space-y-4">
      <div className="card p-4">
        <h2 className="font-semibold mb-3">Reminders</h2>
        <div className="grid md:grid-cols-2 gap-3">
          <label>Timezone<select value={tz} onChange={e=>setTz(e.target.value)}>
            <option>America/New_York</option>
            <option>America/Chicago</option>
            <option>America/Denver</option>
            <option>America/Los_Angeles</option>
          </select></label>
          <label>Morning <input type="time" value={morning} onChange={e=>setMorning(e.target.value)} /></label>
          <label>Midday <input type="time" value={midday} onChange={e=>setMidday(e.target.value)} /></label>
          <label>Evening <input type="time" value={evening} onChange={e=>setEvening(e.target.value)} /></label>
        </div>
        <div className="mt-3">
          <button className="btn">Save</button>
        </div>
      </div>
      <div className="card p-4">
        <h2 className="font-semibold mb-3">Weekly Template</h2>
        <p className="opacity-70">Edit in Supabase for v1 (see <code>supabase/schema.sql</code>). UI editor comes in v1.1.</p>
      </div>
    </main>
  )
}
