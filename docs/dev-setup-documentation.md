# Development Setup Script Documentation

## Overview

The `dev_setup.sh` script provides a production-grade, cross-platform development environment setup for the portfolio monorepo. It implements best practices from Vercel/Turbo, Microsoft Rush, and Google's monorepo implementations, with a focus on zero-configuration onboarding and robust error handling.

## Key Features

### 1. **Automatic Version Management (Volta)**

- Installs and configures Volta for seamless Node.js/pnpm version switching
- Pins versions in `package.json` for team consistency
- Falls back gracefully if Volta installation fails
- Zero manual version switching required

### 2. **CI/Human Detection**

- Automatically detects CI environments (GitHub Actions, generic CI)
- Adjusts behavior appropriately:
  - No interactive prompts in CI
  - No color output in CI
  - Strict version checking in CI
  - No dev server startup in CI

### 3. **Cross-Platform Support**

- Detects OS: macOS, Linux, WSL, Windows
- Warns Windows users about WSL2 benefits
- Uses platform-appropriate commands
- Handles path separators correctly

### 4. **Robust Process Management**

- Creates PID files for dev server tracking
- Graceful shutdown with SIGTERM/SIGKILL
- Cleans up orphaned processes
- Generates stop scripts with correct PIDs
- Implements timeout-based health checks

### 5. **Comprehensive Logging**

- All operations logged to `.dev-setup.log`
- Structured log levels (ERROR, SUCCESS, WARNING, INFO, DEBUG)
- Timestamps for every log entry
- Automatic log rotation at 1MB
- Both file and console output

## Usage

### For Human Developers

```bash
# Basic usage (interactive mode)
./dev_setup.sh

# With debug output
DEBUG=true ./dev_setup.sh

# Non-interactive mode
./dev_setup.sh --non-interactive
```

### For CI Environments

```yaml
# GitHub Actions example
- name: Setup Development Environment
  run: ./dev_setup.sh
  env:
    CI: true

# Generic CI
CI=true ./dev_setup.sh
```

## Environment Variables

| Variable         | Default | Description                                 |
| ---------------- | ------- | ------------------------------------------- |
| `CI`             | `false` | Enables CI mode (no prompts, strict checks) |
| `GITHUB_ACTIONS` | `false` | GitHub Actions specific optimizations       |
| `DEBUG`          | `false` | Enables verbose debug logging               |
| `NODE_ENV`       | -       | Not set by script, respects existing value  |

## What It Does

### 1. Pre-flight Checks

- Verifies OS compatibility
- Checks for required commands (git, curl/wget)
- Warns about missing git repository
- Ensures script can proceed safely

### 2. Version Management Setup

- Attempts to install Volta (preferred for monorepos)
- Configures shell profiles (bash/zsh)
- Pins Node.js and pnpm versions in package.json
- Falls back to manual version checking if needed

### 3. Node.js Installation/Verification

- Checks current Node.js version
- Validates against version range (>=18.0.0 <21.0.0)
- Installs correct version via Volta if needed
- Exits with error if incompatible version in CI

### 4. pnpm Installation/Verification

- Checks for pnpm 8.15.0 specifically
- Installs via Volta (preferred) or npm
- Enforces exact version in CI
- Warns about version mismatch in development

### 5. Dependency Installation

- Uses `pnpm install --frozen-lockfile` in CI
- Regular `pnpm install` for development
- Captures errors and provides helpful output
- Respects pnpm workspace configuration

### 6. Environment File Setup

- Copies `.env.example` to `.env.local` (never overwrites)
- Handles app-specific env files
- Maintains developer's local configuration
- Reports what was created vs skipped

### 7. Package Building

- Attempts to build shared packages
- Handles empty package directories gracefully
- Uses Turborepo for efficient builds
- Non-fatal if packages are empty

### 8. Git Hooks

- Sets up Husky if configured
- Skipped entirely in CI
- Non-fatal if setup fails

### 9. Development Server (Interactive Only)

- Checks port availability before starting
- Creates timestamped log files
- Generates PID-based stop scripts
- Implements 30-second startup timeout
- Opens browser automatically

### 10. Final Validation

- Verifies all tools are accessible
- Checks node_modules exists
- Validates configuration files
- Provides clear success/failure status

## Error Handling

### Graceful Failures

- Missing Volta: Falls back to manual checks
- Empty packages: Continues without error
- Git hooks failure: Warns but continues
- Port in use: Provides clear instructions

### Fatal Failures

- No Node.js installed
- Wrong Node.js version in CI
- Missing required commands
- Invalid configuration files
- Dependency installation failure

## Output Examples

### Successful Run (Human)

```
🚀 Portfolio Monorepo Development Setup
========================================

ℹ️  INFO: Running pre-flight checks...
ℹ️  INFO: Detected OS: macos
✅ SUCCESS: Pre-flight checks passed
ℹ️  INFO: Setting up Volta for automatic Node.js version management...
✅ SUCCESS: Volta configured
ℹ️  INFO: Found Node.js 20.17.0
✅ SUCCESS: Node.js version is compatible
ℹ️  INFO: Found pnpm 8.15.0
✅ SUCCESS: pnpm 8.15.0 is ready
ℹ️  INFO: Installing project dependencies...
✅ SUCCESS: Dependencies installed successfully
✅ SUCCESS: Created .env.local from .env.example
ℹ️  INFO: No shared packages to build
ℹ️  INFO: Setting up git hooks...

Would you like to start the development server? (Y/n) y
ℹ️  INFO: Starting development server...
✅ SUCCESS: Development server is running!
ℹ️  INFO: Server URL: http://localhost:5173
ℹ️  INFO: Server logs: logs/dev-server-20240530_143022.log
ℹ️  INFO: Process ID: 12345

✨ Setup complete!

📚 Next steps:
  • Run 'pnpm dev' to start the development server
  • Run 'pnpm test' to run tests
  • Run 'pnpm build' to build for production

📝 Logs saved to: .dev-setup.log
```

### CI Run

```
🚀 Portfolio Monorepo Development Setup
========================================

ℹ️  INFO: Running pre-flight checks...
ℹ️  INFO: Detected OS: linux
✅ SUCCESS: Pre-flight checks passed
ℹ️  INFO: Checking Node.js installation...
ℹ️  INFO: Found Node.js 20.17.0
✅ SUCCESS: Node.js version is compatible
ℹ️  INFO: Checking pnpm installation...
ℹ️  INFO: Found pnpm 8.15.0
✅ SUCCESS: pnpm 8.15.0 is ready
ℹ️  INFO: Installing project dependencies...
ℹ️  INFO: Running clean install for CI...
✅ SUCCESS: Dependencies installed successfully
ℹ️  INFO: Setting up environment files...
ℹ️  INFO: No new environment files created
ℹ️  INFO: Building shared packages...
ℹ️  INFO: No shared packages to build
ℹ️  INFO: Skipping dev server start in CI environment
ℹ️  INFO: Validating setup...
✅ SUCCESS: Setup validation passed

✨ Setup complete!
```

## Troubleshooting

### Common Issues

#### Port Already in Use

```
❌ ERROR: Port 5173 is already in use!
ℹ️  INFO: Please stop the process using port 5173 or change the port in vite.config.ts
```

**Solution**: Run `lsof -ti:5173 | xargs kill` or use the generated `stop-dev-server.sh`

#### Wrong Node.js Version

```
⚠️  WARNING: Node.js 16.0.0 is outside the supported range: >=18.0.0 <21.0.0
```

**Solution**: The script will attempt to install the correct version via Volta

#### Permission Errors

```
❌ ERROR: Failed to install pnpm globally
```

**Solution**:

- Use Volta (automatically handles permissions)
- Or use `sudo npm install -g pnpm@8.15.0` (not recommended)

### Debug Mode

Enable detailed logging:

```bash
DEBUG=true ./dev_setup.sh
```

This will show:

- Exact commands being run
- File existence checks
- Version comparison details
- All configuration operations

## Files Created/Modified

### Always Created

- `.dev-setup.log` - Complete setup log
- `logs/` directory - For server logs
- `.dev-server.pid` - Current server process ID

### Conditionally Created

- `.env.local` - Only if doesn't exist
- `stop-dev-server.sh` - Only if server starts
- Volta configuration in package.json
- Shell profile additions (with user consent)

### Never Modified Without Consent

- Existing `.env.local` files
- Shell profiles (asks first)
- Any source code
- Git configuration

## Security Considerations

1. **No Sudo Required** - Uses Volta to avoid permission issues
2. **No Global Installs** - Except pnpm/Volta with user consent
3. **PID File Security** - Validates process before killing
4. **Environment Files** - Never exposes or overwrites secrets

## Best Practices Implemented

From **Vercel/Turborepo**:

- Minimal configuration
- Fast dependency installation
- Efficient package building

From **Microsoft Rush**:

- Strict version enforcement in CI
- Comprehensive validation
- Clear error messages

From **Google/Meta**:

- Robust process management
- Hermetic builds (via pnpm)
- Zero-configuration philosophy

## Maintenance

### Updating Versions

Edit these constants in the script:

```bash
REQUIRED_NODE_VERSION="20.17.0"
REQUIRED_PNPM_VERSION="8.15.0"
NODE_VERSION_RANGE=">=18.0.0 <21.0.0"
```

### Adding New Checks

Add functions following the pattern:

```bash
check_something() {
  log INFO "Checking something..."
  # Implementation
  log SUCCESS "Something is ready"
}
```

### Extending for New Platforms

Add cases to `detect_os()` and platform-specific logic in relevant functions.
