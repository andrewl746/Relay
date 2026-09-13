import type { Metadata } from 'next'
import localFont from 'next/font/local'
import { config } from '@/lib/config'
import './globals.css'

// Self-hosted, not next/font/google. Google Fonts is fetched at build time; it
// timed out here and 500'd every route, and a demo that has to reach
// fonts.gstatic.com dies on venue wifi (HANDOFF.md §5). Latin subset, 133KB.
const archivo = localFont({
  src: './fonts/archivo-var.woff2',
  variable: '--font-archivo',
  weight: '100 900',
  display: 'swap',
  // The wdth axis is a hierarchy channel — docs/DESIGN.md §4.
  declarations: [{ prop: 'font-stretch', value: '62% 125%' }],
})

const plex = localFont({
  variable: '--font-plex',
  display: 'swap',
  src: [
    { path: './fonts/plex-mono-400.woff2', weight: '400', style: 'normal' },
    { path: './fonts/plex-mono-500.woff2', weight: '500', style: 'normal' },
    { path: './fonts/plex-mono-600.woff2', weight: '600', style: 'normal' },
  ],
})

export const metadata: Metadata = {
  title: { default: config.ui.productName, template: `%s · ${config.ui.productName}` },
  description: config.ui.tagline,
  applicationName: config.ui.productName,
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={`${archivo.variable} ${plex.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  )
}
