'use client'
import { useEffect, useMemo, useState } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { toISODate, fromISODateLocal } from '@/lib/date'

type FocusItem = { title?: string; task_id?: string } | null
type Task = { id: string; title: string; done: boolean; low_energy: boolean; category: 'career'|'langpulse'|'health'|'life'; due_date?: string }

function getDateLabel(dateStr: string): string {
  const today = toISODate()
  const tomorrow = toISODate(new Date(Date.now() + 86400000))
  const yesterday = toISODate(new Date(Date.now() - 86400000))
  
  if (dateStr === today) return "Today's Top 3"
  if (dateStr === tomorrow) return "Tomorrow's Top 3"
  if (dateStr === yesterday) return "Yesterday's Top 3"
  
  // For other dates, show a formatted date
  const date = fromISODateLocal(dateStr)
  const options: Intl.DateTimeFormatOptions = { 
    weekday: 'short', 
    month: 'short', 
    day: 'numeric' 
  }
  return `${date.toLocaleDateString('en-US', options)}'s Top 3`
}

function TaskSelector({ 
  open, 
  onClose, 
  carryOverTasks, 
  plannedTasks, 
  onSelect,
  selectedDate
}: {
  open: boolean
  onClose: () => void
  carryOverTasks: Task[]
  plannedTasks: Task[]
  onSelect: (task: { title: string, task_id: string }) => void
  selectedDate: string
}) {
  if (!open) return null

  // Filter tasks based on selected date
  const today = toISODate()
  const filteredPlanned = plannedTasks.filter(t => t.due_date === selectedDate)
  const filteredCarryOver = selectedDate >= today 
    ? carryOverTasks.filter(t => t.due_date && t.due_date < selectedDate)
    : []

  const allTasks = [...filteredPlanned, ...filteredCarryOver].sort((a,b) => {
    // Sort by category, then by due date
    if (a.category !== b.category) return a.category.localeCompare(b.category)
    return (a.due_date || '').localeCompare(b.due_date || '')
  })

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={onClose}>
      <div className="w-full max-w-md card p-4 max-h-96 overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">Select a Task</h3>
          <button className="btn" onClick={onClose}>Close</button>
        </div>
        <div className="space-y-2">
          {allTasks.length === 0 ? (
            <p className="text-sm opacity-70 py-4 text-center">No tasks available for this date</p>
          ) : (
            allTasks.map(task => (
              <button
                key={task.id}
                className="w-full text-left p-2 rounded hover:bg-white/10 border border-white/10"
                onClick={() => {
                  onSelect({ title: task.title, task_id: task.id })
                  onClose()
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="flex-1 truncate">{task.title}</span>
                  <span className="text-xs opacity-60 ml-2">{task.category}</span>
                </div>
                {task.due_date && (
                  <div className="text-xs opacity-50 mt-1">{task.due_date}</div>
                )}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

function Slot({ 
  id, 
  value, 
  onChange, 
  onDone, 
  carryOverTasks, 
  plannedTasks,
  onSelectTask,
  onSaveSlot,
  selectedDate
}: {
  id: string
  value: FocusItem
  onChange: (slot: number, title: string) => void
  onDone: (slot: number) => void
  carryOverTasks: Task[]
  plannedTasks: Task[]
  onSelectTask: (slot: number, task: { title: string, task_id: string }) => void
  onSaveSlot: (slot: number) => Promise<void>
  selectedDate: string
}) {
  const slotNum = Number(id.split('-').pop())
  const { isOver, setNodeRef } = useDroppable({ id })
  const [showSelector, setShowSelector] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  
  const handleSave = async () => {
    setIsSaving(true)
    try {
      await onSaveSlot(slotNum)
    } finally {
      setIsSaving(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave()
    }
  }
  
  return (
    <>
      <div ref={setNodeRef} className={`p-3 rounded-lg border border-white/10 ${isOver ? 'bg-white/10' : 'bg-white/5'}`}>
        <div className="flex items-center gap-2">
          <input
            className="chk"
            type="checkbox"
            onChange={()=>onDone(slotNum)}
            checked={false}
            title="Mark done"
          />
          <input
            className="flex-1 bg-transparent outline-none"
            placeholder={`Top ${slotNum}`}
            value={value?.title ?? ''}
            onChange={e=>onChange(slotNum, e.target.value)}
            onKeyPress={handleKeyPress}
          />
          <button
            className="btn text-sm py-1 px-2"
            onClick={() => setShowSelector(true)}
            title="Pick from tasks"
          >
            Select
          </button>
          {/* Show save button only for manual entries (no task_id) */}
          {value?.title && !value?.task_id && (
            <button
              className="btn text-sm py-1 px-2"
              onClick={handleSave}
              disabled={isSaving}
              title="Save this entry"
            >
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          )}
        </div>
      </div>
      
      <TaskSelector
        open={showSelector}
        onClose={() => setShowSelector(false)}
        carryOverTasks={carryOverTasks}
        plannedTasks={plannedTasks}
        onSelect={(task) => onSelectTask(slotNum, task)}
        selectedDate={selectedDate}
      />
    </>
  )
}

export default function TopThree({
  initial,
  onSet,
  onMarkTaskDone,
  carryOverTasks = [],
  plannedTasks = [],
  selectedDate
}: {
  initial: { title: string }[]
  onSet: (items: FocusItem[]) => Promise<void>
  onMarkTaskDone: (taskId: string) => Promise<void>
  carryOverTasks?: Task[]
  plannedTasks?: Task[]
  selectedDate: string
}) {
  const [items, setItems] = useState<FocusItem[]>(() => [0,1,2].map(i => ({ title: initial?.[i]?.title ?? '' })))
  useEffect(() => {
    setItems([0,1,2].map(i => ({ title: initial?.[i]?.title ?? '' })))
  }, [initial])

  const setTitle = (slot: number, title: string) => {
    setItems(prev => {
      const next = [...prev]
      next[slot-1] = title ? { title } : null
      return next
    })
  }

  const selectTask = async (slot: number, task: { title: string, task_id: string }) => {
    const newItems = [...items]
    newItems[slot-1] = { title: task.title, task_id: task.task_id }
    setItems(newItems)
    // Auto-save when selecting a task
    await onSet(newItems)
  }

  const saveSlot = async (slot: number) => {
    await onSet(items)
  }

  const onDone = async (slot: number) => {
    const item = items[slot-1]
    if (!item) return
    if (item.task_id) {
      await onMarkTaskDone(item.task_id)
      // leave title visible; refresh will pull state
    } else {
      // free-text: clear the slot
      setItems(prev => {
        const next = [...prev]
        next[slot-1] = null
        return next
      })
    }
    await onSet(items.map((it, i) => i===slot-1 ? (items[slot-1]?.task_id ? it : null) : it))
  }

  return (
    <div className="card p-4">
      <div className="mb-3">
        <h3 className="font-semibold">{getDateLabel(selectedDate)}</h3>
      </div>
      <div className="grid gap-3">
        {[1,2,3].map(i => (
          <Slot
            key={i}
            id={`top3-slot-${i}`}
            value={items[i-1]}
            onChange={setTitle}
            onDone={onDone}
            carryOverTasks={carryOverTasks}
            plannedTasks={plannedTasks}
            onSelectTask={selectTask}
            onSaveSlot={saveSlot}
            selectedDate={selectedDate}
          />
        ))}
      </div>
      <p className="mt-2 text-xs opacity-60">
        Tip: drag tasks onto a slot, click "Select" to choose from tasks, or type and press Enter/Save.
      </p>
    </div>
  )
}
