'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useEffect } from 'react'

export default function SettingsPage() {
  const [tz, setTz] = useState('America/New_York')
  const [morning, setMorning] = useState('08:30')
  const [midday, setMidday] = useState('13:00')
  const [evening, setEvening] = useState('20:30')
  const [babautaMode, setBabautaMode] = useState(false)
  const [targetMinutes, setTargetMinutes] = useState(90)
  const [celebrationCues, setCelebrationCues] = useState(true)
  const [hideCarryOver, setHideCarryOver] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [user, setUser] = useState<any>(null)
  // const supabase = createSsrClient() // REMOVED

  useEffect(() => {
    const getAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    getAuth()
  }, [])

  useEffect(() => {
    if (user) {
      const fetchSettings = async () => {
        const { data, error } = await supabase
          .from('profiles')
          .select('timezone, remind_morning, remind_midday, remind_evening, babauta_mode_enabled, top3_focus_target_minutes, celebration_cues_enabled, auto_hide_carry_over_on_focus_done')
          .eq('user_id', user.id)
          .single()
        
        if (data) {
          setTz(data.timezone || 'America/New_York')
          setMorning(data.remind_morning || '08:30')
          setMidday(data.remind_midday || '13:00')
          setEvening(data.remind_evening || '20:30')
          setBabautaMode(data.babauta_mode_enabled ?? false)
          setTargetMinutes(data.top3_focus_target_minutes ?? 90)
          setCelebrationCues(data.celebration_cues_enabled ?? true)
          setHideCarryOver(data.auto_hide_carry_over_on_focus_done ?? false)
        }
      }
      fetchSettings()
    }
  }, [user, supabase])

  const handleSave = async () => {
    if (!user) return
    setIsSaving(true)
    setSaveStatus('saving')
    const { error } = await supabase
      .from('profiles')
      .upsert({
        user_id: user.id,
        timezone: tz,
        remind_morning: morning,
        remind_midday: midday,
        remind_evening: evening,
        babauta_mode_enabled: babautaMode,
        top3_focus_target_minutes: targetMinutes,
        celebration_cues_enabled: celebrationCues,
        auto_hide_carry_over_on_focus_done: hideCarryOver,
      })
    
    if (error) {
      console.error('Error saving settings:', error)
      setSaveStatus('error')
    } else {
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 3000)
    }
    setIsSaving(false)
  }

  const targetOptions = [30, 45, 60, 75, 90, 105, 120, 150, 180]

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
        <h2 className="font-semibold mb-3">Focus-Time Done Rule</h2>
        <div className="space-y-3">
          <label className="flex items-center gap-2">
            <input type="checkbox" className="chk" checked={babautaMode} onChange={e => setBabautaMode(e.target.checked)} />
            Enable focus-time done rule for Top 3
          </label>
          <label>
            Target duration (minutes)
            <select value={targetMinutes} onChange={e => setTargetMinutes(Number(e.target.value))}>
              {targetOptions.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" className="chk" checked={celebrationCues} onChange={e => setCelebrationCues(e.target.checked)} />
            Enable celebration cues (animations, sounds)
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" className="chk" checked={hideCarryOver} onChange={e => setHideCarryOver(e.target.checked)} />
            Auto-hide Carry Over when all Top 3 slots are done with focus time
          </label>
        </div>
        <div className="mt-4">
          <button className="btn" onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : saveStatus === 'saved' ? 'Saved!' : saveStatus === 'error' ? 'Error!' : 'Save'}
          </button>
        </div>
      </div>
      <div className="card p-4">
        <h2 className="font-semibold mb-3">Weekly Template</h2>
        <p className="opacity-70">Edit in Supabase for v1 (see <code>supabase/schema.sql</code>). UI editor comes in v1.1.</p>
      </div>
    </main>
  )
}
