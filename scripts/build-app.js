#!/usr/bin/env node
import { execSync } from 'child_process'
import { discoverApps } from './discover-apps.js'

const app = process.argv[2]
const apps = discoverApps()

if (!app) {
  console.log('Available apps:', apps.join(', '))
  console.log('Usage: pnpm build:app <app-name>')
  process.exit(1)
}

if (!apps.includes(app)) {
  console.error(`Error: App '${app}' not found.`)
  console.log('Available apps:', apps.join(', '))
  process.exit(1)
}

console.log(`Building ${app}...`)
execSync(`turbo run build --filter=${app}`, { stdio: 'inherit' })
