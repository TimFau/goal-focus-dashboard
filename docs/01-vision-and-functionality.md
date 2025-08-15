### Overview

This document captures the current product vision and implemented functionality of the Goal Focus Dashboard.

### Audience

- **Primary**: Neurodivergent users (e.g., ADHD) who can feel overwhelmed by traditional task apps.
- **Problem**: Many overdue tasks creates paralysis; too many due tasks creates avoidance. Users need gentle focus and momentum.

### Product vision

- **Reduce overwhelm** by narrowing daily focus to a small, achievable set.
- **Contain overdue stress** by isolating carry-over items for quick triage.
- **Support fluctuating energy** with a low-energy view to surface easier wins.
- **Encourage momentum** via micro-actions: Pin to Top 3, Add to Today, Snooze.

### Core concepts and behavior

- **Top 3 (daily focus)**
  - Three slots that accept either free-text or a linked task.
  - Fill by drag-and-drop, selecting from a task picker, or typing and saving.
  - Marking a linked task as done completes the underlying task; free-text clears the slot.
  - Extra actions for linked tasks: Move to On Deck (keep for the day), Move to Carry Over.
  - Morning prompt appears once per day if all three are empty.
  - Implemented in `components/TopThree.tsx` and rendered from `app/page.tsx`.

- **Top 3 — Focus-Time Done Rule**
  - **What it is**: Optionally consider a Top 3 item "done for today" once you’ve logged a focused time block on it (default **90 minutes**), inspired by Leo Babauta’s MIT approach.
  - **Why**: Reduce perfectionism paralysis and reward deep focus. Progress on the important few counts as a win even if the underlying task isn’t fully completed yet.
  - **How it behaves**
    - Each Top 3 slot shows a **focus timer** (start/pause/stop). Users can also **manually log time** in 5–15 minute increments.
    - When logged focus time on a Top 3 item reaches the **target duration** (default 90 min), the slot gains a **“Done (Focus)” check badge**.
    - If the Top 3 item is a **linked task**:
      - Marking the slot as **Done (Focus)** does **not** complete the underlying task; it only clears/greys the Top 3 slot for today.
      - The underlying task gets a **progress note** like `+90m focus on 2025‑08‑15` and retains its normal status for future days.
      - If the user also marks the linked task complete, both **Done (Focus)** and **Task Complete** states can show (priority: Task Complete).
    - If the Top 3 item is **free‑text**: reaching the target duration sets the slot to **Done (Focus)** and clears it at midnight rollover.
    - Users can **override** a slot from Done (Focus) back to active (e.g., if they logged time to the wrong item).
    - **No double‑credit**: only **active timer time** or **explicit manual entries** count; background presence does not.
  - **Visual/UX details**
    - Slot displays a **progress ring** around the check target (0 → target minutes). Tooltip: remaining minutes.
    - When the target is reached, animate a **subtle confetti/ding** (respect global sound setting) and label changes to **Done (Focus)**.
    - Hover menu adds: **Add Focus Time**, **Edit Time Log**, **Reset Today’s Focus**.
  - **Edge cases**
    - **Partial days / date change**: Focus time is counted **per calendar day**. At midnight (user timezone), slot resets unless the item is carried over.
    - **Multiple sessions**: Sum sessions toward the daily target; last session auto‑saves on pause/blur.
    - **Carry Over**: If a linked task in Top 3 is also in Carry Over, completing **Done (Focus)** hides it from Carry Over for today (to reduce noise) but does not change its due date.
    - **Low Energy filter**: Progress ring and Done (Focus) badge remain visible regardless of filter state.
  - **Tech notes**
    - Add `focus_minutes_today` (int), `focus_target_minutes` (int, default 90) to Top 3 slot state; for linked tasks, store daily focus logs in a `task_focus_log` table keyed by `{task_id, date}` with minutes and source (`timer`|`manual`).
    - Timer is client‑driven with **visibility change** detection and **idle timeout** (e.g., stop counting after 2 minutes of inactivity without keyboard/mouse events). Persist every ~15s.
    - Implemented visuals in `components/TopThree.tsx` (progress ring, buttons) and time logging utilities in `lib/focusTime.ts`.
  - **Acceptance criteria**
    - Given Focus-Time Done Rule is enabled and I log 90 minutes on a Top 3 slot today, the slot shows **Done (Focus)** without completing the underlying task.
    - Given I manually add 45m twice, the ring reaches 100% and the slot flips to **Done (Focus)**.
    - Given a linked task is later completed, the slot shows **Task Complete** status priority.
    - Given midnight passes, the slot resets focus progress for the new day.

- **On Deck (planned for today)**
  - The remaining items for today, grouped by category (Career, LangPulse, Health, Life).
  - Collapsed by default to protect focus; includes a hint to finish Top 3 first.
  - Only shows items planned for today; can add new items per category.
  - Implemented via `components/CategoryList.tsx` usage in `app/page.tsx`.

- **Carry Over**
  - Overdue/incomplete items presented for quick triage.
  - Bulk actions: Add to Today (On Deck), Pin to Top 3, Snooze (Tomorrow, +3d, Next Mon), Complete, Delete.
  - Auto-opens once per day if there are many items; tracks the oldest item age.
  - Includes a Snoozed Items modal for items moved into the future.
  - Implemented in `components/CarryOverCard.tsx`.

- **Views**
  - "Planned" (focus mode: Top 3, Carry Over, On Deck) vs "All Active" (everything incomplete, sorted by date).
  - Implemented in `app/page.tsx` with a two-button toggle.

- **Energy filtering**
  - Toggle between All vs Low Energy to filter tasks by `low_energy` flag.
  - Affects Carry Over, On Deck, and All Active views.

- **Date navigation and labeling**
  - Date switcher control plus Top 3 header labeling: Today/Tomorrow/Yesterday or a formatted date label.
  - Implemented with helpers in `lib/date.ts` and Top 3 header logic in `components/TopThree.tsx`.

- **Settings**
  - Reminders UI (timezone and three times). Currently local-only and not yet persisted.
  - Weekly Template note referencing `supabase/schema.sql` for now.
  - Focus-Time Done Rule (Focus‑time done rule)
    - Toggle: Enable focus‑time done rule for Top 3.
    - Target duration selector: 30, 45, 60, 75, 90 (default), 105, 120, 150, 180 minutes.
    - Sounds/animations toggle for the celebration cue.
    - Auto‑hide in Carry Over toggle for items that hit Done (Focus) today.
  - Implemented in `app/settings/page.tsx`; persistence planned via Supabase in `supabase/schema.sql` (`user_settings.babauta_mode_enabled`, `user_settings.top3_focus_target_minutes`).

### Daily flow (intended)

1. Land on Today; if Top 3 is empty, a prompt appears to fill it.
2. Fill Top 3 by dragging, selecting from tasks, or typing and pressing Enter/Save.
3. (If Focus-Time Done Rule is on) Start a focus timer on one Top 3 item and work until the target duration (e.g., 90m). When reached, the slot counts as **Done (Focus)** for today.
4. Work through Top 3; peek at On Deck if and when you want more.
5. Triage Carry Over with bulk actions to lighten the load.
6. Toggle Low Energy when depleted to see easier wins.
7. Optionally switch to All Active for a full planning view.

### Information architecture

- **Main layout**: Date navigation → View and Energy controls → Top 3 → Carry Over → On Deck (collapsed by default) or All Active.
- **Secondary overlays**: Snoozed Items modal; Task Selector modal for Top 3.
- **Settings**: Reminders and weekly template note.
