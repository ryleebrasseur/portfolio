#!/bin/bash 
# Portfolio Development Setup Script (robust v2.2.1 for Turbo/pnpm monorepos - PROJECT_ROOT bugfix)
set -euo pipefail

SCRIPT_VERSION="2.2.1"

REQUIRED_NODE_VERSION_MAJOR="20"
REQUIRED_NODE_VERSION_MINOR="17"
REQUIRED_PNPM_VERSION_MAJOR="9"
REQUIRED_PNPM_VERSION_MINOR="12"

# PROJECT_ROOT is always the directory you run this script from.
PROJECT_ROOT="$(pwd)"

LOCK_FILE="$PROJECT_ROOT/.setup.lock"
LOG_DIR="$PROJECT_ROOT/.setup-logs"
LOG_FILE="$LOG_DIR/setup-$(date +%Y%m%d_%H%M%S).log"

IS_CI="${CI:-false}"
IS_TTY="$(if [ -t 1 ]; then echo true; else echo false; fi)"

if [[ "$IS_TTY" == "true" ]]; then
  RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; BOLD='\033[1m'; NC='\033[0m'
else
  RED=''; GREEN=''; YELLOW=''; BLUE=''; BOLD=''; NC=''
fi

command_exists() { command -v "$1" >/dev/null 2>&1; }

get_node_version() {
  if command_exists node; then node --version | sed 's/v//'; else echo "0.0.0"; fi
}
get_pnpm_version() {
  if command_exists pnpm; then pnpm --version 2>/dev/null || echo "0.0.0"; else echo "0.0.0"; fi
}

setup_logging() {
  mkdir -p "$LOG_DIR" || { echo "Log dir $LOG_DIR not writeable"; exit 1; }
  local log_count=$(find "$LOG_DIR" -name "setup-*.log" 2>/dev/null | wc -l)
  if [[ $log_count -gt 10 ]]; then
    find "$LOG_DIR" -name "setup-*.log" -type f -print0 | xargs -0 ls -t | tail -n +11 | xargs rm -f
  fi
  echo "===== Setup started at $(date) =====" >> "$LOG_FILE"
}

log() {
  local level=$1; shift; local message="$*"; local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
  echo "[$timestamp] [$level] $message" >> "$LOG_FILE"
  case $level in
    ERROR)   echo -e "${RED}❌ $message${NC}" >&2 ;;
    SUCCESS) echo -e "${GREEN}✅ $message${NC}" ;;
    WARNING) echo -e "${YELLOW}⚠️  $message${NC}" ;;
    INFO)    echo -e "ℹ️ $message" ;;
    DEBUG)   [[ "${DEBUG:-false}" == "true" ]] && echo -e "${BLUE}🔍 $message${NC}" ;;
    *)       echo "$message" ;;
  esac
}

acquire_lock() {
  local timeout=300 waited=0
  while ! mkdir "$LOCK_FILE" 2>/dev/null; do
    if [[ $waited -ge $timeout ]]; then log ERROR "Could not acquire lock after ${timeout}s"; return 1; fi
    sleep 2; waited=$((waited + 2))
  done
  echo $$ > "$LOCK_FILE/pid"; trap 'release_lock' EXIT INT TERM HUP
}
release_lock() {
  [[ -d "$LOCK_FILE" && -f "$LOCK_FILE/pid" ]] && [[ "$(cat "$LOCK_FILE/pid")" == "$$" ]] && rm -rf "$LOCK_FILE"
}

check_os() {
  if [[ "$OSTYPE" == "darwin"* ]]; then os="macOS"; arch=$(uname -m)
  elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    if grep -q Microsoft /proc/version 2>/dev/null; then os="WSL"; else os="Linux"; fi; arch=$(uname -m)
  else log ERROR "Unsupported OS: $OSTYPE"; return 1; fi
  log INFO "Detected OS: $os ($arch)"
}

check_conflicting_tools() {
  local has_conflicts=false
  command_exists nvm && { log WARNING "Found nvm (can conflict with Volta)"; has_conflicts=true; }
  command_exists fnm && { log WARNING "Found fnm (can conflict with Volta)"; has_conflicts=true; }
  if [[ "$has_conflicts" == "true" && "${FORCE:-false}" != "true" && "$IS_TTY" == "true" && "$IS_CI" != "true" ]]; then
    read -p "Continue anyway? (y/N) " -n 1 -r; echo
    [[ ! $REPLY =~ ^[Yy]$ ]] && { log ERROR "Setup cancelled by user"; return 1; }
  fi
}

setup_volta() {
  log INFO "Checking Volta installation..."
  if ! command_exists volta; then
    log INFO "Installing Volta..."; curl -fsSL https://get.volta.sh | bash || { log ERROR "Volta install failed"; return 1; }
    export VOLTA_HOME="${VOLTA_HOME:-$HOME/.volta}"; export PATH="$VOLTA_HOME/bin:$PATH"
    log SUCCESS "Volta installed"
    if [[ "$IS_TTY" == "true" && "$IS_CI" != "true" ]]; then
      for profile in ~/.bashrc ~/.zshrc ~/.profile; do
        [[ -f "$profile" ]] && ! grep -q 'VOLTA_HOME' "$profile" &&
        { echo -e '\n# Volta - JavaScript Tool Manager\nexport VOLTA_HOME="$HOME/.volta"\nexport PATH="$VOLTA_HOME/bin:$PATH"' >> "$profile"; }
      done
      log INFO "Volta added to shell profile (if not present)"
    fi
  else
    log SUCCESS "Volta already installed ($(volta --version))"
  fi
  export VOLTA_HOME="${VOLTA_HOME:-$HOME/.volta}"; export PATH="$VOLTA_HOME/bin:$PATH"
  command_exists volta || { log ERROR "Volta not in PATH after install"; return 1; }
}

version_ok() {
  [[ "$1" =~ ^([0-9]+)\.([0-9]+)\.([0-9]+) ]]
  [[ "${BASH_REMATCH[1]}" == "$2" && "${BASH_REMATCH[2]}" == "$3" ]]
}

setup_node() {
  log INFO "Checking Node.js installation..."
  local current_version=$(get_node_version)
  if version_ok "$current_version" "$REQUIRED_NODE_VERSION_MAJOR" "$REQUIRED_NODE_VERSION_MINOR"; then
    log SUCCESS "Node.js $current_version (meets requirement $REQUIRED_NODE_VERSION_MAJOR.$REQUIRED_NODE_VERSION_MINOR.x)"
  else
    log INFO "Installing Node.js $REQUIRED_NODE_VERSION_MAJOR.$REQUIRED_NODE_VERSION_MINOR.x via Volta..."
    volta install "node@$REQUIRED_NODE_VERSION_MAJOR.$REQUIRED_NODE_VERSION_MINOR" || { log ERROR "Failed to install Node"; return 1; }
    log SUCCESS "Node.js installed: $(get_node_version)"
  fi
  volta which node >/dev/null 2>&1 || { log ERROR "Node not available through Volta"; return 1; }
}

setup_pnpm() {
  log INFO "Checking pnpm installation..."
  export PNPM_HOME="${PNPM_HOME:-$HOME/.local/share/pnpm}"; export PATH="$PNPM_HOME:$PATH"
  local current_version=$(get_pnpm_version)
  if version_ok "$current_version" "$REQUIRED_PNPM_VERSION_MAJOR" "$REQUIRED_PNPM_VERSION_MINOR"; then
    log SUCCESS "pnpm $current_version (meets requirement $REQUIRED_PNPM_VERSION_MAJOR.$REQUIRED_PNPM_VERSION_MINOR.x)"
    return 0
  fi
  if [[ "$IS_CI" == "true" || "$IS_TTY" != "true" ]]; then
    export SHELL=${SHELL:-/bin/bash}
  fi
  log INFO "Installing pnpm $REQUIRED_PNPM_VERSION_MAJOR.$REQUIRED_PNPM_VERSION_MINOR.x via official installer..."
  curl -fsSL https://get.pnpm.io/install.sh | env PNPM_VERSION="$REQUIRED_PNPM_VERSION_MAJOR.$REQUIRED_PNPM_VERSION_MINOR.0" SHELL="${SHELL:-/bin/bash}" sh - || { log ERROR "Failed to install pnpm"; return 1; }
  export PNPM_HOME="${PNPM_HOME:-$HOME/.local/share/pnpm}"; export PATH="$PNPM_HOME:$PATH"
  command_exists pnpm || { log ERROR "pnpm not in PATH after install"; return 1; }
  log SUCCESS "pnpm installed: $(get_pnpm_version)"
}

install_dependencies() {
  log INFO "Installing project dependencies..."

  # Harden: Validate run location
  if [[ ! -f "$PROJECT_ROOT/package.json" ]]; then
    log ERROR "No package.json found in $PROJECT_ROOT; cannot install dependencies."
    log ERROR "Current directory: $PROJECT_ROOT"
    log ERROR "Directory contents: $(ls -la "$PROJECT_ROOT")"
    return 1
  fi

  # Monorepo guard
  if [[ -f "$PROJECT_ROOT/pnpm-workspace.yaml" || -f "$PROJECT_ROOT/turbo.json" ]] && [[ ! -f "$PROJECT_ROOT/package.json" ]]; then
    log ERROR "Turbo/monorepo detected, but root package.json is missing. Add a minimal root package.json to enable workspace bootstrapping."
    log ERROR "See: https://pnpm.io/workspaces#the-monorepo-structure"
    log ERROR "Current directory: $PROJECT_ROOT"
    log ERROR "Directory contents: $(ls -la "$PROJECT_ROOT")"
    return 1
  fi

  pnpm install || { log ERROR "Failed to install dependencies"; return 1; }
  log SUCCESS "Dependencies installed"
  [[ -f "$PROJECT_ROOT/package.json" ]] && grep -q '"prepare"' "$PROJECT_ROOT/package.json" && pnpm prepare && log SUCCESS "Git hooks configured"
}

main() {
  local start_time=$(date +%s)
  echo -e "${BOLD}🚀 Portfolio Development Setup v$SCRIPT_VERSION${NC}\n============================================\n"
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --force) export FORCE=true; shift ;;
      --debug) export DEBUG=true; shift ;;
      --help|-h)
        echo "Usage: $0 [options]"
        echo "  --force     Skip prompts"
        echo "  --debug     Enable debug"
        echo "  --help      Show help"
        exit 0
        ;;
      *) log ERROR "Unknown option: $1"; exit 1 ;;
    esac
  done
  acquire_lock
  setup_logging
  log INFO "Starting setup script v$SCRIPT_VERSION"
  check_os || exit 1
  check_conflicting_tools || exit 1
  setup_volta || exit 1
  setup_node || exit 1
  setup_pnpm || exit 1
  install_dependencies || exit 1

  # >>>>>>>>>>>>>>>>>> FIXED: Playwright install is now inside main and error checked <<<<<<<<<<<<<<<<<<<
  log INFO "Installing Playwright browsers..."
  pnpm exec playwright install || { log ERROR "Failed to install Playwright browsers"; exit 1; }
  log SUCCESS "Playwright browsers installed"
  # >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

  local end_time=$(date +%s)
  echo ""; log SUCCESS "Setup complete! 🎉"; echo ""
  echo "📍 Installed versions:"
  echo "  Node: $(node --version 2>/dev/null || echo 'ERROR - restart shell')"
  echo "  pnpm: $(pnpm --version 2>/dev/null || echo 'ERROR - restart shell')"
  echo "  Volta: $(volta --version 2>/dev/null || echo 'ERROR - restart shell')"
  echo ""
  echo "🎯 Next steps:"
  [[ "$IS_CI" == "true" ]] || echo "  1. Restart your shell or run: source ~/.bashrc"
  echo "  2. Run: pnpm dev"
  echo ""
  echo "📝 Setup completed in $((end_time - start_time))s"
  echo "📋 Logs: $LOG_FILE"
  echo ""
}

main "$@"