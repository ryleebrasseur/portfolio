#!/usr/bin/env node

/**
 * Conditional prepare script for CI and production environments
 * Handles husky setup gracefully in different environments
 */

const { execSync } = require('child_process');
const { existsSync } = require('fs');

// Detect CI environment
const isCI = !!(
  process.env.CI || // Generic CI
  process.env.GITHUB_ACTIONS || // GitHub Actions
  process.env.JENKINS_URL || // Jenkins
  process.env.BUILDKITE || // Buildkite
  process.env.CIRCLECI || // CircleCI
  process.env.TRAVIS || // Travis CI
  process.env.GITLAB_CI // GitLab CI
);

// Detect if we're in production environment
const isProduction = process.env.NODE_ENV === 'production';

// Check if husky is explicitly disabled
const huskyDisabled = process.env.HUSKY === '0' || process.env.HUSKY === 'false';

// Check if husky is available
const huskyAvailable = (() => {
  try {
    execSync('husky --version', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
})();

// Check if we're in a git repository
const isGitRepo = existsSync('.git');

console.log('🔧 Running prepare script...');
console.log(`   CI environment: ${isCI}`);
console.log(`   Production: ${isProduction}`);
console.log(`   Husky disabled: ${huskyDisabled}`);
console.log(`   Husky available: ${huskyAvailable}`);
console.log(`   Git repository: ${isGitRepo}`);

if (huskyDisabled) {
  console.log('✅ Husky is disabled via HUSKY environment variable');
  process.exit(0);
}

if (isCI) {
  console.log('✅ Skipping husky setup in CI environment');
  process.exit(0);
}

if (!isGitRepo) {
  console.log('⚠️  Not a git repository, skipping husky setup');
  process.exit(0);
}

if (!huskyAvailable) {
  console.log('⚠️  Husky not available, skipping setup');
  console.log('   This is normal in production environments where devDependencies are not installed');
  process.exit(0);
}

try {
  console.log('🐕 Setting up husky...');
  execSync('husky install', { stdio: 'inherit' });
  console.log('✅ Husky setup completed successfully');
} catch (error) {
  console.warn('⚠️  Husky setup failed, but continuing...');
  console.warn(`   Error: ${error.message}`);
  // Don't fail the build if husky setup fails
  process.exit(0);
}