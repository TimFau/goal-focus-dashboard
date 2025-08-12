'use client'
import { ReactNode } from 'react'
import { DndContext, PointerSensor, useDroppable, useSensor, useSensors, closestCenter, DragEndEvent } from '@dnd-kit/core'

export function Droppable({ id, children }: { id: string; children: ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id })
  return (
    <div ref={setNodeRef} data-droppable-id={id} className={isOver ? 'ring-2 ring-white/20 rounded-xl' : ''}>
      {children}
    </div>
  )
}

export function DndProvider({ onDragEnd, children }: { onDragEnd: (e: DragEndEvent)=>void; children: ReactNode }) {
  const sensors = useSensors(useSensor(PointerSensor))
  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      {children}
    </DndContext>
  )
} 