import { execSync } from 'node:child_process';
import { writeFileSync, readFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

function run(cmd: string, silent = false): string {
  try {
    return execSync(cmd, { encoding: 'utf-8', stdio: silent ? 'pipe' : 'inherit' }).trim();
  } catch (error) {
    return '';
  }
}

// Get version from command line or git tag
const version = process.argv[2] || run('git describe --tags --abbrev=0', true) || 'v1.0.0';
const date = new Date().toISOString().split('T')[0];

// Load package.json
const packageJson = JSON.parse(readFileSync('package.json', 'utf-8'));
const projectName = packageJson.name || 'Project';
const description = packageJson.description || '';

// Get git info
const branch = run('git branch --show-current', true);
const lastTag = run('git describe --tags --abbrev=0 HEAD^', true) || 'initial commit';
const commitCount = run(`git rev-list ${lastTag}..HEAD --count`, true) || '0';
const commits = run(`git log --pretty=format:"- %s" ${lastTag}..HEAD`, true) || 'No new commits';

// Discover apps and packages
const apps = existsSync('apps') ? readdirSync('apps').filter(d => existsSync(join('apps', d, 'package.json'))) : [];
const packages = existsSync('packages') ? readdirSync('packages').filter(d => existsSync(join('packages', d, 'package.json'))) : [];

// Get app details
const appDetails = apps.map(app => {
  const appPkg = JSON.parse(readFileSync(join('apps', app, 'package.json'), 'utf-8'));
  return `- **${app}**: ${appPkg.description || 'No description'}`;
}).join('\n');

// Get package details
const packageDetails = packages.map(pkg => {
  const pkgJson = JSON.parse(readFileSync(join('packages', pkg, 'package.json'), 'utf-8'));
  return `- **${pkg}**: ${pkgJson.description || 'No description'}`;
}).join('\n');

// Test available scripts
const scripts = packageJson.scripts || {};
const availableChecks = [];

if (scripts.test) {
  const testResult = run('pnpm test -- --reporter=verbose', true) ? '✅' : '⚠️';
  availableChecks.push(`${testResult} Tests`);
}

if (scripts.build) {
  const buildResult = run('pnpm build', true) ? '✅' : '❌';
  availableChecks.push(`${buildResult} Build`);
}

if (scripts.lint) {
  const lintResult = run('pnpm lint', true) ? '✅' : '⚠️';
  availableChecks.push(`${lintResult} Lint`);
}

if (scripts.typecheck) {
  const typecheckResult = run('pnpm typecheck', true) ? '✅' : '⚠️';
  availableChecks.push(`${typecheckResult} Type Check`);
}

// Get key dependencies dynamically
const deps = packageJson.dependencies || {};
const devDeps = packageJson.devDependencies || {};
const keyDeps = [];

// Auto-detect framework
if (deps.react) keyDeps.push(`React ${deps.react}`);
if (deps.vue) keyDeps.push(`Vue ${deps.vue}`);
if (deps.svelte) keyDeps.push(`Svelte ${deps.svelte}`);
if (deps.angular) keyDeps.push(`Angular ${deps.angular}`);

// Auto-detect key libraries
if (deps.three) keyDeps.push(`Three.js ${deps.three}`);
if (devDeps.vite) keyDeps.push(`Vite ${devDeps.vite}`);
if (devDeps.webpack) keyDeps.push(`Webpack ${devDeps.webpack}`);
if (devDeps.typescript) keyDeps.push(`TypeScript ${devDeps.typescript}`);
if (devDeps.turbo) keyDeps.push(`Turborepo ${devDeps.turbo}`);
if (devDeps['@playwright/test']) keyDeps.push(`Playwright ${devDeps['@playwright/test']}`);

// Check for CI/CD files
const ciSystems = [];
if (existsSync('.github/workflows')) ciSystems.push('GitHub Actions');
if (existsSync('.gitlab-ci.yml')) ciSystems.push('GitLab CI');
if (existsSync('.circleci')) ciSystems.push('CircleCI');
if (existsSync('Jenkinsfile')) ciSystems.push('Jenkins');

// Generate release body
const body = `# ${projectName} Release ${version}
📅 Released on: ${date}
🌿 Branch: ${branch}
📊 ${commitCount} commits since ${lastTag}

## 🎯 Release Summary

${description}

## 📦 Stack

${keyDeps.map(dep => `- ${dep}`).join('\n')}

## 🏗️ Status

${availableChecks.join(' | ')}

${apps.length > 0 ? `## 🚀 Applications\n\n${appDetails}` : ''}

${packages.length > 0 ? `## 📦 Packages\n\n${packageDetails}` : ''}

${ciSystems.length > 0 ? `## 🔄 CI/CD\n\n${ciSystems.map(ci => `- ${ci}`).join('\n')}` : ''}

## 📝 Changes in this release

\`\`\`
${commits}
\`\`\`

## 🔧 Quick Start

\`\`\`bash
# Clone and setup
git clone <repository-url>
cd ${packageJson.name}
${existsSync('dev_setup.sh') ? './dev_setup.sh' : 'pnpm install'}

# Development
${scripts.dev ? 'pnpm dev' : '# No dev script found'}

# Build
${scripts.build ? 'pnpm build' : '# No build script found'}
\`\`\`

---

> Tagged as ${version} | [View all releases](../../releases)
`;

// Write to disk
const filename = `RELEASE-NOTES-${version}.md`;
writeFileSync(filename, body);
console.log(`✅ Release notes written to ${filename}`);