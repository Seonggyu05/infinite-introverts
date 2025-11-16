import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Infinite Introverts',
  description: 'Ephemeral canvas for quiet conversations',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
