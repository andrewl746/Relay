import type { Metadata } from 'next'
import localFont from 'next/font/local'
import { SmoothScroll } from '@/components/motion/smooth-scroll'
import { config } from '@/lib/config'
import './globals.css'

/**
 * Self-hosted, not next/font/google.
 *
 * Google Fonts is fetched at build time. It timed out here once already and
 * 500'd every route in the app; more to the point, a demo that reaches
 * fonts.gstatic.com is a demo that dies on venue wifi.
 *
 * Archivo's width axis doubles as the display face — condensed and heavy reads
 * like a stencil sprayed on a box, which is the look we want. Plex Mono is the
 * shipping-label face: every number on this site is tabular.
 */
const archivo = localFont({
  src: './fonts/archivo-var.woff2',
  variable: '--font-archivo',
  weight: '100 900',
  display: 'swap',
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
  title: `${config.ui.productName} — ${config.ui.tagline}`,
  description: config.ui.tagline,
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang="en"
      className={`${archivo.variable} ${plex.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <SmoothScroll />
        {children}
      </body>
    </html>
  )
}
