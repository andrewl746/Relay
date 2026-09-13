import type { Metadata } from 'next'
import localFont from 'next/font/local'
import { SiteFooter } from '@/components/hub/site-footer'
import { SmoothScroll } from '@/components/motion/smooth-scroll'
import { themeScript } from '@/components/theme'
import { config } from '@/lib/config'
import './globals.css'

/**
 * Self-hosted, not next/font/google.
 *
 * Google Fonts is fetched at build time. It timed out here once already and
 * 500'd every route in the app; more to the point, a demo that reaches
 * fonts.gstatic.com is a demo that dies on venue wifi.
 *
 * Two faces for words: Archivo for everything you read and click, Merriweather
 * for headings (--font-display). Plex Mono is the shipping-label face: every
 * number on this site is tabular.
 */
const archivo = localFont({
  src: './fonts/archivo-var.woff2',
  variable: '--font-archivo',
  weight: '100 900',
  display: 'swap',
  declarations: [{ prop: 'font-stretch', value: '62% 125%' }],
})

// Latin subset, weight axis only. The opsz axis doubled the file for headings alone.
const merriweather = localFont({
  src: './fonts/merriweather-var.woff2',
  variable: '--font-merriweather',
  weight: '300 900',
  display: 'swap',
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
    // themeScript sets data-theme on <html> before hydration, so the server's
    // attributes never match. This silences that one element, not its children.
    <html
      lang="en"
      className={`${archivo.variable} ${merriweather.variable} ${plex.variable} antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="flex min-h-screen flex-col">
        <SmoothScroll />
        {/* One footer for every page, always below the fold: each page's own
            header and content fill at least a full screen before it. */}
        <div className="flex min-h-svh flex-col">{children}</div>
        <SiteFooter />
      </body>
    </html>
  )
}
