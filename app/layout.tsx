import type { Metadata } from 'next'
import { config } from '@/lib/config'
import './globals.css'

export const metadata: Metadata = {
  title: `${config.ui.productName} — ${config.ui.tagline}`,
  description: config.ui.tagline,
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  )
}
