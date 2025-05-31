## 1. Repository Structure and File Inventory

The `openai/codex` repository is a monorepo primarily housing two main projects: `codex-cli` (a TypeScript/React-based CLI) and `codex-rs` (a Rust-based CLI and core logic).

**Top-Level Folders and Files:**

- `.github/`

  : Contains GitHub-specific files.

  - `ISSUE_TEMPLATE/`: Templates for bug reports (`2-bug-report.yml`) and documentation issues (`3-docs-issue.yml`).
  - `workflows/`: GitHub Actions workflows for CI (`ci.yml`, `rust-ci.yml`), CLA (`cla.yml`), code spelling checks (`codespell.yml`), and Rust releases (`rust-release.yml`).
  - `dotslash-config.json`: Configuration for the Dotslash publishing tool, defining release outputs for different platforms.
  - `demo.gif`: Animated demonstration of the Codex CLI.

- `codex-cli/`

  : The primary TypeScript-based CLI application.

  - `bin/`: Executable scripts, including the main `codex.js` entry point.

  - `dist/`: Compiled JavaScript output (not directly in fetched files, but implied by `build.mjs`).

  - `examples/`: Sample projects and use cases for the Codex CLI, each with `run.sh` scripts and `task.yaml` descriptions.

  - `scripts/`: Utility scripts for building containers, initializing firewalls, installing dependencies, and staging releases.

  - ```
    src/
    ```

    : TypeScript source code for the CLI, including components, hooks, utilities, and core application logic.

    - `components/`: React components for the CLI's user interface, built with Ink. This includes chat elements, overlays for history, models, approvals, help, and diffs.

    - `hooks/`: Custom React hooks, e.g., for managing terminal size and confirmations.

    - ```
      utils/
      ```

      : Core utilities for agent logic, API interactions, configuration management, file system operations, and more.

      - `agent/`: Logic for the agent loop, command execution, sandboxing (macOS Seatbelt, Linux Landlock), and patch application.
      - `storage/`: Manages command history and rollout saving.

  - `tests/`: Vitest unit and integration tests for the CLI.

  - `build.mjs`: ESBuild script for building the CLI.

  - `HUSKY.md`: Documentation for Husky git hooks.

  - `package.json`: NPM package configuration, scripts, and dependencies.

  - `tsconfig.json`: TypeScript compiler options.

  - `vitest.config.ts`: Vitest configuration file.

- `codex-rs/`

  : The Rust-based components of the Codex CLI.

  - `ansi-escape/`: Crate for handling ANSI escape codes.
  - `apply-patch/`: Crate for applying diff patches.
  - `cli/`: Main Rust CLI application, acting as a multitool for different subcommands (exec, TUI, MCP server).
  - `common/`: Shared utilities for Rust crates.
  - `core/`: Core business logic for Codex, including interaction with models, command execution, and sandboxing.
  - `docs/`: Documentation for the Rust components, including the Model Context Protocol (MCP).
  - `exec/`: Headless CLI for non-interactive use.
  - `execpolicy/`: Crate for classifying `execv` commands as safe, match, forbidden, or unverified.
  - `linux-sandbox/`: Linux sandboxing logic using Landlock and seccomp.
  - `mcp-client/`: Client for the Model Context Protocol.
  - `mcp-server/`: Experimental MCP server implementation.
  - `mcp-types/`: Rust types for the Model Context Protocol, generated from a JSON schema.
  - `scripts/`: Shell script for creating GitHub releases for Rust components.
  - `tui/`: Fullscreen Text User Interface (TUI) for interactive chat, built with Ratatui.
  - `Cargo.toml`, `Cargo.lock`: Rust workspace and dependency management (not directly in fetched files but implied by `codex-rs/` structure and `rust-ci.yml`).
  - `README.md`: Overview of the Rust implementation.
  - `config.md`: Detailed documentation for Rust CLI configuration options.

- `docs/`

  : General project documentation.

  - `CLA.md`: Contributor License Agreement.

- **`patches/`**: Patches for dependencies, e.g., `marked-terminal@7.3.0.patch`.

- `scripts/`

  : Root-level utility scripts.

  - `asciicheck.py`: Checks for non-ASCII characters in files.
  - `readme_toc.py`: Verifies and optionally fixes the Table of Contents in Markdown files.

- **`AGENTS.md`**: Specific instructions for an LLM agent when working with the `codex-rs` part of the repository, particularly regarding network sandboxing.

- **`CHANGELOG.md`**: Log of changes for the Codex CLI releases.

- **`LICENSE`**: Apache-2.0 License file (referenced in `README.md` but not directly in fetched files).

- **`PNPM.md`**: Guide for migrating to and using pnpm.

- **`README.md`**: Main README for the project, providing an overview, quickstart, security model, installation, configuration, and contribution guidelines.

- **`package.json`**: Root-level NPM package file for the monorepo, managing workspaces and root-level scripts.

- **`pnpm-lock.yaml`**: Pnpm lock file for managing dependencies.

- **`pnpm-workspace.yaml`**: Pnpm workspace configuration file.

**File Type Distinction:**

- Code:
  - TypeScript/TSX: Files in `codex-cli/src/`, `codex-cli/tests/` (ending in `.ts`, `.tsx`).
  - Rust: Files in `codex-rs/` subdirectories (ending in `.rs`).
  - JavaScript: `codex-cli/bin/codex.js`, `codex-cli/build.mjs`, various `.js` files in `codex-cli/src/components/vendor/`.
  - Python: `scripts/asciicheck.py`, `scripts/readme_toc.py`, `codex-rs/mcp-types/generate_mcp_types.py`.
- Configuration:
  - YAML: `.github/workflows/*.yml`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`, `codex-cli/examples/**/*.yaml`, `.github/ISSUE_TEMPLATE/*.yml`.
  - JSON: `codex-cli/package.json`, `codex-cli/tsconfig.json`, `.github/dotslash-config.json`, `codex-rs/mcp-types/schema/**/*.json`, `package.json` (root).
- Documentation:
  - Markdown: `README.md`, `CHANGELOG.md`, `PNPM.md`, `AGENTS.md`, `docs/CLA.md`, files in `codex-cli/examples/`, `codex-rs/**/*.md`.
- Workflow/Script Files:
  - Shell scripts: `codex-cli/examples/**/run.sh`, `codex-cli/scripts/*.sh`, `codex-rs/scripts/*.sh`.
  - Patch files: `patches/*.patch`.

This inventory provides a foundational understanding of the repository's layout and the types of files it contains. The subsequent sections will delve deeper into the functionality and architecture.

I will now proceed to the next section. This is a large request, and I will continue to generate the documentation in parts.

## 2. Core Functionality and Architecture

The OpenAI Codex CLI is a command-line coding agent designed to bring LLM-powered reasoning and code execution directly to the developer's terminal. Its high-level goals are to understand user prompts, interact with the codebase (read, write, and execute files), and iterate on solutions under user guidance and version control. It aims for zero-setup (requiring only an API key) and supports multimodal inputs like screenshots.

**Architectural Patterns:**

- **Monorepo Layout:** The repository uses a monorepo structure, managed with pnpm workspaces, to house distinct but related projects (`codex-cli` and `codex-rs`).

- Multi-language Support:

  - The primary CLI (`codex-cli`) is built with **TypeScript** and **React** (using Ink for terminal UI).
  - Core logic, sandboxing, and an alternative native CLI are implemented in **Rust** (`codex-rs`).
  - Shell scripts and Python are used for utility and build tasks.

- CLI Entry Points:

  - The main entry point for the Node.js CLI is `codex-cli/bin/codex.js`. This script can delegate to a pre-compiled Rust binary if `CODEX_RUST=1` is set and a native binary for the platform exists.
  - The Rust CLI (`codex-rs/cli/`) acts as a multitool, providing subcommands for interactive TUI (`codex-rs/tui/`), headless execution (`codex-rs/exec/`), and an MCP server.

- Agent Interaction Policies & Approval Flows:

  The CLI offers different levels of agent autonomy via the

  ```
  --approval-mode
  ```

  flag:

  - **`suggest` (default):** The agent can read files but requires user approval for all file writes/patches and any arbitrary shell commands (beyond reading files). This is handled in `codex-cli/src/approvals.ts` and `codex-rs/core/src/safety.rs`.
  - **`auto-edit`:** The agent can read and apply patches to files automatically but still requires approval for all shell commands.
  - **`full-auto`:** The agent can read/write files and execute shell commands automatically. Commands are run network-disabled and confined to the current working directory and temporary files for security. The approval mode can also be set in the configuration file (`~/.codex/config.json` or `~/.codex/config.yaml`). The Rust implementation uses an `AskForApproval` enum with similar semantics.

- Sandboxing Models:

  The security model employs defense-in-depth, with platform-specific sandboxing:

  - **macOS (12+):** Uses Apple Seatbelt (`sandbox-exec`) to create a read-only jail with limited writable roots (`$PWD`, `$TMPDIR`, `~/.codex`). Outbound network access is blocked by default. The Seatbelt profile is defined in `codex-rs/core/src/seatbelt_base_policy.sbpl`.
  - **Linux:** Recommends Docker for sandboxing. The `codex-cli/scripts/run_in_container.sh` script launches Codex inside a minimal container image, mounting the repo read/write and using `iptables`/`ipset` to deny egress except to the OpenAI API. The Rust core also implements Linux sandboxing using Landlock and seccomp filters (`codex-rs/linux-sandbox/` and `codex-rs/core/src/exec.rs`).

- **Model Context Protocol (MCP):** The Rust implementation (`codex-rs`) supports MCP, allowing Codex CLI to function as an MCP client and experimentally as an MCP server (`codex mcp`). This involves crates like `mcp-client`, `mcp-server`, and `mcp-types`.

The agent's core loop involves receiving user input, potentially making tool calls (like shell commands or applying patches), and interacting with the configured AI model provider. The `apply_patch` tool, implemented in both TypeScript and Rust, is crucial for file modifications.

I will continue with the next section on Installation, Configuration, and Quickstart.

## 3. Installation, Configuration, and Quickstart

**Installation:**

- From npm (Recommended):

  The primary way to install the Codex CLI is via npm (or yarn, bun, pnpm).

  Shell

  ```
  npm install -g @openai/codex
  ```

  The

  ```
  PNPM.md
  ```

  file details the migration to pnpm and its usage within the repository for development.

- **Native Executable (Rust):** Users can also download platform-specific native executables from GitHub Releases. The npm package `@openai/codex@native` also provides this.

- Build from Source (TypeScript CLI):

  1. Clone the repository: `git clone https://github.com/openai/codex.git`
  2. Navigate to the CLI package: `cd codex/codex-cli`
  3. Enable corepack: `corepack enable`
  4. Install dependencies: `pnpm install`
  5. Build the CLI: `pnpm build`
  6. For Linux, download prebuilt sandboxing binaries: `./scripts/install_native_deps.sh`

- Nix Flake Development (Alternative):

  For reproducible development environments using Nix.

  - Enter dev shell: `nix develop .#codex-cli` or `nix develop .#codex-rs`.
  - Build: `nix build .#codex-cli` or `nix build .#codex-rs`.
  - Run via flake app: `nix run .#codex-cli` or `nix run .#codex-rs`.

**API Key and Environment Setup:**

- OpenAI API Key:

  Set the

  ```
  OPENAI_API_KEY
  ```

  environment variable.

  Shell

  ```
  export OPENAI_API_KEY="your-api-key-here"
  ```

  This can be set per session or added to the shell's configuration file (e.g.,

  ```
  ~/.zshrc
  ```

  ).

- **Project `.env` file:** An `OPENAI_API_KEY` can be placed in a `.env` file at the root of the project, which the CLI will automatically load.

- **User-wide `.codex.env`:** A user-level dotenv file at `~/.codex/.codex.env` can also be used. Environment variables take precedence, followed by project `.env`, then user-wide `.codex.env`.

- **Other Providers:** For providers other than OpenAI, set `<PROVIDER>_API_KEY` (e.g., `AZURE_OPENAI_API_KEY`). If the provider is not in the pre-defined list, also set `<PROVIDER>_BASE_URL`. For Azure, `AZURE_OPENAI_API_VERSION` can also be set (defaults to `2025-03-01-preview`).

- **Login Flow:** The CLI supports an OAuth-based login flow (`codex --login`) to obtain an API key if one is not set. This involves a local server for the OAuth callback and stores tokens in `~/.codex/auth.json`. Users can also try to redeem free credits using `codex --free`.

**Configuration Files:**

- Location:

  User-specific configuration is stored in

  ```
  ~/.codex/
  ```

  .

  - `config.json` or `config.yaml` (or `config.yml`): Main configuration file.
  - `instructions.md`: Global custom instructions for the agent.
  - The Rust CLI also uses `~/.codex/config.toml`.

- Main Configuration Options (TypeScript CLI - `config.json`/`config.yaml`):

  - `model`: AI model to use (default: `o4-mini`).
  - `provider`: AI provider (default: `openai`).
  - `approvalMode`: `suggest` (default), `auto-edit`, or `full-auto`.
  - `fullAutoErrorMode`: `ask-user` (default) or `ignore-and-continue`.
  - `notify`: `true` (default) or `false` for desktop notifications.
  - `providers`: Object to configure multiple AI service providers, each with `name`, `baseURL`, and `envKey`. Default providers include OpenAI, OpenRouter, Azure, Gemini, Ollama, Mistral, DeepSeek, xAI, Groq, and ArceeAI.
  - `history`: Configures conversation history settings (`maxSize`, `saveHistory`, `sensitivePatterns`).
  - `disableResponseStorage`: Boolean to disable server-side response storage (for ZDR).
  - `flexMode`: Boolean for "flex-mode" processing (only for `o3`, `o4-mini`).
  - `reasoningEffort`: `low`, `medium` (default), or `high`.
  - `fileOpener`: URI scheme for opening files (e.g., `vscode`, `cursor`).

- Rust CLI Configuration (`config.toml`):

  - Supports similar options like `model`, `model_provider`, `approval_policy`, `sandbox_permissions`, `disable_response_storage`, `notify`.
  - Also supports `profiles` for grouping configurations.
  - `mcp_servers`: Defines MCP servers Codex can connect to.
  - `shell_environment_policy`: Controls environment variables passed to subprocesses.
  - `history`: Configures history persistence (`save-all` or `none`).
  - `file_opener`: Similar to TS CLI, for hyperlinking citations.
  - `tui`: TUI-specific settings like `disable_mouse_capture`.

- CLI Overrides:

  - TypeScript CLI: `-m/--model`, `-p/--provider`, `-a/--approval-mode`, `--auto-edit`, `--full-auto`, `--no-project-doc`, `--project-doc <file>`, `--flex-mode`, `--reasoning <effort>`, `--disable-response-storage`.
  - Rust CLI: Supports generic `-c key=value` overrides for any TOML path, as well as specific flags like `--model`, `--profile`.

**Quickstart:**

1. Install: `npm install -g @openai/codex`
2. Set API key: `export OPENAI_API_KEY="your-api-key-here"` (or use `.env` file).
3. Run interactively: `codex`
4. Or run with a prompt: `codex "explain this codebase to me"`
5. For `full-auto` mode with sandboxing: `codex --approval-mode full-auto "create a todo app"` (or use the alias `codex --full-auto ...`). On Linux, the `run_in_container.sh` script is recommended for setting up the Docker-based sandbox.

**Special Environment Variables:**

- `CODEX_HOME`: Overrides the default `~/.codex` directory for storing config, logs, etc. (Rust CLI).
- `CODEX_UNSAFE_ALLOW_NO_SANDBOX`: If true, allows running without a sandbox if one isn't available for the platform (used in `codex-cli/src/utils/agent/handle-exec-command.ts`).
- `DEBUG=true`: Prints full API request and response details for the TypeScript CLI.
- `CODEX_QUIET_MODE=1`: Silences interactive UI noise for the TypeScript CLI.
- `OPENAI_TIMEOUT_MS`: Configures OpenAI API request timeout.
- `OPENAI_ORGANIZATION`, `OPENAI_PROJECT`: For specifying OpenAI organization and project IDs.
- `CODEX_SANDBOX_NETWORK_DISABLED_ENV_VAR` (`CODEX_SANDBOX_NETWORK_DISABLED`): Set to `1` by `codex-rs` if the spawned process for a shell tool call has network access disabled by the sandbox policy.

I will now proceed to the next section on Agent Policy, Memory, and Customization.

## 4. Agent Policy, Memory, and Customization

**Agent Instructions (`AGENTS.md` / `codex.md` / `~/.codex/instructions.md`):**

Codex allows users to provide custom instructions and guidance to the LLM agent through Markdown files. These instructions help tailor the agent's behavior, responses, and adherence to project-specific conventions.

- Merging Mechanism:

  Codex loads and merges instructions from multiple sources in a specific order of precedence:

  1. **`~/.codex/instructions.md` (TypeScript CLI) or `AGENTS.md` in `~/.codex/` (Rust CLI implied):** Global, user-level custom guidance. These instructions apply to all Codex sessions across all projects. They are suitable for personal defaults, shell setup preferences, general safety constraints, or preferred tools.
  2. **`AGENTS.md` (or legacy `codex.md`, `.codex.md`, `CODEX.md`) at the repository root:** Shared project-specific notes and conventions.
  3. **`AGENTS.md` (or legacy `codex.md`, etc.) in the current working directory (if different from repo root):** Sub-folder or feature-specific instructions, offering more granular control. The Rust implementation's `create_full_instructions` function in `codex-rs/core/src/project_doc.rs` handles loading from the CWD and then the Git root. User-specific instructions are combined with project-specific ones, typically separated by `\n\n--- project-doc ---\n\n`.

- Loading Project Docs:

  - The TypeScript CLI automatically discovers and loads these files unless `--no-project-doc` is specified or the `CODEX_DISABLE_PROJECT_DOC=1` environment variable is set.
  - An explicit path to a project documentation file can also be provided using the `--project-doc <file>` flag.
  - Project documentation files are limited to `PROJECT_DOC_MAX_BYTES` (32KB) and will be truncated with a warning if they exceed this limit.

- Use Cases for `AGENTS.md`:

  - Customizing agent responses (e.g., "Always respond with emojis").
  - Defining command whitelists or preferred tools (e.g., "Use `rg` instead of `grep`").
  - Specifying file structure conventions (e.g., "All React components live in `src/components/`").
  - Providing context about the project's architecture, libraries, or coding style.
  - In `codex-rs`, there's a specific `AGENTS.md` at the root of `codex-rs` instructing the agent about `CODEX_SANDBOX_NETWORK_DISABLED_ENV_VAR` and its use in sandboxed shell tool usage.

- **Editing Instructions:** The `-c` or `--config` flag in the TypeScript CLI can be used to open the global instructions file (`~/.codex/instructions.md`) in the default editor.

**Memory and Context:**

- **Conversation History:** The agent maintains a conversation history. In the TypeScript CLI, previous responses can influence subsequent interactions. The Rust core's `ConversationHistory` is used when `disableResponseStorage` is true or when using the Chat Completions API, to send the full context with each request.
- **Previous Response ID:** When server-side response storage is enabled (default), the ID of the previous response is used to maintain conversational context with the OpenAI Responses API.
- **Context Compacting:** The `/compact` slash command in the TypeScript CLI can condense the current conversation history into a summary to free up context window space.
- **Clearing Context:** The `/clear` command clears the terminal screen and resets the conversational context.
- **File Tag Expansion (`@path`):** The TypeScript CLI supports `@path` tokens in user input, which are expanded into XML-like blocks containing the file's content to provide context to the LLM.
- **Full Context Mode (`--full-context`):** An experimental mode in the TypeScript CLI that loads the entire repository into context for the model to apply a batch of edits in one go.

I will continue with the next section on CLI Reference and Usage Patterns.

## 5. CLI Reference and Usage Patterns

**Main CLI Invocation (TypeScript & Rust multi-tool):**

- Interactive REPL:
  - `codex` or `codex-rs tui`: Starts an interactive chat session.
  - `codex "<prompt>"`: Starts an interactive session with an initial prompt.
- Non-Interactive / Quiet Mode (TypeScript CLI):
  - `codex -q "<prompt>"` or `codex --quiet "<prompt>"`: Executes the prompt non-interactively and prints the assistant's final output.
  - Setting `CODEX_QUIET_MODE=1` also enables this behavior.
  - `codex -q --json "<prompt>"` (legacy, to be confirmed if still fully supported for structured output).
- Headless Execution (Rust `codex-exec`):
  - `codex exec "<prompt>"` or `codex-rs exec "<prompt>"`: Runs Codex non-interactively, suitable for automation.
  - Can take `--output-last-message <file>` to write the agent's final message to a file.

**Common Flags and Options (TypeScript CLI `codex-cli/src/cli.tsx`):**

- `--version`: Prints version and exits.
- `-h, --help`: Shows usage information.
- `-m, --model <model>`: Specifies the AI model to use (e.g., `o4-mini`, `gpt-4.1`). Defaults to `codex-mini-latest` or the one in `config.json`.
- `-p, --provider <provider>`: Specifies the AI provider (e.g., `openai`, `openrouter`). Defaults to `openai` or the one in `config.json`.
- `-i, --image <path>`: Includes one or more image files as input (multimodal). Can be specified multiple times.
- `-v, --view <rollout>`: Inspects a previously saved session rollout JSON file.
- `--history`: Opens an overlay to browse previous sessions.
- `--login`: Forces a new sign-in flow to obtain/refresh API credentials.
- `--free`: Attempts to redeem free credits associated with a ChatGPT Plus/Pro subscription.
- `-c, --config`: Opens the global instructions file (`~/.codex/instructions.md`) in the default editor.
- `-w, --writable-root <path>`: Specifies additional writable folders for the sandbox in `full-auto` mode. Can be used multiple times.
- Approval Modes:
  - `-a, --approval-mode <mode>`: Overrides the approval policy. Values: `suggest`, `auto-edit`, `full-auto`.
  - `--auto-edit`: Alias for `-a auto-edit`.
  - `--full-auto`: Alias for `-a full-auto`.
- `--no-project-doc`: Disables automatic inclusion of `AGENTS.md` from the project.
- `--project-doc <file>`: Includes an additional Markdown file as project-specific context.
- `--full-stdout`: Disables truncation of stdout/stderr from command outputs.
- `--notify`: Enables desktop notifications for responses.
- `--disable-response-storage`: Disables server-side response storage (sends full context with each request, for ZDR).
- `--flex-mode`: Uses "flex-mode" processing (only for `o3` and `o4-mini`).
- `--reasoning <effort>`: Sets reasoning effort level (`low`, `medium`, `high`). Default is `high`.
- `--dangerously-auto-approve-everything`: Skips all confirmations and executes commands without sandboxing (for trusted local testing ONLY).
- `-f, --full-context`: Experimental mode to load the entire repository into context and apply edits in a single pass.

**Common Flags and Options (Rust CLI - `codex-rs/cli` and `codex-rs/exec`):**

Many flags mirror the TypeScript CLI for consistency.

- `--image <FILE>`: Similar to TS CLI.
- `-m, --model <MODEL>`: Specifies the model.
- `-p, --profile <PROFILE>`: Selects a configuration profile from `config.toml`.
- `-a, --ask-for-approval <APPROVAL_MODE_CLI_ARG>`: Sets approval policy (e.g., `on-failure`, `unless-allow-listed`, `never`).
- `--full-auto`: Convenience alias for sandboxed automatic execution.
- `-s, --sandbox-permission <PERMISSIONS>`: Specifies sandbox permissions (e.g., `disk-full-read-access`, `disk-write-cwd=<path>`). Can be used multiple times.
- `-C, --cd <DIR>`: Sets the working directory.
- `--skip-git-repo-check`: Allows running outside a Git repository.
- `-c, --config <KEY=VALUE>`: Generic config override, similar to TS CLI but for `config.toml` paths.
- `--color <auto|always|never>`: Controls color output (Rust `exec` CLI).

**Shell Completion:**

- `codex completion <bash|zsh|fish>`: Prints the shell completion script for the specified shell (TypeScript CLI).

**Slash Commands (Interactive TypeScript CLI):**

- `/clear`: Clears conversation history and context.
- `/clearhistory`: Clears persistent command history.
- `/compact`: Condenses conversation history into a summary.
- `/history`: Opens command history overlay.
- `/sessions`: Browses previous saved sessions.
- `/help`: Shows the list of available commands.
- `/model`: Opens model selection panel.
- `/approval`: Opens approval mode selection panel.
- `/bug`: Generates a prefilled GitHub issue URL.
- `/diff`: Shows git diff of the working directory.

**Usage Examples from README and Prompting Guide:**

- `codex "Refactor the Dashboard component to React Hooks"`
- `codex "Generate SQL migrations for adding a users table"`
- `codex "Write unit tests for utils/date.ts"`
- `codex "Bulk-rename *.jpeg -> *.jpg with git mv"`
- `codex "Explain what this regex does: ^(?=.*[A-Z]).{8,}$"`
- The `codex-cli/examples/` directory contains more elaborate scenarios like `camerascii`, `build-codex-demo`, `impossible-pong`, and `prompt-analyzer`, each with a `run.sh` script to bootstrap the example and a `task.yaml` to define the initial prompt.

This covers the primary CLI commands, flags, and common usage patterns for both the TypeScript and Rust implementations. Next, I will document the security model.

## 6. Security Model and Sandbox Enforcement

Codex CLI employs a defense-in-depth approach to security, particularly when executing commands or modifying files, with user-configurable approval modes and platform-specific sandboxing.

**Approval Modes and Agent Autonomy:**

The level of agent autonomy is controlled by the `--approval-mode` flag (or aliases like `--auto-edit`, `--full-auto`) or the `approvalMode` setting in the configuration file. The modes are:

1. `suggest` (Default):
   - Agent can read any file in the repository.
   - Requires explicit user approval for **all** file writes/patches.
   - Requires explicit user approval for **any** arbitrary shell commands (except those deemed safe for reading files, like `cat` or `ls`).
   - Implemented in `codex-cli/src/approvals.ts` and `codex-rs/core/src/safety.rs`.
2. `auto-edit`:
   - Agent can read files.
   - Agent can automatically apply patches (write to files) within approved writable paths (typically the current working directory).
   - Still requires explicit user approval for **all** shell commands.
3. `full-auto`:
   - Agent can read and write files automatically.
   - Agent can execute shell commands automatically.
   - **Crucially, in this mode, all commands are intended to be run with network access disabled and file system writes confined to the current working directory and temporary files.** This is the primary sandboxing enforcement layer.
   - The Rust CLI's `AskForApproval::OnFailure` is a similar concept, where if a sandboxed command fails, it may ask the user to retry without the sandbox. `AskForApproval::Never` is used for headless execution and does not prompt.

**Sandboxing Mechanisms:**

The actual hardening and confinement depend on the operating system:

- macOS (12+):

  - Utilizes **Apple Seatbelt** (`sandbox-exec`).
  - Commands are wrapped by `sandbox-exec` using a specific profile.
  - The base Seatbelt policy (`codex-rs/core/src/seatbelt_base_policy.sbpl`) starts with `(deny default)` and explicitly allows read-only file operations, process execution/forking, and specific `sysctl-read` operations.
  - **File System Constraints:** The environment is a read-only jail except for a small set of parametrically defined writable roots (`$PWD`, `$TMPDIR`, `~/.codex`, user-specified `--writable-root` paths, and `~/.pyenv`).
  - **Network Constraints:** Outbound network access is **fully blocked** by default within the Seatbelt sandbox. This is achieved by not including `(allow network-outbound)` in the default policy unless explicitly overridden by a more permissive `SandboxPolicy` in `codex-rs`. The environment variable `CODEX_SANDBOX_NETWORK_DISABLED=1` is set when network access is disabled.
  - The `codex-cli/src/utils/agent/sandbox/macos-seatbelt.ts` file implements the seatbelt execution for the TypeScript CLI.

- Linux:

  - Docker (Recommended for TypeScript CLI):

    ```
    codex-cli/scripts/run_in_container.sh
    ```

    launches Codex inside a minimal Docker image.

    - **File System Constraints:** The project repository is mounted read/write at the same path inside the container.
    - **Network Constraints:** A custom firewall script (`codex-cli/scripts/init_firewall.sh`) uses `iptables` and `ipset` to deny all egress traffic except to explicitly allowed domains (e.g., OpenAI API, common package registries). Allowed domains can be configured via the `OPENAI_ALLOWED_DOMAINS` environment variable or fall back to `api.openai.com`.

  - Landlock and Seccomp (Rust Core `codex-rs`):

    The Rust implementation provides sandboxing using Linux Landlock for filesystem access control and seccomp for system call filtering.

    - `codex-rs/linux-sandbox/src/landlock.rs` applies rules to restrict filesystem access (e.g., read-only for most, write to cwd and temp) and a seccomp filter to block network-related syscalls (like `connect`, `bind`, `sendto`) except for `AF_UNIX` sockets.
    - The `codex-linux-sandbox` executable, built from `codex-rs/linux-sandbox/`, is used by `codex-exec` and the Rust TUI to run commands in this sandboxed environment.

- **No Sandbox (`SandboxType.NONE`):** If sandboxing is not available or explicitly disabled (e.g., via `CODEX_UNSAFE_ALLOW_NO_SANDBOX`), commands are executed directly.

**Safety Nets and Warnings:**

- **Git Tracking:** Codex CLI warns the user if it's started in `auto-edit` or `full-auto` mode in a directory not tracked by Git. This ensures that changes can be easily reviewed and reverted. The Rust TUI (`codex-rs/tui/`) also includes a `GitWarningScreen`.
- **Command Explanation:** In interactive mode, users can request an explanation of a command before approving it.
- **User-defined Safe Commands (Rust CLI):** The `config.toml` for `codex-rs` allows users to define a list of commands considered safe, which can influence approval logic.
- Dangerous Options:
  - `--dangerously-auto-approve-everything` (TypeScript CLI): This flag bypasses all confirmation prompts and sandboxing. It is strictly for ephemeral local testing in trusted environments.
  - `CODEX_UNSAFE_ALLOW_NO_SANDBOX` (TypeScript CLI env var): Allows running without a sandbox if the environment is already considered secure.

**Upcoming/Planned Features (mentioned in README or implied):**

- Whitelisting specific commands to auto-execute with network enabled, once additional safeguards are in place.

The `codex-rs/execpolicy/` crate provides a more granular way to define and check command execution policies based on program names, flags, and argument types (e.g., readable/writable files). This allows for defining policies in Starlark (`.policy` files) to classify commands.

The next section will cover Contribution, Quality, and Release Workflow.

## 7. Contribution, Quality, and Release Workflow

**Contribution Process:**

- **Issues and Discussions:** Contributors are encouraged to start with an issue or discussion to agree on solutions before writing code. GitHub Issue templates are provided for bug reports and documentation issues.
- **Topic Branches:** Create topic branches from `main` (e.g., `feat/interactive-prompt`).
- **Focused Changes:** Keep changes focused; unrelated fixes should be in separate Pull Requests (PRs).
- **Atomic Commits:** Each commit should compile, and tests should pass.
- **PR Template:** Fill in the PR template (What? Why? How?).
- **CLA (Contributor License Agreement):** All contributors must accept the CLA by commenting "I have read the CLA Document and I hereby sign the CLA" on their PR. The CLA-Assistant bot manages this. The CLA document is `docs/CLA.md`.
- **Review Process:** A maintainer will be assigned. Changes may be requested. Approved PRs are squash-merged.

**Code Quality Enforcement:**

- Linters and Formatters:

  - **TypeScript/React (`codex-cli`):** ESLint and Prettier are used for linting and formatting. Scripts like `lint`, `lint:fix`, `format`, `format:fix` are available in `codex-cli/package.json`.
  - **Root level JSON/Markdown:** Prettier is used for formatting root-level `*.json`, `*.md`, and GitHub workflow YAML files.
  - **Rust (`codex-rs`):** `cargo fmt` (with `imports_granularity=Item`) and `cargo clippy` (with `-D warnings`) are used, as seen in `codex-rs/.github/workflows/rust-ci.yml`.

- Type Checking:

  - **TypeScript (`codex-cli`):** `pnpm run typecheck` (which runs `tsc --noEmit`).

- Husky Git Hooks:

  Used to enforce code quality checks before commits and pushes.

  - **Pre-commit:** Runs `lint-staged` to format and lint staged files (`.lintstagedrc.json` in root, and `lint-staged` config in `package.json`).
  - **Pre-push:** Runs tests and type checking.

- Testing:

  - **TypeScript (`codex-cli`):** Vitest is used for unit tests (`pnpm test`, `pnpm test:watch`).
  - **Rust (`codex-rs`):** `cargo test` is run as part of CI for various targets.

- CI Checks (`.github/workflows/ci.yml`):

  - Checks TypeScript code formatting.
  - Checks Markdown and config file formatting.
  - Runs tests, linting, type-checking, and build for `codex-cli`.
  - Ensures staging a release works.
  - Runs `asciicheck.py` on `README.md`.
  - Runs `readme_toc.py` to check `README.md`'s table of contents.

- **Codespell (`.github/workflows/codespell.yml`):** Checks for spelling errors.

**Release Workflow:**

- TypeScript CLI (`codex-cli`):
  - A helper script `codex-cli/scripts/stage_release.sh` is used to prepare an npm package.
  - This script builds JS artifacts, copies necessary files, generates a timestamp-based version, and modifies `package.json`.
  - It can optionally bundle native Rust CLI binaries for Linux (`--native` flag), creating a "fat" package.
  - The staged package is then published to npm via `npm publish`.
  - The `CHANGELOG.md` is updated using `git-cliff`.
- Rust Components (`codex-rs`):
  - Releases are triggered by pushing a Git tag in the format `rust-v*.*.*`.
  - The `.github/workflows/rust-release.yml` workflow handles the release process.
  - It first validates that the Git tag matches the version in `codex-rs/Cargo.toml`.
  - Then, it builds binaries for multiple targets (macOS aarch64/x86_64, Linux x86_64/aarch64 for musl and gnu).
  - Artifacts (`codex-exec`, `codex`, `codex-linux-sandbox`) are staged, compressed (both `.zst` and `.tar.gz`), and uploaded as release artifacts.
  - A GitHub Release is created using `softprops/action-gh-release`.
  - Finally, `facebook/dotslash-publish-release` is used with `.github/dotslash-config.json` to publish the release.
  - There's also a manual script `codex-rs/scripts/create_github_release.sh` for creating Rust releases.

I will continue with the next section on Extensibility, Provider Support, and Advanced Config.

## 8. Extensibility, Provider Support, and Advanced Config

**AI Provider Support:**

- **Default Provider:** OpenAI is the default provider.

- Supported Providers (TypeScript CLI):

  The

  ```
  codex-cli
  ```

  explicitly lists support for:

  - OpenAI
  - OpenRouter
  - Azure OpenAI
  - Gemini
  - Ollama
  - Mistral
  - DeepSeek
  - xAI
  - Groq
  - ArceeAI
  - Any other provider compatible with the OpenAI API can be used by setting the `<PROVIDER>_BASE_URL` environment variable.

- **Supported Providers (Rust CLI):** The `codex-rs` core also has a list of built-in model providers which is very similar. Each provider has a `name`, `base_url`, optional `env_key` for the API key, and `wire_api` (`Responses` or `Chat`).

**Custom Provider Configuration:**

- TypeScript CLI (`~/.codex/config.json` or `~/.codex/config.yaml`):

  - The `providers` object in the configuration file allows defining custom providers or overriding default ones.
  - Each provider entry requires:
    - `name`: Display name (e.g., "Custom OpenAI").
    - `baseURL`: The API service URL (e.g., "[https://custom-api.openai.com/v1](https://www.google.com/search?q=https://custom-api.openai.com/v1)").
    - `envKey`: The environment variable name for the API key (e.g., "CUSTOM_OPENAI_API_KEY").
  - The `provider` field in the main config selects the active provider.

- Rust CLI (`~/.codex/config.toml`):

  - The `model_providers` table allows defining custom providers.

  - Each provider entry requires `name`, `base_url`, `env_key` (optional), and `wire_api` (`chat` or `responses`).

  - The `model_provider` key in the main config or a profile selects the active provider.

  - Example:

    Ini, TOML

    ```
    model = "gpt-4o"
    model_provider = "openai-chat-completions"

    [model_providers.openai-chat-completions]
    name = "OpenAI using Chat Completions"
    base_url = "https://api.openai.com/v1"
    env_key = "OPENAI_API_KEY"
    wire_api = "chat"
    ```

**Advanced Configuration:**

- History Configuration (TypeScript CLI):

  - `history.maxSize`: Maximum number of command history entries to save (default: 1000).
  - `history.saveHistory`: Boolean, whether to save command history (default: true).
  - `history.sensitivePatterns`: Array of regex patterns for filtering sensitive information from history. Default patterns include common keywords like "password", "secret", "token", "key", and long alphanumeric strings likely to be API keys.

- History Configuration (Rust CLI):

  - ```
    [history]
    ```

    :

    - `persistence`: `"save-all"` (default) or `"none"`.
    - `max_bytes`: Optional, maximum size of the history file in bytes.

- Shell Tool Output Limits (TypeScript CLI):

  Configurable in

  ```
  ~/.codex/config.json
  ```

  under

  ```
  tools.shell
  ```

  .

  - `maxBytes`: Default `DEFAULT_SHELL_MAX_BYTES` (10KB).
  - `maxLines`: Default `DEFAULT_SHELL_MAX_LINES` (256 lines).
  - The `createTruncatingCollector` utility enforces these limits.

- **Shell Environment Policy (Rust CLI):** `shell_environment_policy` in `config.toml` controls which environment variables are passed to subprocesses. It supports `inherit` (`core`, `all`, `none`), `ignore_default_excludes`, `exclude` (glob patterns), `set` (overrides), and `include_only` (whitelist glob patterns).

- **Notification Configuration (Rust CLI):** The `notify` option in `config.toml` can specify a program to execute for events like `agent-turn-complete`. The program receives a JSON payload. The TypeScript CLI supports desktop notifications via the `--notify` flag or the `notify: true` config.

- **File Opener (TypeScript & Rust CLI):** The `fileOpener` (TS) or `file_opener` (Rust) config allows specifying a URI scheme (`vscode`, `cursor`, `windsurf`, etc.) to make file citations in model output clickable in the terminal.

- Error Handling:

  - **TypeScript CLI `fullAutoErrorMode`:** In `full-auto` approval mode, this determines behavior on command execution errors: `ask-user` (prompts to retry without sandbox) or `ignore-and-continue`.
  - **Rust CLI:** The `AskForApproval::OnFailure` policy is similar, prompting to retry outside the sandbox if a sandboxed command fails.

- **Zero Data Retention (ZDR):** If an OpenAI organization has ZDR enabled, `disableResponseStorage` (TS) or `disable_response_storage` (Rust) should be set to `true`. This sends the full conversation context with each request instead of relying on server-side storage.

Next, I will cover FAQ, Troubleshooting, and Advanced Usage.

## 9. FAQ, Troubleshooting, and Advanced Usage

**Frequently Asked Questions (FAQ):**

- **Relation to 2021 Codex Model:** The Codex CLI is separate from the original Codex model deprecated in March 2023.
- **Supported Models:** Any model available via the OpenAI Responses API (default: `o4-mini`). Can be changed with `--model` or config file. The Rust CLI also defaults to `codex-mini-latest` which can be overridden.
- **`o3` or `o4-mini` Not Working:** API accounts might need verification to use these models for streaming responses. The `codex-cli/src/cli.tsx` file contains logic to check if a model is supported via `isModelSupportedForResponses`.
- **Preventing File Edits:** In `suggest` mode (default), all file changes require user approval. Users can deny proposed commands or file changes.
- **Windows Support:** Not directly supported. Requires Windows Subsystem for Linux (WSL2). Tested on macOS and Linux with Node 22. The Rust CI workflow includes tests for `x86_64-pc-windows-msvc` to ensure it at least builds.

**Troubleshooting and Error Handling:**

- API Key Issues:
  - Missing API key: The CLI will error with instructions on how to set the `<PROVIDER>_API_KEY` environment variable and where to create a key.
  - Invalid/Expired Key: The `getApiKey` utility in `codex-cli` handles token refresh and prompts for login if needed.
- Model Errors:
  - Model Not Found: If a selected model is not available for the account/provider, an error is displayed. The CLI might auto-open the model selector in such cases.
  - Rate Limits: The agent loop (`codex-cli/src/utils/agent/agent-loop.ts`, `codex-rs/core/src/client.rs`) implements retry logic with exponential backoff for rate limit errors (HTTP 429). A system message is shown if retries are exhausted.
  - Insufficient Quota: A specific message guides users to check their billing.
  - Max Tokens Exceeded: A system message indicates the context length was exceeded.
- Zero Data Retention (ZDR):
  - If an organization has ZDR enabled, `disableResponseStorage` (or `disable_response_storage` in Rust) must be true.
  - Errors related to ZDR and `previous_response_id` might occur if this is misconfigured; upgrading the CLI is recommended.
- Command Execution Failures:
  - In `full-auto` mode (TS CLI), if `fullAutoErrorMode` is `ask-user`, the CLI will prompt to retry the failed command without the sandbox.
  - The Rust CLI's `AskForApproval::OnFailure` policy behaves similarly.
- **File Permissions:** `apply_patch` might fail if it tries to write to a non-existent directory or a protected file. The Rust version of `apply_patch` includes logic to create parent directories.
- **Network Errors:** Generic network errors or server-side issues (HTTP 5xx) are handled with retries and user-facing messages.
- **Bug Reports:** The `/bug` slash command (TS CLI) generates a pre-filled GitHub issue URL with session details. The bug report template itself is `.github/ISSUE_TEMPLATE/2-bug-report.yml`.

**Advanced Usage:**

- Debugging (TypeScript CLI):
  - Set `DEBUG=true` environment variable to print full API request/response details. The logger is initialized in `codex-cli/src/utils/logger/log.ts`.
  - Logs are written to a session-specific file and symlinked to `codex-cli-latest.log` in a temporary directory (e.g., `$TMPDIR/oai-codex/` on macOS/Windows, `~/.local/oai-codex/` on Linux).
  - To debug with a visual debugger (like VS Code), build the CLI (`pnpm run build`) and run with `node --inspect-brk ./dist/cli.js`.
- Prompting Techniques:
  - The `codex-cli/examples/prompting_guide.md` provides tips for writing effective prompts for small, medium, and large tasks.
  - For complex tasks, providing a high-level requirements document and instructing the agent to create and update planning files (e.g., in a `.codex/` directory) is recommended.
- **Full Context Mode (`--full-context`):** (TypeScript CLI) An experimental feature that attempts to load the entire repository into the LLM's context to apply a batch of edits in a single pass. This is handled by `codex-cli/src/cli-singlepass.tsx`.
- **Model Context Protocol (MCP) Server (Rust):** The Rust CLI can run as an MCP server using `codex mcp` or `codex-rs mcp`. This allows other MCP clients (like the MCP Inspector) to connect to it.
- **Protocol Mode (Rust `proto` subcommand):** The `codex-rs proto` subcommand allows interaction with the Codex core via newline-delimited JSON over stdin/stdout, as defined in `codex-rs/docs/protocol_v1.md`.

I will now proceed to the final section on Licensing, Community, and Meta Information.

## 10. Licensing, Community, and Meta Information

**Licensing:**

- The `openai/codex` repository is licensed under the **Apache-2.0 License**. The full license text is expected to be in a `LICENSE` file at the root of the repository, though it wasn't explicitly among the fetched files, its presence is standard and referred to in the main `README.md`.

**Community and Contribution:**

- **Open Source Fund:** OpenAI has a **$1 million initiative** to support open-source projects using Codex CLI and other OpenAI models. Grants are up to $25,000 in API credits and applications are reviewed on a rolling basis. An application link is provided in the `README.md`.

- Contribution:

  The project welcomes contributions, including bug reports, feature requests, and pull requests.

  - Detailed contribution guidelines are available in the `README.md`, covering development workflow, Git hooks (Husky), debugging, writing high-impact changes, opening PRs, the review process, and community values.
  - **Contributor License Agreement (CLA):** All contributors must sign the CLA by commenting on their PR. The CLA is based on the Apache Software Foundation Individual CLA and is detailed in `docs/CLA.md`.

- **Getting Help:** Contributors can open a Discussion or comment on relevant issues for assistance.

- **Community Values:** The project follows the Contributor Covenant.

**Meta Information:**

- **Maintainers and Contributors:** The `README.md` encourages community contribution but does not explicitly list primary maintainers or major contributors. Contribution history would be available via Git.
- **Experimental Technology:** The Codex CLI is an experimental project under active development and is not yet stable. It may contain bugs, incomplete features, or undergo breaking changes.
- **Security and Responsible AI:** Security vulnerabilities or concerns about model output should be emailed to **security@openai.com**.

---

## Embedded Verification/Self-Critique

- **Completeness against File Inventory:** The documentation covers all major directories and many key files identified in the initial file listing. Some specific test files or very granular utility files might not be individually detailed but their containing modules/directories are.
- Coverage of Functional Areas:
  - Installation: Covered (npm, source, native, Nix).
  - Agent Config (`AGENTS.md`, CLI flags): Covered.
  - CLI Usage (commands, flags, modes): Covered for both TS and Rust CLIs.
  - Security Model (sandboxing, approvals): Covered in detail.
  - Contribution (CLA, workflows, quality): Covered.
  - Release (npm, Rust native): Covered.
  - Extensibility (providers, MCP): Covered.
- Identification of Ambiguities/Outdated Docs:
  - The exact structure of the `~/.codex/config.json` vs. `~/.codex/config.toml` and which CLI uses which for every single option could be slightly ambiguous without direct testing, but the `README.md` and `codex-rs/config.md` provide good separate overviews. The TS CLI primarily uses JSON/YAML, while the Rust CLI uses TOML for its main config.
  - The `codex-cli/examples/prompting_guide.md` is referenced but its detailed content wasn't deeply integrated into each section of this documentation (as it's a guide itself).
  - The `AGENTS.md` at the root of `codex-rs` is specific to Rust development with the agent, which is a niche but important detail captured.
- Assumptions/Inferences:
  - Assumed that `LICENSE` file exists at the root and is Apache-2.0 as stated in `README.md`.
  - Inferred that `codex-cli/dist/` would contain the compiled output based on `build.mjs` and standard TypeScript project structure.
  - Inferred Rust `Cargo.toml` and `Cargo.lock` existence within `codex-rs` due to it being a Cargo workspace.

This concludes the comprehensive documentation based on the provided files and instructions.
