export function toISODate(d: Date = new Date()) {
  const dt = new Date(d.getTime())
  dt.setHours(0,0,0,0)
  return dt.toISOString().slice(0,10)
}

export function addDays(d: Date, n: number) {
  const x = new Date(d); x.setDate(x.getDate()+n); return x
}

export function nextMonday(d: Date) {
  const day = d.getDay() // Sun=0..Sat=6
  const delta = (8 - day) % 7 || 7
  return addDays(d, delta)
}

export function ageInDays(from: string, today: Date = new Date()) {
  const a = new Date(from); a.setHours(0,0,0,0)
  const t = new Date(today); t.setHours(0,0,0,0)
  return Math.round((t.getTime()-a.getTime())/86400000)
}
