export interface SiteConfig {
  metadata: {
    title: string
    description: string
    canonicalUrl: string
    ogImage: string
    ogImageAlt: string
    siteName: string
    twitterHandle: string
    lastUpdated: string
  }
  hero: {
    name: string
    title: string
    institution: string
    email: string
    phoneNumber: string
  }
  header: {
    brandName: string
    tagline: string
    email: string
  }
  motionSystem: {
    sections: readonly ['hero', 'header']
    animationDuration: number
    easing: string
    staggerDelay: number
  }
  structuredData: {
    personName: string
    affiliation: string
    url: string
    email: string
    knowsAbout: readonly string[]
  }
}
