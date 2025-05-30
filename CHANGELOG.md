# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [2.0.0] - 2025-05-30

### Changed
- **Complete rewrite of dev_setup.sh** focusing on what actually works
- Removed all security theater (checksums, production mode, etc.)
- Simplified to core functionality: install Volta, Node, pnpm, dependencies
- Fixed critical Volta environment initialization issues
- Uses official pnpm installer instead of unreliable Volta integration

### Removed
- Checksum verification (no official checksums available)
- Log redaction (over-engineered, marked for future consideration)
- Production mode checks
- Complex CI status check (reverted to simple, working version)
- Over 1500 lines of unnecessary complexity

### Fixed
- Volta "Node is not available" errors by properly setting environment
- pnpm installation reliability by using official installer
- Script actually works now in fresh environments

## [1.2.0] - 2025-05-30

### Added
- **Checksum Verification System**: Security enhancement for downloads
  - Added `verify_checksum()` function supporting SHA256 and SHA1
  - Volta installer checksum verification (when checksum provided)
  - Displays calculated checksums when official ones unavailable
  - Support for `VOLTA_INSTALLER_CHECKSUM` environment variable
  - Added `--skip-checksums` flag for development environments
  - Added `--help` flag with usage information
  - Production mode enforcement via `PRODUCTION_MODE` environment variable
  - NOTE: Volta does not provide official checksums; users must verify manually

- **Enhanced Log Redaction**: Improved security for sensitive data
  - Added JWT token redaction with proper pattern (eyJ prefix requirement)
  - Now redacts: API keys, tokens, passwords, auth headers, SSH keys, and JWTs

### Changed
- Script version bumped to 1.2.0
- Enhanced main() function with proper argument parsing
- Improved security posture with checksum verification by default

### Fixed
- Updated README_BEFORE_UPGRADING.md to correctly reflect CI/CD pipeline exists
- Removed documentation inconsistency about missing CI/CD implementation
- Improved CI status check logic in GitHub Actions workflow for more robust failure detection

### Security
- Checksum verification prevents MITM attacks on Volta installer
- JWT tokens now properly redacted from all log output

## [1.1.0] - 2025-05-30

### Added
- **Network Retry Logic**: Implemented `download_with_retry()` function with exponential backoff (2s, 4s, 8s delays)
  - Volta installer now uses retry logic for resilient downloads
  - pnpm install commands wrapped with `execute_with_retry()` for better reliability
  - Automatic fallback to offline mode for pnpm when retries fail

- **Enhanced Signal Handling**: Comprehensive signal handling for graceful shutdown
  - Added `cleanup_on_signal()` function for INT, TERM, and HUP signals
  - Child process tracking with `register_child_process()` and `kill_child_processes()`
  - Proper cleanup sequence with correct exit codes (128 + signal number)
  - Graceful termination with SIGTERM before SIGKILL

- **Resource Pre-flight Checks**: System resource validation before setup
  - Disk space check (minimum 1GB required)
  - Memory check (512MB recommended, warns if less)
  - File system permission verification
  - Symlink capability testing
  - Container-aware resource checking (cgroup limits)

- **Enhanced Lock File Management**: 
  - Automatic stale lock detection based on PID and timestamp
  - Self-healing when previous runs were interrupted
  - Better concurrent run prevention

### Changed
- **Critical pnpm Setup Improvements**:
  - Explicitly set Node.js as default before pnpm operations (fixes Volta bug)
  - Added warnings about Volta's experimental pnpm support
  - Implemented proper fallback to npm global install when Volta fails
  - Added execution verification after pnpm installation
  - Made shell profile updates truly idempotent for VOLTA_FEATURE_PNPM
- Improved error handling throughout the script
- Enhanced logging for network operations
- Better process management for background tasks

### Fixed
- **Volta + pnpm installation loop**: Script no longer gets stuck when Volta can't properly install pnpm
- **False completion signals**: Setup now verifies pnpm is actually executable, not just installed
- **Version validation false negatives**: Improved version detection for pnpm installed via npm

### Security
- All network operations now have timeout protection
- Improved cleanup on script interruption prevents orphaned processes

## [1.0.0] - 2025-05-30

### Added
- Initial release with idempotent setup script
- Cross-platform support (macOS, Linux, WSL2)
- Volta-based Node.js version management
- Automatic dependency installation
- Git hooks setup
- Development server management
- Comprehensive logging with rotation
- Lock file management to prevent concurrent runs
- Security hardening with input validation and sensitive data redaction

### Security
- Environment variable sanitization
- Path and URL validation
- Secure download verification
- No curl|bash piping for installations