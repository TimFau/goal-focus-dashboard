import { NextRequest, NextResponse } from 'next/server'
import { createSsrClient } from '@/lib/supabaseSsr'

function toISODate(d = new Date()) {
  const dt = new Date(d); dt.setHours(0,0,0,0); return dt.toISOString().slice(0,10)
}

export async function GET(req: NextRequest) {
  const supabase = createSsrClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const date = searchParams.get('date') || toISODate()
  const view = (searchParams.get('view') || 'planned') as 'planned' | 'all'

  if (view === 'all') {
    // ALL ACTIVE: everything incomplete, any date
    const { data: all, error } = await supabase
      .from('tasks')
      .select('id, title, done, low_energy, category, due_date')
      .eq('done', false)
      .order('due_date', { ascending: true })
      .order('created_at', { ascending: true })
    if (error) return NextResponse.json({ error }, { status: 500 })

    const pick = (cat: string) => (all ?? []).filter(t => t.category === cat)
    return NextResponse.json({
      focus: [{ title:'' }, { title:'' }, { title:'' }], // daily_focus can be added later
      view,
      today: toISODate(),
      plannedToday: (all ?? []).filter(t => t.due_date === date),
      carryOver: (all ?? []).filter(t => t.due_date && t.due_date < date),
      career: pick('career'),
      langpulse: pick('langpulse'),
      health: pick('health'),
      life: pick('life'),
    })
  }

  // PLANNED: today's tasks, plus carry-over from earlier dates, plus snoozed items
  const [{ data: planned, error: pErr }, { data: carry, error: cErr }, { data: snoozed, error: sErr }, { data: focusRows, error: fErr }, { data: focusLogs, error: logErr }] = await Promise.all([
    supabase
      .from('tasks')
      .select('id, title, done, low_energy, category, due_date')
      .eq('due_date', date)
      .order('created_at', { ascending: true }),
    supabase
      .from('tasks')
      .select('id, title, done, low_energy, category, due_date')
      .lt('due_date', date)
      .eq('done', false)
      .order('due_date', { ascending: true })
      .order('created_at', { ascending: true }),
    supabase
      .from('tasks')
      .select('id, title, done, low_energy, category, due_date')
      .gt('due_date', date)
      .eq('done', false)
      .order('due_date', { ascending: true })
      .order('created_at', { ascending: true }),
    supabase
      .from('daily_focus')
      .select('slot, task_id, free_text')
      .eq('date', date)
      .order('slot', { ascending: true }),
    supabase
      .from('task_focus_log')
      .select('task_id, minutes')
      .eq('date', date),
  ])

  if (pErr) return NextResponse.json({ error: pErr }, { status: 500 })
  if (cErr) return NextResponse.json({ error: cErr }, { status: 500 })
  if (sErr) return NextResponse.json({ error: sErr }, { status: 500 })
  if (fErr) return NextResponse.json({ error: fErr }, { status: 500 })
  if (logErr) return NextResponse.json({ error: logErr }, { status: 500 })

  const tasks = planned ?? []
  const carryOver = carry ?? []
  const snoozedItems = snoozed ?? []

  const focusLogsMap = new Map<string, number>();
  focusLogs?.forEach(log => {
    focusLogsMap.set(log.task_id, (focusLogsMap.get(log.task_id) || 0) + log.minutes);
  });

  const pick = (cat: string, src: any[]) => (src ?? []).filter(t => t.category === cat)
  const focus = [1,2,3].map(i => {
    const row = focusRows?.find(r => r.slot === i)
    if (!row) return { title: '', focus_minutes: 0 }
    if (row.free_text) return { title: row.free_text, focus_minutes: 0 }
    const all = [...(tasks ?? []), ...(carryOver ?? [])]
    const found = all.find(t => t.id === row.task_id)
    return { title: found?.title ?? '', task_id: row.task_id ?? undefined, focus_minutes: focusLogsMap.get(row.task_id) || 0 }
  })

  // Fetch user settings for babauta_mode_enabled and top3_focus_target_minutes
  const { data: userSettings, error: settingsError } = await supabase
    .from('profiles')
    .select('babauta_mode_enabled, top3_focus_target_minutes, celebration_cues_enabled, auto_hide_carry_over_on_focus_done')
    .eq('user_id', auth.user.id)
    .single()
  
  if (settingsError) return NextResponse.json({ error: settingsError }, { status: 500 })

  return NextResponse.json({
    focus: focus.map(f => ({
      title: f.title,
      task_id: f.task_id,
      focus_minutes: f.focus_minutes,
    })),
    view: 'planned',
    today: date,
    plannedToday: tasks,
    carryOver,
    snoozedItems,
    // category groupings for convenience in client
    career: pick('career', tasks),
    langpulse: pick('langpulse', tasks),
    health: pick('health', tasks),
    life: pick('life', tasks),
    babautaModeEnabled: userSettings?.babauta_mode_enabled ?? false,
    top3FocusTargetMinutes: userSettings?.top3_focus_target_minutes ?? 90,
    celebrationCuesEnabled: userSettings?.celebration_cues_enabled ?? true,
    autoHideCarryOverOnFocusDone: userSettings?.auto_hide_carry_over_on_focus_done ?? false,
  })
}
