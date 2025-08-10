export function toISODate(d: Date = new Date()) {
  const dt = new Date(d.getTime())
  dt.setHours(0,0,0,0)
  return dt.toISOString().slice(0,10)
}
