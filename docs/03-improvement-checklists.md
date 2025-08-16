### Improvement checklists

Actionable, bite-sized tasks to evolve clarity and ND-friendliness.  
These checklists are intended for iterative UX, UI, and technical improvements; each item should be independently testable.

### Copy and terminology

- [x] Rename view toggle: "Planned" → "Today"; "All Active" → "All"
- [x] Standardize labels:
  - [x] "Add to Today (On Deck)" → "Add to On Deck"
  - [x] "To On Deck" → "Move to On Deck"
  - [x] "To Carry Over" → "Move to Carry Over"
  - [x] Avoid "Promote" in UI copy
- [x] Review consistency of terminology across tooltips, settings, and onboarding copy

### Top 3 clarity and feedback

- [x] Replace Top 3 slot checkbox with a clear "Done" control (icon button)
- [x] Add a subtle progress pill near Top 3 header (e.g., 0/3 → 3/3)
- [x] Add a small celebration when hitting 3/3 for the day
- [x] Ensure Enter key saves free-text; add Esc to cancel edit if needed

### Focus-Time Done Rule (Top 3)

- [x] Add progress ring and “Done (Focus)” badge to Top 3 slot when target minutes reached
- [x] Differentiate visuals for “Done (Focus)” vs “Task Complete” (e.g., ring/badge vs solid check icon)
- [x] Add focus timer controls (start/pause/stop) and manual time log option in slot hover menu
- [x] Show tooltip with remaining minutes on hover over progress ring
- [x] Trigger celebration animation/sound when focus target reached (respect settings)
- [x] Ensure progress is reset at midnight (user timezone) unless carried over
- [x] Store daily focus logs for linked tasks in `task_focus_log` with minutes and source
- [x] Add settings toggles for enabling rule, target duration, celebration cues, auto-hide in Carry Over
- [x] Surface focus progress consistently in other views (On Deck, Carry Over, All Active) without visual overload
- [x] Validate idle timeout and visibility change handling for accurate focus time logging

### Task selection and triage

- [x] Group Task Selector options by category with headers and counts
- [x] Add a one-line explainer in selector: explaining why these tasks are shown
- [x] Add filters in selector: All / Planned / Carry Over
- [x] Carry Over: show hint for Bulk Edit when expanded
- [x] Maintain column alignment when bulk mode is toggled

### Energy mode

- [x] Rename control label to "Energy mode"
- [x] Add tooltip: "Low shows tasks marked low energy—great for depleted moments"
- [x] Use a calming icon/color for Low mode for better emotional resonance

### All view

- [x] Add quick filters: Today, This Week, No Date, Low Energy
- [x] Group tasks by date with sticky headers and counts

### Accessibility and keyboard

- [x] Add `aria-label` to icon-only buttons (Pin, Snooze, Delete, Done)
- [x] Add visible focus states for interactive controls
- [x] Support Enter/Esc in modals; sanity-check and fix Tab order where needed
- [x] Add keyboard shortcuts for Pin (P), Add to On Deck (A), Snooze (S) where safe

### Settings and reminders

- [ ] Add inline note if Save is not yet connected (disable button or show toast)
- [ ] If wiring persistence: save timezone and times to backend; confirm on save
- [ ] Clarify reminder behavior (channels, times, quiet hours)
- [ ] Add user-facing explanation for reminder scheduling, including quiet hours and repeat patterns

### Semantics and backend

- [ ] Replace snooze-to-yesterday hack with explicit "move to carry-over/backlog" operation
- [ ] Decide representation for carry-over vs backlog vs planned
- [ ] Consider lightweight history of Top 3 selections for reflection
- [ ] Audit backend schema for alignment with new Focus-Time Done Rule data (focus logs, target minutes)

### Microcopy

- [x] Top 3 tip: "Drag, Select from tasks, or type and press Enter"
- [x] Carry Over subtext: "Triage to lighten the load—just a few clicks"
- [x] Energy tooltip copy as above
