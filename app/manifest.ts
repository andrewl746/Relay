import type { MetadataRoute } from 'next'
import { config } from '@/lib/config'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: config.ui.productName,
    short_name: config.ui.productName,
    description: config.ui.tagline,
    start_url: '/',
    display: 'standalone',
    // Paper, so the browser chrome matches the header instead of framing it in black.
    background_color: '#F2EFE6',
    theme_color: '#F2EFE6',
    icons: [
      // The "64" cut is rendered at 256px for a 64px slot. Each size uses its own cut; never scale the 512 down.
      { src: '/brand/relay-app-icon-64.png', sizes: '256x256', type: 'image/png' },
      { src: '/brand/relay-app-icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  }
}
