import { SiteConfig } from '@ryleebrasseur/shared-types'

const siteConfig: SiteConfig = {
  metadata: {
    title:
      'Global Strategy Portfolio | International Relations & Economics | Rylee Brasseur',
    description:
      "Discover Rylee Brasseur's interdisciplinary portfolio combining International Relations, Economic Analysis, and Strategic Communication. Michigan State University student preparing for global leadership roles.",
    canonicalUrl: 'https://rysdesigns.com/',
    ogImage: 'https://rysdesigns.com/og-image.jpg',
    ogImageAlt:
      "Homepage screenshot of Rylee Brasseur's global strategy portfolio",
    siteName: 'Rylee Brasseur Portfolio',
    twitterHandle: '@RyleeBrasseur',
    lastUpdated: '2025-06-23T14:00:00Z',
  },
  hero: {
    name: 'Rylee Brasseur',
    title: 'Building Bridges Across Borders',
    institution: 'Michigan State University | James Madison College',
    email: 'hello@rysdesigns.com',
    phoneNumber: '332.287.9533',
    phoneStages: ['332.287.9533', '332 AT-RYLEE', 'NYC @ RYLEE '],
  },
  header: {
    brandName: 'rys designs ❤️',
    tagline: 'Global Perspectives, Strategic Solutions',
    email: 'hello@rysdesigns.com',
  },
  motionSystem: {
    sections: ['hero', 'header'] as const,
    animationDuration: 1000,
    easing: 'expo.inOut',
    staggerDelay: 0.05,
  },
  structuredData: {
    personName: 'Rylee Brasseur',
    affiliation: 'Michigan State University, James Madison College',
    url: 'https://rysdesigns.com/',
    email: 'mailto:hello@rysdesigns.com',
    knowsAbout: [
      'international relations',
      'economics',
      'strategic communication',
      'french language',
      'cross-cultural analysis',
      'policy research',
    ],
  },
}

export default siteConfig
