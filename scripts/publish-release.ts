import {
  readFileSync,
  existsSync,
  readdirSync,
  statSync,
  createReadStream,
} from 'node:fs'
import { join, basename } from 'node:path'
import { execSync } from 'node:child_process'

// Get environment and configuration
const token = process.env.GITHUB_TOKEN
const tag = process.env.RELEASE_TAG || process.argv[2] || 'v1.0.0'
const isDryRun = process.argv.includes('--dry-run')

// Auto-detect repository info from git remote
function getRepoInfo(): { owner: string; repo: string } {
  try {
    const remoteUrl = execSync('git remote get-url origin', {
      encoding: 'utf-8',
    }).trim()
    // Handle both SSH and HTTPS formats
    const match = remoteUrl.match(/github\.com[:/]([^/]+)\/(.+?)(\.git)?$/)
    if (match) {
      return { owner: match[1], repo: match[2] }
    }
  } catch {
    console.error('Could not auto-detect repository info from git remote')
  }

  // Fallback to package.json repository field
  const packageJson = JSON.parse(readFileSync('package.json', 'utf-8'))
  if (packageJson.repository?.url) {
    const match = packageJson.repository.url.match(
      /github\.com[:/]([^/]+)\/(.+?)(\.git)?$/
    )
    if (match) {
      return { owner: match[1], repo: match[2] }
    }
  }

  throw new Error(
    'Could not determine repository owner/name. Set repository in package.json or ensure git remote is configured.'
  )
}

const { owner, repo } = getRepoInfo()
const notesPath = `RELEASE-NOTES-${tag}.md`

// Validate prerequisites
if (!token && !isDryRun) {
  console.error('❌ Missing GITHUB_TOKEN environment variable')
  console.error('Set it with: export GITHUB_TOKEN=your_token')
  console.error('Or run with --dry-run to test without publishing')
  process.exit(1)
}

if (!existsSync(notesPath)) {
  console.error(`❌ Release notes not found: ${notesPath}`)
  console.error('Run: pnpm tsx scripts/generate-release-notes.ts first')
  process.exit(1)
}

const releaseNotes = readFileSync(notesPath, 'utf8')

// Find artifacts to upload
function findArtifacts(): string[] {
  const artifacts: string[] = []

  // Check for build outputs
  const buildDirs = ['dist', 'build', 'out']
  for (const dir of buildDirs) {
    if (existsSync(dir)) {
      // Add the directory as a tar.gz if it exists
      artifacts.push(`${dir}.tar.gz`)
    }
  }

  // Check for specific app builds
  if (existsSync('apps')) {
    const apps = readdirSync('apps')
    for (const app of apps) {
      const appDist = join('apps', app, 'dist')
      if (existsSync(appDist)) {
        artifacts.push(`${app}-dist.tar.gz`)
      }
    }
  }

  // Check for test artifacts
  const testArtifacts = ['playwright-report', 'test-results', 'coverage']

  for (const artifact of testArtifacts) {
    if (existsSync(artifact)) {
      artifacts.push(`${artifact}.tar.gz`)
    }
  }

  // Check for the release notes themselves
  artifacts.push(notesPath)

  return artifacts.filter((f) => existsSync(f))
}

// Create tarballs for directories
function createArtifacts() {
  console.log('📦 Preparing artifacts...')

  // Create dist tarball if exists
  if (existsSync('dist') && !existsSync('dist.tar.gz')) {
    execSync('tar -czf dist.tar.gz dist')
    console.log('  ✓ Created dist.tar.gz')
  }

  // Create app-specific tarballs
  if (existsSync('apps')) {
    const apps = readdirSync('apps')
    for (const app of apps) {
      const appDist = join('apps', app, 'dist')
      const tarName = `${app}-dist.tar.gz`
      if (existsSync(appDist) && !existsSync(tarName)) {
        execSync(`tar -czf ${tarName} -C apps/${app} dist`)
        console.log(`  ✓ Created ${tarName}`)
      }
    }
  }

  // Create test result tarballs
  if (
    existsSync('playwright-report') &&
    !existsSync('playwright-report.tar.gz')
  ) {
    execSync('tar -czf playwright-report.tar.gz playwright-report')
    console.log('  ✓ Created playwright-report.tar.gz')
  }

  if (existsSync('coverage') && !existsSync('coverage.tar.gz')) {
    execSync('tar -czf coverage.tar.gz coverage')
    console.log('  ✓ Created coverage.tar.gz')
  }
}

// GitHub API functions
async function createRelease() {
  const url = `https://api.github.com/repos/${owner}/${repo}/releases`

  const body = {
    tag_name: tag,
    name: `${tag} - ${new Date().toLocaleDateString()}`,
    body: releaseNotes,
    draft: false,
    prerelease:
      tag.includes('-alpha') || tag.includes('-beta') || tag.includes('-rc'),
  }

  if (isDryRun) {
    console.log('🔍 Dry run - would create release:')
    console.log(JSON.stringify(body, null, 2))
    return { upload_url: 'dry-run-upload-url', html_url: 'dry-run-url' }
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const error = await res.text()
    throw new Error(`Release creation failed (${res.status}): ${error}`)
  }

  return await res.json()
}

async function uploadAsset(uploadUrl: string, filePath: string) {
  const filename = basename(filePath)
  const fileSize = statSync(filePath).size
  const uploadTo = uploadUrl.replace(/\{.*\}/, '') + `?name=${filename}`

  if (isDryRun) {
    console.log(
      `  🔍 Would upload: ${filename} (${(fileSize / 1024 / 1024).toFixed(2)} MB)`
    )
    return
  }

  const fileStream = createReadStream(filePath)

  const res = await fetch(uploadTo, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/octet-stream',
      'Content-Length': fileSize.toString(),
    },
    body: fileStream as unknown as BodyInit,
  })

  if (!res.ok) {
    const error = await res.text()
    throw new Error(`Failed to upload ${filename}: ${error}`)
  }

  console.log(
    `  ✅ Uploaded: ${filename} (${(fileSize / 1024 / 1024).toFixed(2)} MB)`
  )
}

// Main execution
async function main() {
  try {
    console.log(`🚀 Publishing release ${tag} for ${owner}/${repo}`)

    // Create artifacts
    createArtifacts()

    // Create the release
    console.log('\n📝 Creating GitHub release...')
    const release = await createRelease()
    console.log(`✅ Release created: ${release.html_url}`)

    // Find and upload artifacts
    const artifacts = findArtifacts()
    if (artifacts.length > 0) {
      console.log(`\n📤 Uploading ${artifacts.length} artifacts...`)
      for (const artifact of artifacts) {
        await uploadAsset(release.upload_url, artifact)
      }
    } else {
      console.log('\n📭 No artifacts to upload')
    }

    console.log('\n✨ Release published successfully!')
    console.log(`View at: ${release.html_url}`)
  } catch (error) {
    console.error('\n❌ Error:', error)
    process.exit(1)
  }
}

// Run
main()
