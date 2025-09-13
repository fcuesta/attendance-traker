import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Attendance Tracker',
  description: 'Track practice attendance for teams using Google Sheets',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900">
        <div className="mx-auto max-w-5xl p-4 md:p-8">{children}</div>
      </body>
    </html>
  )
}
