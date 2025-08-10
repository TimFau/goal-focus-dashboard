'use client'
import { useState } from 'react'

type FocusItem = { id?: string, title?: string }
type Props = {
  initial: (FocusItem | null)[]
  onSet: (items: (FocusItem | null)[]) => Promise<void>
}

export default function TopThree({ initial, onSet }: Props) {
  const [items, setItems] = useState<(FocusItem|null)[]>(initial)
  const update = (i: number, v: string) => {
    const next = items.slice()
    next[i] = { title: v }
    setItems(next)
  }
  const save = async () => { await onSet(items) }
  return (
    <div className="card p-4 mb-4">
      <div className="flex items-center justify-between mb-2">
        <h2 className="font-semibold">Today’s Top 3</h2>
        <button className="btn" onClick={save}>Save</button>
      </div>
      <div className="grid gap-2">
        { [0,1,2].map(i => (
          <input key={i} type="text" placeholder={`Top ${i+1}`} value={items[i]?.title ?? ''} onChange={e=>update(i, e.target.value)} />
        )) }
      </div>
    </div>
  )
}
