import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Pulse — Accountability Dashboard',
  description: 'Top 3, Minimum Wins, gentle reminders.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="mx-auto max-w-3xl p-4 md:p-6">
          <header className="mb-6 flex items-center justify-between">
            <h1 className="text-xl font-semibold">Pulse</h1>
            <nav className="space-x-2">
              <a className="btn" href="/">Dashboard</a>
              <a className="btn" href="/settings">Settings</a>
            </nav>
          </header>
          {children}
        </div>
      </body>
    </html>
  )
}
