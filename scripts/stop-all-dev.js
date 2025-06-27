#!/usr/bin/env node
/* eslint-env node */
import { execSync } from 'child_process'
import { discoverApps } from './discover-apps.js'

console.log('Stopping all dev servers...\n')

const apps = discoverApps()
let stoppedCount = 0

apps.forEach((app) => {
  try {
    console.log(`Checking ${app}...`)
    execSync(`cd apps/${app} && pnpm dev:stop`, { stdio: 'pipe' })
    stoppedCount++
  } catch (error) {
    // Check if it's just "no server to stop" vs actual error
    const errorOutput =
      error.stderr?.toString() || error.stdout?.toString() || ''
    if (!errorOutput.includes('No server to stop')) {
      console.error(`Error stopping ${app}:`, errorOutput)
    }
  }
})

console.log(`\n✅ Stopped ${stoppedCount} dev server(s)`)
