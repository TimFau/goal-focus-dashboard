### UX analysis

This document analyzes clarity, cohesion, and ND-friendly aspects in the current implementation.

### Strengths

- **Focus-first design**: Top 3 reduces decision fatigue and guides action.
- **Flexible completion criteria**: Focus-Time Done Rule rewards sustained attention (e.g., 90 minutes) on a Top 3 task, reducing perfectionism and encouraging progress recognition.
- **Gentle guardrails**: On Deck is collapsed with copy that protects focus.
- **Energy-based filtering**: Supports capacity- and mood-aligned task picking.
- **Carry Over triage**: Bulk actions make catching up fast; snooze presets lower friction.
- **Micro-automation**: Morning prompt nudges planning only when needed.

### Potential confusion or friction

- **Terminology drift**
  - Mixed user-facing language: Promote/Add to Today/To On Deck/Pin/Snooze/Carry Over.
  - Suggested direction: standardize to "Add to On Deck", "Pin to Top 3", "Move to On Deck", "Move to Carry Over"; avoid "Promote" in UI.

- **Top 3 completion affordance**
  - With Focus-Time Done Rule, a slot can be “Focus Done” or “Task Complete.” The current checkbox interaction is still unclear: it never stays checked and doesn’t visually distinguish between the two states.
  - Solution: use separate visual indicators—e.g., a progress ring/badge for Focus Done and a solid check icon for Task Complete—to avoid ambiguity.

- **Demotion semantics**
  - "To Carry Over" uses a snooze-to-yesterday heuristic to force carry-over status.
  - Either rename clearly ("Move to Carry Over") or implement a dedicated backend operation.

- **Task Selector clarity**
  - Mixed planned and carry-over tasks for the chosen date with small category labels.
  - Group by category with headers; add a tiny explainer: "Showing tasks planned for [date] and carry-overs from before."

- **Bulk actions discoverability**
  - Bulk mode is hidden until toggled; selection column appears only then.
  - Add a hint when expanded: "Need to select multiple? Turn on Bulk Edit." Maintain column alignment.

- **View naming**
  - "Planned" vs "All Active" can be ambiguous.
  - Prefer "Today" and "All"; add helper text under All: "Everything incomplete across dates."

- **Energy mode copy**
  - "All/Low" may under-communicate the intent.
  - Use "Energy mode" label and a tooltip: "Low shows tasks marked low energy—great for depleted moments."

- **Positive reinforcement**
  - Focus-Time Done Rule adds celebration cues for Focus Done, but the main Top 3 completion celebration (3/3) is still absent or separate.
  - Align microinteractions so that Focus Done celebrations feel consistent and cumulative toward the overall Top 3 completion state.

- **All Active overwhelm**
  - Dense, sorted by date only; still a lot to parse.
  - Quick filters: Today, This Week, No Date, Low Energy. Group by date with headers.

- **Accessibility and keyboard**
  - Icon buttons rely on `title`; DnD is mouse-first.
  - Add aria-labels, focus states, and keyboard shortcuts (Enter/Esc in modals; keys for Pin/Add/Snooze).

- **Settings expectations**
  - Save does not persist to backend; unclear if reminders are active.
  - Add a "Coming soon" note or wire up persistence and describe triggers.

### Open questions

- Should "Move to Carry Over" set an explicit backlog state rather than retro-dating to yesterday?
- Should Top 3 support multiple free-text items and how are they recorded historically?
- Is there a weekly planning layer envisioned (weekly Top 3 or template-driven planning)?
- What channels and schedules should reminders support (and quiet hours)?
- How should Focus-Time Done Rule progress be surfaced in other views (On Deck, Carry Over, All Active) without overwhelming the UI?
