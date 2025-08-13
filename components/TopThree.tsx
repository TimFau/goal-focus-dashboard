'use client'
import { useEffect, useMemo, useState } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { toISODate } from '@/lib/date'

type FocusItem = { title?: string; task_id?: string } | null

function Slot({ id, value, onDrop, onChange, onDone }: {
  id: string
  value: FocusItem
  onDrop: (slot: number, payload: { title: string, task_id?: string }) => void
  onChange: (slot: number, title: string) => void
  onDone: (slot: number) => void
}) {
  const slotNum = Number(id.split('-').pop())
  const { isOver, setNodeRef } = useDroppable({ id })
  return (
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
        />
      </div>
    </div>
  )
}

export default function TopThree({
  initial,
  onSet,
  onMarkTaskDone
}: {
  initial: { title: string }[]
  onSet: (items: FocusItem[]) => Promise<void>
  onMarkTaskDone: (taskId: string) => Promise<void>
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

  const dropInto = (slot: number, payload: { title: string, task_id?: string }) => {
    setItems(prev => {
      const next = [...prev]
      next[slot-1] = { title: payload.title, task_id: payload.task_id }
      return next
    })
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

  const save = async () => {
    await onSet(items)
  }

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold">Today’s Top 3</h3>
        <button className="btn" onClick={save}>Save</button>
      </div>
      <div className="grid gap-3">
        {[1,2,3].map(i => (
          <Slot
            key={i}
            id={`top3-slot-${i}`}
            value={items[i-1]}
            onDrop={dropInto}
            onChange={setTitle}
            onDone={onDone}
          />
        ))}
      </div>
      <p className="mt-2 text-xs opacity-60">Tip: drag tasks onto a slot to promote them.</p>
    </div>
  )
}
