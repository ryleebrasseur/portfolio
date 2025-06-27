# @ryleebrasseur/shared-utils

SEO utility functions for generating meta tags and structured data.

## Installation

```bash
pnpm add @ryleebrasseur/shared-utils
```

## Usage

### generateMetadataHTML

Generates an array of HTML meta tag strings for SEO:

```typescript
import { generateMetadataHTML } from '@ryleebrasseur/shared-utils'
import type { SiteConfig } from '@ryleebrasseur/shared-types'

const metadata: SiteConfig['metadata'] = {
  title: 'John Doe - Portfolio',
  description: 'Full-stack developer specializing in React and Node.js',
  canonicalUrl: 'https://johndoe.com',
  ogImage: 'https://johndoe.com/og-image.jpg',
  ogImageAlt: 'John Doe portfolio preview',
  siteName: 'John Doe Portfolio',
  twitterHandle: '@johndoe',
  lastUpdated: '2025-01-15',
}

const metaTags = generateMetadataHTML(metadata)
// Returns array of meta tag strings ready to be inserted into HTML
```

### generateStructuredData

Generates JSON-LD structured data for better SEO:

```typescript
import { generateStructuredData } from '@ryleebrasseur/shared-utils'
import type { SiteConfig } from '@ryleebrasseur/shared-types'

const structuredData: SiteConfig['structuredData'] = {
  personName: 'John Doe',
  affiliation: 'Acme Corp',
  url: 'https://johndoe.com',
  email: 'john@example.com',
  knowsAbout: ['React', 'Node.js', 'TypeScript', 'GraphQL'],
}

const jsonLd = generateStructuredData(structuredData, metadata)
// Returns a <script> tag with JSON-LD structured data
```

### escapeHtml

Utility function to escape HTML special characters:

```typescript
import { escapeHtml } from '@ryleebrasseur/shared-utils'

const escaped = escapeHtml('Hello <world> & "friends"')
// Returns: 'Hello &lt;world&gt; &amp; &quot;friends&quot;'
```
