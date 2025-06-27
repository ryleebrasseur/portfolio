#!/usr/bin/env node
import { writeFileSync, readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { discoverApps } from './discover-apps.js'
import { discoverPackages } from './discover-packages.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const rootDir = dirname(__dirname)

const tsconfigPath = join(rootDir, 'tsconfig.json')
const tsconfig = JSON.parse(readFileSync(tsconfigPath, 'utf8'))

// Update references with discovered apps and packages
const appReferences = discoverApps().map((app) => ({ path: `./apps/${app}` }))
const packageReferences = discoverPackages().map((pkg) => ({
  path: `./packages/${pkg}`,
}))

tsconfig.references = [...appReferences, ...packageReferences]

writeFileSync(tsconfigPath, JSON.stringify(tsconfig, null, 2) + '\n')

console.log('Updated tsconfig.json with references:')
tsconfig.references.forEach((ref) => console.log(`  - ${ref.path}`))
