#!/bin/bash
# Portfolio Development Setup Script v2.0
# Combines the robustness of v1.2 with fixes that actually work

set -euo pipefail

# Script version
SCRIPT_VERSION="2.0.0"

# ============================================================================
# Configuration
# ============================================================================

REQUIRED_NODE_VERSION="20.17.0"
REQUIRED_PNPM_VERSION="9.12.0"

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$SCRIPT_DIR"

# Lock file for preventing concurrent runs
LOCK_FILE="$PROJECT_ROOT/.setup.lock"
PID_FILE="$PROJECT_ROOT/.dev-server.pid"

# Logging
LOG_DIR="$PROJECT_ROOT/.setup-logs"
LOG_FILE="$LOG_DIR/setup-$(date +%Y%m%d_%H%M%S).log"

# ============================================================================
# Color codes
# ============================================================================

if [[ -t 1 ]]; then
  RED='\033[0;31m'
  GREEN='\033[0;32m'
  YELLOW='\033[1;33m'
  BLUE='\033[0;34m'
  BOLD='\033[1m'
  NC='\033[0m'
else
  RED=''
  GREEN=''
  YELLOW=''
  BLUE=''
  BOLD=''
  NC=''
fi

# ============================================================================
# Utility Functions
# ============================================================================

# Check if command exists
command_exists() {
  command -v "$1" >/dev/null 2>&1
}

# Get current Node version
get_node_version() {
  if command_exists node; then
    node --version | sed 's/v//'
  else
    echo "0.0.0"
  fi
}

# Get current pnpm version
get_pnpm_version() {
  if command_exists pnpm; then
    pnpm --version 2>/dev/null || echo "0.0.0"
  else
    echo "0.0.0"
  fi
}

# ============================================================================
# Logging Functions
# ============================================================================

setup_logging() {
  mkdir -p "$LOG_DIR"
  
  # Rotate logs if too many
  local log_count=$(find "$LOG_DIR" -name "setup-*.log" 2>/dev/null | wc -l)
  if [[ $log_count -gt 10 ]]; then
    find "$LOG_DIR" -name "setup-*.log" -type f -print0 | 
      xargs -0 ls -t | 
      tail -n +11 | 
      xargs rm -f
  fi
  
  # Initialize log file
  echo "===== Setup started at $(date) =====" >> "$LOG_FILE"
}

log() {
  local level=$1
  shift
  local message="$*"
  local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
  
  # Log to file
  echo "[$timestamp] [$level] $message" >> "$LOG_FILE"
  
  # Log to console with colors
  case $level in
    ERROR)
      echo -e "${RED}❌ ERROR: $message${NC}" >&2
      ;;
    SUCCESS)
      echo -e "${GREEN}✅ SUCCESS: $message${NC}"
      ;;
    WARNING)
      echo -e "${YELLOW}⚠️  WARNING: $message${NC}"
      ;;
    INFO)
      echo -e "ℹ️  INFO: $message"
      ;;
    DEBUG)
      [[ "${DEBUG:-false}" == "true" ]] && echo -e "${BLUE}🔍 DEBUG: $message${NC}"
      ;;
    *)
      echo "$message"
      ;;
  esac
}

# ============================================================================
# Lock Management
# ============================================================================

acquire_lock() {
  local timeout="${LOCK_TIMEOUT:-300}"
  local waited=0
  
  while ! mkdir "$LOCK_FILE" 2>/dev/null; do
    if [[ $waited -ge $timeout ]]; then
      log ERROR "Could not acquire lock after ${timeout}s"
      return 1
    fi
    
    if [[ $waited -eq 0 ]]; then
      log WARNING "Another instance is running. Waiting..."
    fi
    
    sleep 2
    waited=$((waited + 2))
  done
  
  # Store PID in lock
  echo $$ > "$LOCK_FILE/pid"
  echo "$(date '+%Y-%m-%d %H:%M:%S')" > "$LOCK_FILE/timestamp"
  
  # Ensure cleanup on exit
  trap 'release_lock' EXIT INT TERM HUP
  
  return 0
}

release_lock() {
  if [[ -d "$LOCK_FILE" ]] && [[ -f "$LOCK_FILE/pid" ]]; then
    local lock_pid=$(cat "$LOCK_FILE/pid" 2>/dev/null || echo "")
    if [[ "$lock_pid" == "$$" ]]; then
      rm -rf "$LOCK_FILE"
      log DEBUG "Lock released"
    fi
  fi
}

# ============================================================================
# Preflight Checks
# ============================================================================

check_os() {
  local os=""
  local arch=""
  
  if [[ "$OSTYPE" == "darwin"* ]]; then
    os="macOS"
    arch=$(uname -m)
  elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    if grep -q Microsoft /proc/version 2>/dev/null; then
      os="WSL"
    else
      os="Linux"
    fi
    arch=$(uname -m)
  else
    log ERROR "Unsupported operating system: $OSTYPE"
    return 1
  fi
  
  log INFO "Detected OS: $os ($arch)"
  return 0
}

check_conflicting_tools() {
  local has_conflicts=false
  
  if command_exists nvm; then
    log WARNING "Found nvm - this may conflict with Volta"
    has_conflicts=true
  fi
  
  if command_exists fnm; then
    log WARNING "Found fnm - this may conflict with Volta"
    has_conflicts=true
  fi
  
  if [[ "$has_conflicts" == "true" ]]; then
    log WARNING "Conflicting Node.js version managers detected"
    log WARNING "Consider uninstalling them or this setup might not work correctly"
    
    if [[ "${FORCE:-false}" != "true" ]]; then
      read -p "Continue anyway? (y/N) " -n 1 -r
      echo
      if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log ERROR "Setup cancelled by user"
        return 1
      fi
    fi
  fi
  
  return 0
}

# ============================================================================
# Installation Functions
# ============================================================================

setup_volta() {
  log INFO "Checking Volta installation..."
  
  # Install Volta if not present
  if ! command_exists volta; then
    log INFO "Installing Volta..."
    
    if ! curl -fsSL https://get.volta.sh | bash; then
      log ERROR "Failed to download and install Volta"
      return 1
    fi
    
    log SUCCESS "Volta installed"
  else
    log SUCCESS "Volta already installed ($(volta --version))"
  fi
  
  # CRITICAL: Export Volta paths for THIS session
  export VOLTA_HOME="${VOLTA_HOME:-$HOME/.volta}"
  export PATH="$VOLTA_HOME/bin:$PATH"
  
  # Ensure Volta is in shell profiles for future sessions
  local updated_profile=false
  for profile in ~/.bashrc ~/.zshrc ~/.profile; do
    if [[ -f "$profile" ]] && ! grep -q 'VOLTA_HOME' "$profile"; then
      log INFO "Adding Volta to $profile"
      {
        echo ''
        echo '# Volta - JavaScript Tool Manager'
        echo 'export VOLTA_HOME="$HOME/.volta"'
        echo 'export PATH="$VOLTA_HOME/bin:$PATH"'
      } >> "$profile"
      updated_profile=true
    fi
  done
  
  if [[ "$updated_profile" == "true" ]]; then
    log INFO "Shell profile updated - restart your shell or run: source ~/.bashrc"
  fi
  
  # Verify Volta is actually available
  if ! command_exists volta; then
    log ERROR "Volta installation failed or not in PATH"
    log ERROR "Try manually adding to PATH:"
    log ERROR "  export VOLTA_HOME=\"\$HOME/.volta\""
    log ERROR "  export PATH=\"\$VOLTA_HOME/bin:\$PATH\""
    return 1
  fi
  
  return 0
}

setup_node() {
  log INFO "Checking Node.js installation..."
  
  local current_version=$(get_node_version)
  
  if [[ "$current_version" == "$REQUIRED_NODE_VERSION" ]]; then
    log SUCCESS "Node.js $REQUIRED_NODE_VERSION is already installed"
  else
    if [[ "$current_version" == "0.0.0" ]]; then
      log INFO "Node.js is not installed"
    else
      log INFO "Found Node.js $current_version (required: $REQUIRED_NODE_VERSION)"
    fi
    
    log INFO "Installing Node.js $REQUIRED_NODE_VERSION via Volta..."
    if ! volta install node@$REQUIRED_NODE_VERSION; then
      log ERROR "Failed to install Node.js"
      return 1
    fi
    
    log SUCCESS "Node.js $REQUIRED_NODE_VERSION installed"
  fi
  
  # Verify Node is available through Volta
  if ! volta which node >/dev/null 2>&1; then
    log ERROR "Node not available through Volta"
    # Check Volta logs
    if [[ -d "$HOME/.volta/log" ]]; then
      log ERROR "Recent Volta errors:"
      tail -n 20 "$HOME/.volta/log"/*.log 2>/dev/null | while IFS= read -r line; do
        log ERROR "  $line"
      done
    fi
    return 1
  fi
  
  return 0
}

setup_pnpm() {
  log INFO "Checking pnpm installation..."
  
  # ALWAYS add pnpm paths to current session
  export PNPM_HOME="${PNPM_HOME:-$HOME/.local/share/pnpm}"
  export PATH="$PNPM_HOME:$PATH"
  
  local current_version=$(get_pnpm_version)
  
  if [[ "$current_version" == "$REQUIRED_PNPM_VERSION" ]]; then
    log SUCCESS "pnpm $REQUIRED_PNPM_VERSION is already installed"
    return 0
  fi
  
  # Skip Volta for pnpm - it's too unreliable
  log INFO "Installing pnpm $REQUIRED_PNPM_VERSION via official installer..."
  log DEBUG "Current version: $current_version"
  
  if ! curl -fsSL https://get.pnpm.io/install.sh | env PNPM_VERSION=$REQUIRED_PNPM_VERSION sh -; then
    log ERROR "Failed to install pnpm"
    return 1
  fi
  
  # Re-export paths after installation
  export PNPM_HOME="${PNPM_HOME:-$HOME/.local/share/pnpm}"
  export PATH="$PNPM_HOME:$PATH"
  
  log SUCCESS "pnpm installed"
  
  # Verify installation
  if ! command_exists pnpm; then
    log ERROR "pnpm installation failed - not in PATH"
    log DEBUG "PATH: $PATH"
    log DEBUG "PNPM_HOME: $PNPM_HOME"
    return 1
  fi
  
  local installed_version=$(get_pnpm_version)
  if [[ "$installed_version" != "$REQUIRED_PNPM_VERSION" ]]; then
    log WARNING "pnpm version mismatch (installed: $installed_version, required: $REQUIRED_PNPM_VERSION)"
    log WARNING "This is usually OK - pnpm manages versions internally"
  fi
  
  return 0
}

install_dependencies() {
  log INFO "Installing project dependencies..."
  
  if ! pnpm install; then
    log ERROR "Failed to install dependencies"
    return 1
  fi
  
  log SUCCESS "Dependencies installed"
  
  # Setup git hooks if present
  if [[ -f "package.json" ]] && grep -q '"prepare"' package.json; then
    log INFO "Setting up git hooks..."
    if pnpm prepare; then
      log SUCCESS "Git hooks configured"
    else
      log WARNING "Git hooks setup failed (non-critical)"
    fi
  fi
  
  return 0
}

# ============================================================================
# Main
# ============================================================================

main() {
  local start_time=$(date +%s)
  
  echo ""
  echo -e "${BOLD}🚀 Portfolio Development Setup v$SCRIPT_VERSION${NC}"
  echo "============================================"
  echo ""
  
  # Parse arguments
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --force)
        export FORCE=true
        shift
        ;;
      --debug)
        export DEBUG=true
        shift
        ;;
      --help|-h)
        echo "Usage: $0 [options]"
        echo ""
        echo "Options:"
        echo "  --force     Skip confirmation prompts"
        echo "  --debug     Enable debug output"
        echo "  --help      Show this help message"
        echo ""
        exit 0
        ;;
      *)
        log ERROR "Unknown option: $1"
        echo "Use --help for usage information"
        exit 1
        ;;
    esac
  done
  
  # Setup
  acquire_lock
  setup_logging
  
  log INFO "Starting setup script v$SCRIPT_VERSION"
  
  # Preflight checks
  check_os || exit 1
  check_conflicting_tools || exit 1
  
  # Main installation steps
  setup_volta || exit 1
  setup_node || exit 1
  setup_pnpm || exit 1
  install_dependencies || exit 1
  
  # Success!
  local end_time=$(date +%s)
  local duration=$((end_time - start_time))
  
  echo ""
  log SUCCESS "Setup complete! 🎉"
  echo ""
  echo "📍 Installed versions:"
  echo "  Node: $(node --version 2>/dev/null || echo 'ERROR - restart shell')"
  echo "  pnpm: $(pnpm --version 2>/dev/null || echo 'ERROR - restart shell')"
  echo "  Volta: $(volta --version 2>/dev/null || echo 'ERROR - restart shell')"
  echo ""
  echo "🎯 Next steps:"
  echo "  1. Restart your shell or run: source ~/.bashrc"
  echo "  2. Run: pnpm dev"
  echo ""
  echo "📝 Setup completed in ${duration}s"
  echo "📋 Logs: $LOG_FILE"
  echo ""
  
  return 0
}

# Run main function
main "$@"