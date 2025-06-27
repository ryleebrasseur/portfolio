#!/usr/bin/env node

import { execSync, execFileSync } from 'child_process'
import { dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = dirname(__dirname)

// Check if yamllint is installed
function isYamllintInstalled() {
  try {
    execSync('yamllint --version', { stdio: 'ignore' })
    return true
  } catch {
    return false
  }
}

// Lint YAML files
function lintYaml(files) {
  if (!isYamllintInstalled()) {
    console.error('❌ yamllint is not installed!')
    console.error('Please install it with: pip install yamllint')
    console.error('Or on macOS: brew install yamllint')
    console.error('Or on Ubuntu/Debian: sudo apt-get install yamllint')
    process.exit(1)
  }

  try {
    execFileSync('yamllint', files, { stdio: 'inherit', cwd: rootDir })
    console.log('✅ YAML files are valid')
  } catch {
    console.error('❌ YAML linting failed')
    process.exit(1)
  }
}

// Get files from command line args
const files = process.argv.slice(2)
if (files.length === 0) {
  console.log('No YAML files to lint')
  process.exit(0)
}

lintYaml(files)
