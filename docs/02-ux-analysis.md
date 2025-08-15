### UX analysis

This document analyzes clarity, cohesion, and ND-friendly aspects in the current implementation.

### Strengths

- **Focus-first design**: Top 3 reduces decision fatigue and guides action.
- **Gentle guardrails**: On Deck is collapsed with copy that protects focus.
- **Energy-based filtering**: Supports capacity- and mood-aligned task picking.
- **Carry Over triage**: Bulk actions make catching up fast; snooze presets lower friction.
- **Micro-automation**: Morning prompt nudges planning only when needed.

### Potential confusion or friction

- **Terminology drift**
  - Mixed user-facing language: Promote/Add to Today/To On Deck/Pin/Snooze/Carry Over.
  - Suggested direction: standardize to "Add to On Deck", "Pin to Top 3", "Move to On Deck", "Move to Carry Over"; avoid "Promote" in UI.

- **Top 3 checkbox affordance**
  - The slot checkbox is always visually unchecked; checking triggers completion/clear but never remains checked. Looks broken.
  - Replace with a clear "Done" action (icon button) and an optional progress pill (e.g., 2/3 done).

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
  - No celebratory microinteraction for finishing Top 3.
  - Add a subtle animation, confetti, or upbeat message upon 3/3 completion.

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


