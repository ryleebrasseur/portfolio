#!/usr/bin/env node
import { readdirSync, statSync, existsSync } from 'fs'
import { join } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

/**
 * Discovers all packages in the packages/ directory
 * A package is considered valid if it has a package.json file
 */
export function discoverPackages() {
  const packagesDir = join(dirname(__dirname), 'packages')

  try {
    const entries = readdirSync(packagesDir)

    return entries.filter((entry) => {
      const entryPath = join(packagesDir, entry)
      const packageJsonPath = join(entryPath, 'package.json')

      return statSync(entryPath).isDirectory() && existsSync(packageJsonPath)
    })
  } catch (error) {
    console.error('Error discovering packages:', error)
    return []
  }
}

// If run directly, output JSON array
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log(JSON.stringify(discoverPackages()))
}
