import './globals.css'
import type { Metadata } from 'next'
import { createSsrClient } from '@/lib/supabaseSsr'

export const metadata: Metadata = {
  title: 'Pulse — Accountability Dashboard',
  description: 'Top 3, Minimum Wins, gentle reminders.',
}

async function Header() {
  const supabase = createSsrClient()
  const { data } = await supabase.auth.getUser()
  const user = data.user

  return (
    <header className="mb-6 flex items-center justify-between">
      <h1 className="text-xl font-semibold">Pulse</h1>
      <nav className="space-x-2 flex items-center">
        <a className="btn" href="/">Dashboard</a>
        <a className="btn" href="/settings">Settings</a>
        {!user ? (
          <>
            <a className="btn" href="/sign-in">Sign in</a>
            <a className="btn" href="/sign-up">Sign up</a>
          </>
        ) : (
          <form action="/api/signout" method="post">
            <button className="btn" formAction="/api/signout">Sign out</button>
          </form>
        )}
      </nav>
    </header>
  )
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="mx-auto max-w-3xl p-4 md:p-6">
          {await Header()}
          {children}
        </div>
      </body>
    </html>
  )
}
