import type { SiteConfig } from '@ryleebrasseur/shared-types'

/**
 * Generates HTML meta tags for SEO from site metadata
 * @param metadata - The metadata object from SiteConfig
 * @returns An array of HTML meta tag strings
 */
export function generateMetadataHTML(
  metadata: SiteConfig['metadata']
): string[] {
  const metaTags: string[] = []

  // Basic meta tags
  metaTags.push(
    `<meta name="description" content="${escapeHtml(metadata.description)}" />`
  )
  metaTags.push(`<link rel="canonical" href="${metadata.canonicalUrl}" />`)

  // Open Graph tags
  metaTags.push(
    `<meta property="og:title" content="${escapeHtml(metadata.title)}" />`
  )
  metaTags.push(
    `<meta property="og:description" content="${escapeHtml(metadata.description)}" />`
  )
  metaTags.push(`<meta property="og:image" content="${metadata.ogImage}" />`)
  metaTags.push(
    `<meta property="og:image:alt" content="${escapeHtml(metadata.ogImageAlt)}" />`
  )
  metaTags.push(
    `<meta property="og:site_name" content="${escapeHtml(metadata.siteName)}" />`
  )
  metaTags.push(`<meta property="og:type" content="website" />`)
  metaTags.push(`<meta property="og:url" content="${metadata.canonicalUrl}" />`)

  // Twitter Card tags
  metaTags.push(`<meta name="twitter:card" content="summary_large_image" />`)
  metaTags.push(
    `<meta name="twitter:title" content="${escapeHtml(metadata.title)}" />`
  )
  metaTags.push(
    `<meta name="twitter:description" content="${escapeHtml(metadata.description)}" />`
  )
  metaTags.push(`<meta name="twitter:image" content="${metadata.ogImage}" />`)
  metaTags.push(
    `<meta name="twitter:image:alt" content="${escapeHtml(metadata.ogImageAlt)}" />`
  )

  if (metadata.twitterHandle) {
    metaTags.push(
      `<meta name="twitter:site" content="${metadata.twitterHandle}" />`
    )
    metaTags.push(
      `<meta name="twitter:creator" content="${metadata.twitterHandle}" />`
    )
  }

  // Additional SEO meta tags
  metaTags.push(`<meta name="robots" content="index, follow" />`)
  metaTags.push(
    `<meta name="last-modified" content="${metadata.lastUpdated}" />`
  )

  return metaTags
}

/**
 * Generates JSON-LD structured data for SEO
 * @param data - The structured data object from SiteConfig
 * @param metadata - The metadata object from SiteConfig (for additional context)
 * @returns A JSON-LD script tag string
 */
export function generateStructuredData(
  data: SiteConfig['structuredData'],
  metadata?: SiteConfig['metadata']
): string {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: data.personName,
    url: data.url,
    email: data.email,
    affiliation: {
      '@type': 'Organization',
      name: data.affiliation,
    },
    knowsAbout: data.knowsAbout,
  }

  // Add additional properties if metadata is provided
  if (metadata) {
    Object.assign(structuredData, {
      description: metadata.description,
      image: metadata.ogImage,
      sameAs: metadata.twitterHandle
        ? `https://twitter.com/${metadata.twitterHandle.replace('@', '')}`
        : undefined,
    })
  }

  // Remove undefined values
  const cleanedData = JSON.parse(JSON.stringify(structuredData))

  return `<script type="application/ld+json">${JSON.stringify(cleanedData, null, 2)}</script>`
}

/**
 * Escapes HTML special characters to prevent XSS attacks
 * @param str - The string to escape
 * @returns The escaped string
 */
function escapeHtml(str: string): string {
  const htmlEscapes: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }

  return str.replace(/[&<>"']/g, (char) => htmlEscapes[char] || char)
}

// Export utility function as well
export { escapeHtml }
