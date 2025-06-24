import siteConfig from './site-config.json'

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
    sections: string[]
    animationDuration: number
    easing: string
    staggerDelay: number
  }
  structuredData: {
    personName: string
    affiliation: string
    url: string
    email: string
    knowsAbout: string[]
  }
}

export const config: SiteConfig = siteConfig

// Helper function to generate metadata HTML
export const generateMetadataHTML = (config: SiteConfig['metadata']) => `
  <!-- Essential SEO -->
  <meta charset="UTF-8">
  <title>${config.title}</title>
  <meta name="description" content="${config.description}">
  <meta name="robots" content="index, follow">
  <link rel="canonical" href="${config.canonicalUrl}">

  <!-- Mobile First -->
  <meta name="viewport" content="width=device-width, initial-scale=1.0">

  <!-- Open Graph Tags -->
  <meta property="og:url" content="${config.canonicalUrl}">
  <meta property="og:type" content="website">
  <meta property="og:title" content="${config.siteName}">
  <meta property="og:description" content="${config.description}">
  <meta property="og:image" content="${config.ogImage}">
  <meta property="og:image:alt" content="${config.ogImageAlt}">
  <meta property="og:site_name" content="${config.siteName}">
  <meta property="og:locale" content="en_US">
  <meta property="og:updated_time" content="${config.lastUpdated}">

  <!-- Twitter/X Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:site" content="${config.twitterHandle}">
  <meta name="twitter:title" content="${config.siteName}">
  <meta name="twitter:description" content="${config.description}">
  <meta name="twitter:image" content="${config.ogImage}">
`

// Helper function to generate structured data JSON-LD
export const generateStructuredData = (data: SiteConfig['structuredData']) => ({
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: data.personName,
  affiliation: {
    '@type': 'CollegeOrUniversity',
    name: data.affiliation,
  },
  url: data.url,
  sameAs: [data.email],
  knowsAbout: data.knowsAbout,
})
