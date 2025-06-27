#!/usr/bin/env node
import { readdirSync, statSync, existsSync } from 'fs'
import { join } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

/**
 * Discovers all apps in the apps/ directory
 * An app is considered valid if it has a package.json file
 */
export function discoverApps() {
  const appsDir = join(dirname(__dirname), 'apps')

  try {
    const entries = readdirSync(appsDir)

    return entries.filter((entry) => {
      const entryPath = join(appsDir, entry)
      const packageJsonPath = join(entryPath, 'package.json')

      return statSync(entryPath).isDirectory() && existsSync(packageJsonPath)
    })
  } catch (error) {
    console.error('Error discovering apps:', error)
    return []
  }
}

// If run directly, output JSON array
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log(JSON.stringify(discoverApps()))
}
