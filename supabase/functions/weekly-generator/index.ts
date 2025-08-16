// deno-lint-ignore-file no-explicit-any
// Pin compatible versions on esm.sh
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
// date-fns-tz v2 expects date-fns v2 — pin both:
import { utcToZonedTime } from "https://esm.sh/date-fns-tz@2.0.0?deps=date-fns@2.30.0";
import { format } from "https://esm.sh/date-fns@2.30.0";
type Profile = { user_id: string; timezone: string; };
type TemplateItem = {
  id: string; category: "career" | "langpulse" | "health" | "life";
  title: string; low_energy: boolean; sort_index: number;
};

function mondayOfLocal(date: Date) {
  const day = (date.getDay() + 6) % 7; // Mon=0..Sun=6
  const d = new Date(date);
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDaysLocal(d: Date, n: number) {
  const c = new Date(d);
  c.setDate(c.getDate() + n);
  return c;
}

Deno.serve(async () => {
  const url = Deno.env.get("SUPABASE_URL")!;
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(url, key, { auth: { persistSession: false } });

  const { data: profiles, error: pErr } = await supabase
    .from("profiles").select("user_id, timezone");
  if (pErr) return new Response(JSON.stringify({ ok: false, error: pErr }), { status: 500 });

  const nowUtc = new Date();
  const results: any[] = [];

  for (const prof of (profiles ?? []) as Profile[]) {
    const tz = prof.timezone || "America/New_York";
    const nowLocal = utcToZonedTime(nowUtc, tz);
    const localHour = nowLocal.getHours();
    const localDow = nowLocal.getDay(); // Sun=0..Sat=6

    // Only run at Monday 04:00 local
    if (!(localDow === 1 && localHour === 4)) {
      results.push({ user: prof.user_id, skipped: true });
      continue;
    }

    const localMonday = mondayOfLocal(nowLocal);
    const weekStartStr = format(localMonday, "yyyy-MM-dd");

    const { data: existing, error: wkErr } = await supabase
      .from("weeks").select("id")
      .eq("user_id", prof.user_id).eq("week_start", weekStartStr).maybeSingle();
    if (wkErr) { results.push({ user: prof.user_id, error: wkErr }); continue; }
    if (existing) { results.push({ user: prof.user_id, alreadyExists: true }); continue; }

    const { data: tmpl, error: tErr } = await supabase
      .from("week_templates").select("id")
      .eq("user_id", prof.user_id).eq("is_active", true).maybeSingle();
    if (tErr) { results.push({ user: prof.user_id, error: tErr }); continue; }

    const { data: week, error: cWErr } = await supabase
      .from("weeks").insert({
        user_id: prof.user_id,
        week_start: weekStartStr,
        created_from_template: tmpl?.id ?? null,
      }).select("id").single();
    if (cWErr || !week) { results.push({ user: prof.user_id, error: cWErr ?? "week create failed" }); continue; }

    if (!tmpl) { results.push({ user: prof.user_id, week: week.id, createdTasks: 0 }); continue; }

    const { data: items, error: iErr } = await supabase
      .from("template_items")
      .select("id, category, title, low_energy, sort_index")
      .eq("template_id", tmpl.id)
      .order("sort_index", { ascending: true });
    if (iErr) { results.push({ user: prof.user_id, error: iErr }); continue; }

    const dueDates = Array.from({ length: 7 }).map((_, i) =>
      format(addDaysLocal(localMonday, i), "yyyy-MM-dd"));

    const toInsert = [];
    for (const dd of dueDates) {
      for (const it of (items ?? []) as TemplateItem[]) {
        toInsert.push({
          user_id: prof.user_id,
          week_id: week.id,
          due_date: dd,
          category: it.category,
          title: it.title,
          low_energy: it.low_energy,
          created_from_template_item: it.id,
        });
      }
    }

    if (toInsert.length) {
      const { error: insErr } = await supabase.from("tasks").insert(toInsert);
      if (insErr) { results.push({ user: prof.user_id, week: week.id, error: insErr }); continue; }
    }
    results.push({ user: prof.user_id, week: week.id, createdTasks: toInsert.length });
  }

  return new Response(JSON.stringify({ ok: true, processed: results.length, results }), {
    headers: { "content-type": "application/json" },
  });
});