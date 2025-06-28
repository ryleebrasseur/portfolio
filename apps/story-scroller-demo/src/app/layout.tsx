import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'StoryScroller Demo',
  description: 'Demo app for @ryleebrasseur/story-scroller package',
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