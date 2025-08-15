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
  - Implemented in `app/settings/page.tsx`.

### Daily flow (intended)

1. Land on Today; if Top 3 is empty, a prompt appears to fill it.
2. Fill Top 3 by dragging, selecting from tasks, or typing and pressing Enter/Save.
3. Work through Top 3; peek at On Deck if and when you want more.
4. Triage Carry Over with bulk actions to lighten the load.
5. Toggle Low Energy when depleted to see easier wins.
6. Optionally switch to All Active for a full planning view.

### Information architecture

- **Main layout**: Date navigation → View and Energy controls → Top 3 → Carry Over → On Deck (collapsed by default) or All Active.
- **Secondary overlays**: Snoozed Items modal; Task Selector modal for Top 3.
- **Settings**: Reminders and weekly template note.


