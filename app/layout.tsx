import type { Metadata } from 'next'
import { config } from '@/lib/config'
import './globals.css'
import { Space_Grotesk, Inter, JetBrains_Mono } from 'next/font/google'

const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-display' })
const inter = Inter({ subsets: ['latin'], variable: '--font-ui' })
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-data' })

export const metadata: Metadata = {
  title: `${config.ui.productName} — ${config.ui.tagline}`,
  description: config.ui.tagline,
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  )
}
