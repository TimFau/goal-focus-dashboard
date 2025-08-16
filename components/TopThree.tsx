'use client'
import { useEffect, useMemo, useState, useRef } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { toISODate, fromISODateLocal, addDays } from '@/lib/date'
import { CheckIconButton } from '@/components/IconButton'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import CelebrationIcon from '@mui/icons-material/Celebration'
import CircularProgress from '@mui/material/CircularProgress'
import CheckIcon from '@mui/icons-material/Check'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import { createSsrClient } from '@/lib/supabaseSsr'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import PauseIcon from '@mui/icons-material/Pause'

type FocusItem = { title?: string; task_id?: string; focus_minutes?: number } | null
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
  const [filter, setFilter] = useState<'all' | 'planned' | 'carryOver'>('all');
  if (!open) return null

  // Filter tasks based on selected date
  const today = toISODate()
  const filteredPlanned = plannedTasks.filter(t => t.due_date === selectedDate)
  const filteredCarryOver = selectedDate >= today 
    ? carryOverTasks.filter(t => t.due_date && t.due_date < selectedDate)
    : []

  const filteredTasks = useMemo(() => {
    if (filter === 'planned') {
      return filteredPlanned;
    }
    if (filter === 'carryOver') {
      return filteredCarryOver;
    }
    return [...filteredPlanned, ...filteredCarryOver];
  }, [filter, filteredPlanned, filteredCarryOver]);

  // Group tasks by category
  const tasksByCategory = useMemo(() => {
    const allTasks = filteredTasks;
    const grouped: Record<Task['category'], Task[]> = {
      career: [],
      langpulse: [],
      health: [],
      life: []
    }
    
    allTasks.forEach(task => {
      grouped[task.category].push(task)
    })
    
    // Sort within each category by due date
    Object.values(grouped).forEach(categoryTasks => {
      categoryTasks.sort((a, b) => (a.due_date || '').localeCompare(b.due_date || ''))
    })
    
    return grouped
  }, [filteredTasks])

  const totalTasks = Object.values(tasksByCategory).flat().length

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={onClose}>
      <div className="w-full max-w-md card p-4 max-h-96 overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">Select a Task</h3>
          <button className="btn" onClick={onClose}>Close</button>
        </div>
        <div className="flex items-center justify-between mb-3">
          <div className="inline-flex overflow-hidden rounded-md border border-white/10">
            <button className={`px-3 py-1 text-xs ${filter === 'all' ? 'bg-white/10' : ''}`} onClick={() => setFilter('all')}>All</button>
            <button className={`px-3 py-1 text-xs ${filter === 'planned' ? 'bg-white/10' : ''}`} onClick={() => setFilter('planned')}>Planned</button>
            <button className={`px-3 py-1 text-xs ${filter === 'carryOver' ? 'bg-white/10' : ''}`} onClick={() => setFilter('carryOver')}>Carry Over</button>
          </div>
        </div>
        <p className="text-xs opacity-70 mb-4">
          Showing tasks scheduled for {selectedDate >= today ? 'today' : 'this date'} and overdue items that need attention
        </p>
        <div className="space-y-3">
          {totalTasks === 0 ? (
            <p className="text-sm opacity-70 py-4 text-center">No tasks available for this date</p>
          ) : (
            Object.entries(tasksByCategory).map(([category, categoryTasks]) => {
              if (categoryTasks.length === 0) return null
              
              return (
                <div key={category}>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium opacity-80 capitalize">{category}</h4>
                    <span className="text-xs opacity-60">{categoryTasks.length}</span>
                  </div>
                  <div className="space-y-1">
                    {categoryTasks.map(task => (
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
                        </div>
                        {task.due_date && (
                          <div className="text-xs opacity-50 mt-1">{task.due_date}</div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}

interface SlotProps {
  id: string;
  value: FocusItem;
  onChange: (slot: number, title: string) => void;
  onDone: (slot: number) => void;
  carryOverTasks: Task[];
  plannedTasks: Task[];
  onSelectTask: (slot: number, task: { title: string, task_id: string }) => void;
  onSaveSlot: (slot: number) => Promise<void>;
  selectedDate: string;
  onDemoteToBacklog: (slot: number) => Promise<void>;
  onDemoteToCarry: (slot: number) => Promise<void>;
  babautaModeEnabled: boolean;
  targetFocusMinutes: number;
  onLogFocus: (slot: number, minutes: number, source?: 'timer' | 'manual') => Promise<void>;
  runningSlot: number | null;
  onSetRunningSlot: (slot: number | null) => void;
  onFocusSlot: (slot: number) => void;
}

const Slot = ({ 
  id, 
  value, 
  onChange, 
  onDone, 
  carryOverTasks, 
  plannedTasks,
  onSelectTask,
  onSaveSlot,
  selectedDate,
  onDemoteToBacklog,
  onDemoteToCarry,
  babautaModeEnabled,
  targetFocusMinutes,
  onLogFocus,
  runningSlot,
  onSetRunningSlot,
  onFocusSlot,
}: SlotProps) => {
  const slotNum = Number(id.split('-').pop())
  const { isOver, setNodeRef } = useDroppable({ id })
  const [showSelector, setShowSelector] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [timerRunning, setTimerRunning] = useState(false)
  const [manualMinutes, setManualMinutes] = useState('')
  const [showFocusCelebration, setShowFocusCelebration] = useState(false)
  const [totalElapsedSeconds, setTotalElapsedSeconds] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const accumulatedMinutesRef = useRef(0);
  const [expanded, setExpanded] = useState(false);
  const formattedRunningTime = useMemo(() => {
    const minutes = Math.floor(totalElapsedSeconds / 60);
    const seconds = totalElapsedSeconds % 60;
    return `${String(minutes).padStart(2,'0')}:${String(seconds).padStart(2,'0')}`;
  }, [totalElapsedSeconds]);
  
  // Reset timer when the task in the slot changes
  useEffect(() => {
    setTimerRunning(false);
    setTotalElapsedSeconds(0);
    accumulatedMinutesRef.current = 0;
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    startTimeRef.current = null;
  }, [value?.task_id]);

  const isFocusedDone = babautaModeEnabled && (value?.focus_minutes ?? 0) >= targetFocusMinutes;
  const isTaskDone = value?.task_id && plannedTasks.find(t => t.id === value.task_id)?.done;

  useEffect(() => {
    if (isFocusedDone && !showFocusCelebration) {
      setShowFocusCelebration(true);
      setTimeout(() => setShowFocusCelebration(false), 3000);
    }
  }, [isFocusedDone, showFocusCelebration]);

  // Timer logic
  useEffect(() => {
    // Always clear existing interval first to prevent memory leaks
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (timerRunning) {
      startTimeRef.current = Date.now();
      timerRef.current = setInterval(() => {
        if (startTimeRef.current) {
          const elapsedSeconds = Math.floor((Date.now() - startTimeRef.current) / 1000);
          setTotalElapsedSeconds(elapsedSeconds);
          
          // Log every full minute that passes as an increment
          const newMinutes = Math.floor(elapsedSeconds / 60);
          const minutesPassed = newMinutes - accumulatedMinutesRef.current;
          if (minutesPassed > 0 && value?.task_id) {
            // Add error handling for logging
            try {
              onLogFocus?.(slotNum, minutesPassed, 'timer');
              accumulatedMinutesRef.current = newMinutes;
            } catch (error) {
              console.error('Failed to log focus time:', error);
              // Continue timer but don't update accumulated minutes on failure
            }
          }
        }
      }, 1000);
    } else {
      startTimeRef.current = null;
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [timerRunning, value, slotNum, onLogFocus]);

  const handleStartFocus = () => {
    setTimerRunning(true);
    setTotalElapsedSeconds(0);
    accumulatedMinutesRef.current = 0;
  };

  const handlePauseFocus = async () => {
    setTimerRunning(false);
    // On pause, log any remaining seconds that have formed a full minute but haven't been logged yet
    const newMinutes = Math.floor(totalElapsedSeconds / 60);
    const minutesPassedSinceLastLog = newMinutes - accumulatedMinutesRef.current;
    if (value?.task_id && minutesPassedSinceLastLog > 0) {
      try {
        await onLogFocus?.(slotNum, minutesPassedSinceLastLog, 'timer');
        accumulatedMinutesRef.current = newMinutes;
      } catch (error) {
        console.error('Failed to log final focus time on pause:', error);
        // Could show user notification here
      }
    }
  };

  // Keep this slot in sync with the globally running slot so only one timer runs at a time
  useEffect(() => {
    if (!value?.task_id) return;
    if (runningSlot === slotNum) {
      if (!timerRunning) {
        setTimerRunning(true);
        setTotalElapsedSeconds(0);
        accumulatedMinutesRef.current = 0;
      }
    } else if (timerRunning) {
      (async () => {
        await handlePauseFocus();
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runningSlot]);

  const handleToggleTimer = async () => {
    if (!value?.task_id) return;
    onFocusSlot(slotNum);
    if (timerRunning) {
      await handlePauseFocus();
      onSetRunningSlot(null);
    } else {
      onSetRunningSlot(slotNum);
    }
  };

  const handleLogManualMinutes = async () => {
    const minutes = parseInt(manualMinutes)
    if (!isNaN(minutes) && minutes > 0) {
      await onLogFocus(slotNum, minutes, 'manual')
      setManualMinutes('')
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await onSaveSlot(slotNum)
    } finally {
      setIsSaving(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave()
    } else if (e.key === 'Escape') {
      // Reset to original value if there is one, or clear
      const originalValue = value?.title ?? ''
      onChange(slotNum, originalValue)
    }
  }
  
  return (
    <>
      <div
        ref={setNodeRef}
        className={`p-3 rounded-lg border ${
          timerRunning
            ? 'breathe-bg relative bg-sky-500/10 border-sky-400/30 ring-1 ring-sky-300/20'
            : 'border-white/10'
        } ${isOver ? 'bg-white/10' : timerRunning ? '' : 'bg-white/5'}`}
      >
        <div className="relative z-10">
        <div className="flex items-center gap-2">
          {isFocusedDone ? (
            <CheckCircleIcon sx={{ fontSize: 24 }} className="text-green-400" aria-label="Done (Focus)" />
          ) : (
            <CheckIconButton
              onClick={()=>onDone(slotNum)}
              label="Mark done"
              size="sm"
            />
          )}
          {babautaModeEnabled && value?.focus_minutes !== undefined && !isFocusedDone && (
            <div
              className={`relative w-6 h-6 flex items-center justify-center mr-1 ${showFocusCelebration ? 'animate-ping' : ''} ${value?.task_id ? 'cursor-pointer' : ''}`}
              title={`${timerRunning ? 'Pause timer' : 'Start timer'} · Remaining ${(targetFocusMinutes - (value?.focus_minutes ?? 0))} min`}
              role={value?.task_id ? 'button' : undefined}
              tabIndex={value?.task_id ? 0 : -1}
              onClick={handleToggleTimer}
              onKeyDown={(e)=>{ if ((e.key==='Enter'||e.key===' ') && value?.task_id) { e.preventDefault(); handleToggleTimer(); } }}
              aria-pressed={timerRunning}
            >
              {/* Secondary, lighter ring shows seconds within the current minute */
              }
              {timerRunning && (
                <CircularProgress 
                  variant="determinate" 
                  value={((totalElapsedSeconds % 60) / 60) * 100}
                  size={24} 
                  thickness={2.5}
                  className="text-white/40 absolute"
                />
              )}
              <CircularProgress 
                variant="determinate" 
                value={100} 
                size={24} 
                thickness={5}
                className={timerRunning ? 'text-sky-300' : 'text-amber-300'}
              />
              {timerRunning ? (
                <PauseIcon sx={{ fontSize: 14 }} className="absolute opacity-90" />
              ) : (
                <PlayArrowIcon sx={{ fontSize: 14 }} className="absolute opacity-90" />
              )}
              {value.focus_minutes >= targetFocusMinutes && (
                <CheckIcon sx={{ fontSize: 16 }} className="absolute text-green-400" />
              )}
              {/* Removed small pulsing dot; breathing card animation indicates running state */}
            </div>
          )}
          <div className="flex-1">
            <input
              className="bg-transparent outline-none w-full"
              placeholder={`Top ${slotNum}`}
              value={value?.title ?? ''}
              onChange={e=>onChange(slotNum, e.target.value)}
              onFocus={()=>onFocusSlot(slotNum)}
              onKeyDown={handleKeyDown}
            />
            {babautaModeEnabled && value?.focus_minutes !== undefined && (
              <div className="mt-1 flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-white/10 rounded overflow-hidden">
                  <div
                    className={`${isFocusedDone ? 'bg-green-400' : 'bg-amber-300'} h-full`}
                    style={{ width: `${Math.min(100, (value.focus_minutes / targetFocusMinutes) * 100)}%` }}
                  />
                </div>
                <span className="text-xs opacity-70 whitespace-nowrap">{value.focus_minutes ?? 0}/{targetFocusMinutes} min</span>
              </div>
            )}
          </div>
          {babautaModeEnabled && value?.task_id && timerRunning && (
            <span
              className="ml-1 sm:ml-2 px-1.5 py-0.5 text-[10px] sm:text-xs font-mono rounded bg-sky-300/10 text-sky-200 ring-1 ring-sky-300/20"
              aria-label={`Elapsed time ${formattedRunningTime}`}
            >
              {formattedRunningTime}
            </span>
          )}
          {/* Show select button for empty slots or save button for manual entries */}
          {!value?.task_id && (
            <>
              {value?.title ? (
                <button
                  className="btn btn-sm btn-top3"
                  onClick={handleSave}
                  disabled={isSaving}
                  title="Save this entry"
                >
                  {isSaving ? 'Saving...' : 'Save'}
                </button>
              ) : (
                <button
                  className="btn btn-sm btn-top3"
                  onClick={() => setShowSelector(true)}
                  title="Select from your tasks"
                >
                  Select
                </button>
              )}
            </>
          )}
          {/* Show expand arrow when there's a linked task */}
          {value?.task_id && (
            <button
              className="btn btn-sm p-1"
              onClick={() => setExpanded(!expanded)}
              title="Show more actions"
              aria-label={expanded ? "Hide more actions" : "Show more actions"}
            >
              {expanded ? (
                <ExpandLessIcon sx={{ fontSize: 16 }} />
              ) : (
                <ExpandMoreIcon sx={{ fontSize: 16 }} />
              )}
            </button>
          )}
        </div>
        
        {/* Expandable actions area - only for linked tasks */}
        {expanded && value?.task_id && (
          <div className="mt-3 flex gap-2 pt-2 border-t border-white/10">
            <button
              className="btn btn-sm btn-top3"
              onClick={() => setShowSelector(true)}
              title="Select from your tasks"
            >
              Change
            </button>
            {babautaModeEnabled && value?.task_id && (
              <>
                <div className="flex items-center gap-2">
                  <span 
                    className={`text-xl font-mono min-w-[3.5rem] ${timerRunning ? 'text-amber-300' : 'opacity-60'}`}
                    aria-label={`Timer: ${Math.floor(totalElapsedSeconds / 60)} minutes ${totalElapsedSeconds % 60} seconds`}
                  >
                    {String(Math.floor(totalElapsedSeconds / 60)).padStart(2, '0')}:{String(totalElapsedSeconds % 60).padStart(2, '0')}
                  </span>
                  <button 
                    onClick={handleToggleTimer}
                    className={`btn btn-sm w-24 ${timerRunning ? 'bg-red-100 hover:bg-red-200 text-red-700' : 'bg-green-100 hover:bg-green-200 text-green-700'}`}
                  >
                    {timerRunning ? 'Pause' : 'Start'}
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <input 
                    type="number" 
                    className="w-24 px-2 py-1 text-sm bg-white/10 rounded border border-white/10"
                    placeholder="Log min"
                    value={manualMinutes}
                    onChange={e => setManualMinutes(e.target.value)}
                  />
                  <button 
                    className="btn btn-sm" 
                    onClick={handleLogManualMinutes}
                    disabled={!manualMinutes || isNaN(parseInt(manualMinutes))}
                  >
                    Log
                  </button>
                </div>
              </>
            )}
            <button className="btn btn-sm btn-backlog" title="Remove from Top 3 and keep for today" onClick={()=>onDemoteToBacklog(slotNum)}>Move to On Deck</button>
            <button className="btn btn-sm" title="Remove from Top 3 and move out of today" onClick={()=>onDemoteToCarry(slotNum)}>Move to Carry Over</button>
          </div>
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
  selectedDate,
  onPromote,
  onSnooze,
  babautaModeEnabled,
  targetFocusMinutes,
  onLogFocus,
  celebrationCuesEnabled
}: {
  initial: FocusItem[]
  onSet: (items: FocusItem[]) => Promise<void>
  onMarkTaskDone: (taskId: string) => Promise<void>
  carryOverTasks?: Task[]
  plannedTasks?: Task[]
  selectedDate: string
  onPromote: (ids: string[], category: Task['category'], date: string) => Promise<void>
  onSnooze: (ids: string[], date: string) => Promise<void>
  babautaModeEnabled: boolean
  targetFocusMinutes: number
  onLogFocus: (slot: number, minutes: number, source?: 'timer' | 'manual') => Promise<void>
  celebrationCuesEnabled: boolean
}) {
  const [items, setItems] = useState<FocusItem[]>(() => [initial?.[0] ?? null, initial?.[1] ?? null, initial?.[2] ?? null])
  const [showCelebration, setShowCelebration] = useState(false)
  const [runningSlot, setRunningSlot] = useState<number | null>(null)
  // No need to fetch settings here, as they are passed as props
  
  useEffect(() => {
    setItems([initial?.[0] ?? null, initial?.[1] ?? null, initial?.[2] ?? null])
  }, [initial])

  // Check for celebration when items change
  useEffect(() => {
    const filledSlots = items.filter(item => item && item.title && item.title.trim() !== '').length
    const wasComplete = filledSlots === 3
    
    if (wasComplete && !showCelebration && celebrationCuesEnabled) {
      setShowCelebration(true)
      // Auto-hide celebration after 3 seconds
      setTimeout(() => setShowCelebration(false), 3000)
    }
  }, [items, showCelebration, celebrationCuesEnabled])

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

  const demoteToBacklog = async (slot: number) => {
    const item = items[slot-1]
    if (!item?.task_id) return
    // Find category from known task lists
    const all = [...plannedTasks, ...carryOverTasks]
    const found = all.find(t => t.id === item.task_id)
    const category = found?.category || 'career'
    await onPromote([item.task_id], category as any, selectedDate)
    // clear slot
    const next = items.map((it, i) => i===slot-1 ? null : it)
    await onSet(next)
  }

  const demoteToCarry = async (slot: number) => {
    const item = items[slot-1]
    if (!item?.task_id) return
    const y = toISODate(addDays(new Date(selectedDate), -1))
    await onSnooze([item.task_id], y)
    const next = items.map((it, i) => i===slot-1 ? null : it)
    await onSet(next)
  }


 
  // Calculate progress
  const filledSlots = items.filter(item => item && item.title && item.title.trim() !== '').length
  const progressText = `${filledSlots}/3`
  const isComplete = filledSlots === 3

  return (
    <div className="card card-top3 accent-top3 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-semibold text-amber-300">{getDateLabel(selectedDate)}</h3>
        <div className="flex items-center gap-2">
          {showCelebration && (
            <CelebrationIcon 
              sx={{ fontSize: 16 }} 
              className="text-amber-300 animate-bounce" 
            />
          )}
          <span 
            className={`text-xs px-2 py-1 rounded-full font-medium transition-all duration-300 ${
              isComplete 
                ? 'bg-green-300/20 text-green-300 ring-1 ring-green-300/30' 
                : 'bg-amber-300/20 text-amber-300'
            }`}
          >
            {progressText}
          </span>
        </div>
      </div>
      <div className="grid gap-3">
        {[0,1,2].map(i => (
          <Slot
            key={i}
            id={`top3-slot-${i+1}`}
            value={items[i]}
            onChange={setTitle}
            onDone={onDone}
            carryOverTasks={carryOverTasks}
            plannedTasks={plannedTasks}
            onSelectTask={selectTask}
            onSaveSlot={saveSlot}
            selectedDate={selectedDate}
            onDemoteToBacklog={demoteToBacklog}
            onDemoteToCarry={demoteToCarry}
            babautaModeEnabled={babautaModeEnabled}
            targetFocusMinutes={targetFocusMinutes}
            onLogFocus={onLogFocus}
            runningSlot={runningSlot}
            onSetRunningSlot={setRunningSlot}
            onFocusSlot={()=>{}}
          />
        ))}
      </div>
      <p className="mt-2 text-xs opacity-60">
        Drag, Select from tasks, or type and press Enter
      </p>
    </div>
  )
}
