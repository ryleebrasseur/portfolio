import { SiteConfig } from '@ryleebrasseur/shared-types'

const siteConfig = {
  metadata: {
    title: 'Research Portfolio | Finance Research | Rylee Brasseur',
    description:
      "Explore Rylee Brasseur's finance-rooted research portfolio. Michigan State University student showcasing developing research skills.",
    canonicalUrl: 'https://rysdesigns.com/',
    ogImage: 'https://rysdesigns.com/og-image.jpg',
    ogImageAlt: "Homepage screenshot of Rylee Brasseur's research portfolio",
    siteName: 'Rylee Brasseur Portfolio',
    twitterHandle: '@RyleeBrasseur',
    lastUpdated: '2025-06-23T14:00:00Z',
  },
  hero: {
    name: 'Rylee Brasseur',
    title: 'Exploring Finance & Policy',
    institution: 'Michigan State University | James Madison College',
    email: 'hello@rysdesigns.com',
    phoneNumber: '517.449.9836',
  },
  header: {
    brandName: 'rys designs ❤️',
    tagline: 'Research in Progress',
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
    knowsAbout: ['research', 'finance', 'international relations'],
  },
} as const

export default siteConfig as SiteConfig
