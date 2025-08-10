export function getUserIdFromEnvDevOnly() {
  const id = process.env.DEV_USER_ID
  if (!id) throw new Error('DEV_USER_ID missing. Set it in .env.local.')
  return id
} 