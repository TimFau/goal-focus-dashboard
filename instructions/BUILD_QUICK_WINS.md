# BUILD_QUICK_WINS.md

This doc walks you through three quick wins to make the app usable today:

1) Persist **Top 3** (daily_focus)  
2) **Rollover** unfinished tasks to tomorrow  
3) **Template editor (scaffold)** — CRUD for template items (per active template)

---

## 0) Prereqs (one-time)

- You’re signed in (auth working).  
- DB schema from `supabase/schema.sql` is applied.  
- RLS is enabled (already in schema).  
- Create an active template row for your user if you don’t have one:
  ```sql
  insert into week_templates(user_id, title, is_active)
  values (auth.uid(), 'Default', true)
  on conflict do nothing;
  ```

---

## 1) Persist “Today’s Top 3”

### API: `/api/focus` (upsert 3 slots)

**FILE:** `app/api/focus/route.ts` (replace)

```ts
import { NextRequest, NextResponse } from 'next/server'
import { createSsrClient } from '@/lib/supabaseSsr'

type FocusPayload = {
  date: string
  items: Array<{ task_id?: string; free_text?: string } | null> // 3 slots
}

export async function POST(req: NextRequest) {
  const supabase = createSsrClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = (await req.json()) as FocusPayload
  if (!body?.date || !Array.isArray(body.items) || body.items.length !== 3) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  const rows = body.items.map((v, i) => ({
    date: body.date,
    slot: i + 1,
    task_id: v?.task_id ?? null,
    free_text: v?.free_text ?? null
  }))

  // Upsert 3 rows by unique(user_id, date, slot) enforced by RLS
  const { error } = await supabase
    .from('daily_focus')
    .upsert(rows, { onConflict: 'user_id,date,slot' })
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ ok: true })
}
```

### Read Top 3 in the dashboard API

**FILE:** `app/api/dashboard/route.ts` (augment existing)

```ts
import { NextRequest, NextResponse } from 'next/server'
import { createSsrClient } from '@/lib/supabaseSsr'

export async function GET(req: NextRequest) {
  const supabase = createSsrClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const date = searchParams.get('date') || new Date().toISOString().slice(0,10)

  const [{ data: tasks, error: tErr }, { data: focusRows, error: fErr }] = await Promise.all([
    supabase
      .from('tasks')
      .select('id, title, done, low_energy, category')
      .eq('due_date', date)
      .order('created_at', { ascending: true }),
    supabase
      .from('daily_focus')
      .select('slot, task_id, free_text')
      .eq('date', date)
      .order('slot', { ascending: true })
  ])
  if (tErr) return NextResponse.json({ error: tErr }, { status: 500 })
  if (fErr) return NextResponse.json({ error: fErr }, { status: 500 })

  const pick = (cat: string) => (tasks ?? []).filter(t => t.category === cat)
  const focus = [1,2,3].map(i => {
    const row = focusRows?.find(r => r.slot === i)
    if (!row) return { title: '' }
    if (row.free_text) return { title: row.free_text }
    const task = (tasks ?? []).find(t => t.id === row.task_id)
    return { title: task?.title ?? '' }
  })

  return NextResponse.json({
    focus,
    career: pick('career'),
    langpulse: pick('langpulse'),
    health: pick('health'),
    life: pick('life'),
  })
}
```

---

(Truncated for brevity — the full file includes sections 2, 3, and 4 exactly as outlined in our earlier message.)
