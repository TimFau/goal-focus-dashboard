### Improvement checklists

Actionable, bite-sized tasks to evolve clarity and ND-friendliness.

### Copy and terminology

- [ ] Rename view toggle: "Planned" → "Today"; "All Active" → "All"
- [ ] Standardize labels:
  - [ ] "Add to Today (On Deck)" → "Add to On Deck"
  - [ ] "To On Deck" → "Move to On Deck"
  - [ ] "To Carry Over" → "Move to Carry Over"
  - [ ] Avoid "Promote" in UI copy

### Top 3 clarity and feedback

- [ ] Replace Top 3 slot checkbox with a "Done" icon button
- [ ] Add a subtle progress pill near Top 3 header (e.g., 0/3 → 3/3)
- [ ] Add a small celebration when hitting 3/3 for the day
- [ ] Ensure Enter key saves free-text; add Esc to cancel edit if needed

### Task selection and triage

- [ ] Group Task Selector options by category with headers and counts
- [ ] Add a one-line explainer in selector: why these tasks are shown
- [ ] Add filters in selector: All / Planned / Carry Over
- [ ] Carry Over: show hint for Bulk Edit when expanded
- [ ] Maintain column alignment when bulk mode is toggled

### Energy mode

- [ ] Rename control label to "Energy mode"
- [ ] Add tooltip: "Low shows tasks marked low energy—great for depleted moments"
- [ ] Consider calming icon/color for Low mode

### All view

- [ ] Add quick filters: Today, This Week, No Date, Low Energy
- [ ] Group by date with sticky headers and counts

### Accessibility and keyboard

- [ ] Add `aria-label` to icon-only buttons (Pin, Snooze, Delete, Done)
- [ ] Add visible focus states for interactive controls
- [ ] Support Enter/Esc in modals; Tab order sanity-check
- [ ] Add keyboard shortcuts for Pin (P), Add to On Deck (A), Snooze (S) where safe

### Settings and reminders

- [ ] Add inline note if Save is not yet connected (disable button or show toast)
- [ ] If wiring persistence: save timezone and times to backend; confirm on save
- [ ] Clarify reminder behavior (channels, times, quiet hours)

### Semantics and backend

- [ ] Replace snooze-to-yesterday hack with explicit "move to carry-over/backlog" operation
- [ ] Decide representation for carry-over vs backlog vs planned
- [ ] Consider lightweight history of Top 3 selections for reflection

### Microcopy

- [ ] Top 3 tip: "Drag, Select from tasks, or type and press Enter"
- [ ] Carry Over subtext: "Triage to lighten the load—just a few clicks"
- [ ] Energy tooltip copy as above


