# **Comprehensive Repository Documentation: openai/codex-universal**

This document provides a detailed technical overview of the `openai/codex-universal` repository. It is intended for developers, DevOps engineers, and LLM agents who need to understand, customize, extend, or troubleshoot the reference Docker image designed to mimic the OpenAI Codex environment for local development.

## **Table of Contents**

1. Repository Overview and Structure
2. Quickstart and Usage Guide
3. Supported Languages and Environment Variables
4. Scripts and Entry Points (Detailed Analysis)
5. Dockerfile Walkthrough
6. Supplementary Tools and Packages
7. CI/CD and Automation Workflows
8. Contribution and Licensing
9. Known Issues and Extensibility
10. Verification, Self-Critique, and Ambiguities

---

## 1. **Repository Overview and Structure**

The `openai/codex-universal` repository provides a reference implementation of the base Docker image used in OpenAI Codex. Its primary goal is to allow developers to create and test custom environments locally that closely resemble the actual Codex execution environment.

### **Top-Level Files and Directories:**

- **`.github/workflows/build-image.yml`**: This GitHub Actions workflow defines the continuous integration (CI) process for building and pushing the Docker image to a container registry (ghcr.io). It handles triggers on push and pull requests to the `main` branch and includes steps for logging into the registry, setting up QEMU and Docker Buildx, building the multi-platform image (linux/amd64, linux/arm64), and generating artifact attestations.

- `LICENSES/`

  : This directory contains Software Bill of Materials (SBOM) and licensing information.

  - **`codex-universal-image-sbom.md`**: A Markdown-formatted SBOM listing the software components, their versions, sources, installation methods, and licenses included in the Docker image.
  - **`codex-universal-image-sbom.spdx.json`**: An SPDX (Software Package Data Exchange) formatted JSON file providing a detailed, machine-readable SBOM. It includes package names, versions, download locations, licenses, suppliers, and creation information for the SBOM document itself.

- **`README.md`**: The primary documentation file. It explains the repository's purpose, provides usage instructions for pulling and running the Docker image, details environment variables for configuring language runtimes, and lists included packages.

- **`entrypoint.sh`**: The entrypoint script for the Docker container. It prints a welcome message and then executes `setup_universal.sh` to configure the environment based on specified environment variables, before dropping the user into a bash shell.

- **`setup_universal.sh`**: A bash script responsible for configuring the language runtimes (Python, Node.js, Rust, Go, Swift) within the Docker container based on `CODEX_ENV_*` environment variables. It handles version switching and installation of associated tools.

- **`Dockerfile`** (Implicit): While not directly provided in the file listing, its existence is critical and inferred from the `README.md`, the `build-image.yml` workflow, and the SBOMs. This file defines the Docker image layers, base image, and installation steps for all tools and dependencies.

### **Directory Tree Summary (Conceptual):**

```
openai/codex-universal/
├── .github/
│   └── workflows/
│       └── build-image.yml  # CI workflow for Docker image build and push
├── LICENSES/
│   ├── codex-universal-image-sbom.md    # Human-readable SBOM
│   └── codex-universal-image-sbom.spdx.json # Machine-readable SPDX SBOM
├── Dockerfile                 # Defines the Docker image (inferred)
├── README.md                  # Main documentation and usage guide
├── entrypoint.sh              # Container entrypoint script
└── setup_universal.sh         # Language runtime setup script
```

---

## 2. **Quickstart and Usage Guide**

The `codex-universal` Docker image provides a local environment similar to OpenAI Codex, aiding in development and debugging.

### **Pulling the Image:**

The Docker image is available on GitHub Container Registry (ghcr.io).

Bash

```
docker pull ghcr.io/openai/codex-universal:latest
```

### **Running the Image:**

The following script demonstrates how to run the image, approximating the Codex setup environment. It mounts the current directory into the container's workspace.

Bash

```
# Example with specific language versions
docker run --rm -it \
    -e CODEX_ENV_PYTHON_VERSION=3.12 \
    -e CODEX_ENV_NODE_VERSION=20 \
    -e CODEX_ENV_RUST_VERSION=1.87.0 \
    -e CODEX_ENV_GO_VERSION=1.23.8 \
    -e CODEX_ENV_SWIFT_VERSION=6.1 \
    -v $(pwd):/workspace/$(basename $(pwd)) -w /workspace/$(basename $(pwd)) \
    ghcr.io/openai/codex-universal:latest
```

The `codex-universal` image uses `CODEX_ENV_*` environment variables to configure specific language versions during container startup via the `setup_universal.sh` script.

### **Differences/Limitations:**

The `README.md` states: "This is not an identical environment but should help for debugging and development." Users should be aware that while this image aims to mirror the Codex environment, discrepancies may exist. For precise details on the official Codex environment, refer to the [OpenAI Codex documentation](https://www.google.com/search?q=http://platform.openai.com/docs/codex).

---

## 3. **Supported Languages and Environment Variables**

The image supports several programming languages, configurable via environment variables. The `setup_universal.sh` script processes these variables at container startup.

| **Environment variable**   | **Description**            | **Supported versions (from README.md)**          | **Additional packages (from README.md)**                             | **Notes (from setup_universal.sh)**                                                                                                                                                                       |
| -------------------------- | -------------------------- | ------------------------------------------------ | -------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `CODEX_ENV_PYTHON_VERSION` | Python version to install  | `3.10`, `3.11.12`, `3.12`, `3.13`                | `pyenv`, `poetry`, `uv`, `ruff`, `black`, `mypy`, `pyright`, `isort` | `pyenv global` is used to set the version. Always runs install commands for global libraries.                                                                                                             |
| `CODEX_ENV_NODE_VERSION`   | Node.js version to install | `18`, `20`, `22`                                 | `corepack`, `yarn`, `pnpm`, `npm`                                    | `nvm alias default` and `nvm use` set the version. `corepack enable` and `corepack install -g` for package managers. Always runs install commands.                                                        |
| `CODEX_ENV_RUST_VERSION`   | Rust version to install    | `1.83.0`, `1.84.1`, `1.85.1`, `1.86.0`, `1.87.0` |                                                                      | Compares with current version (`rustc --version`). Installs via `rustup toolchain install` and sets default if different.                                                                                 |
| `CODEX_ENV_GO_VERSION`     | Go version to install      | `1.22.12`, `1.23.8`, `1.24.3`                    |                                                                      | Compares with current version (`go version`). Installs via `go install golang.org/dl/goX.Y.Z@latest` and `goX.Y.Z download` if different. Updates `PATH`. `golangci-lint` is assumed to be pre-installed. |
| `CODEX_ENV_SWIFT_VERSION`  | Swift version to install   | `5.10`, `6.1`                                    |                                                                      | Compares with current version (`swift --version`). Installs via `swiftly install --use` if different.                                                                                                     |

[Table data primarily sourced from `README.md` and `setup_universal.sh`]

The `README.md` also mentions these pre-installed packages not tied to specific `CODEX_ENV_*` variables:

- `ruby`: 3.2.3
- `bun`: 1.2.10
- `java`: 21 (OpenJDK)
- `bazelisk` / `bazel`

---

## 4. **Scripts and Entry Points (Detailed Analysis)**

### **`entrypoint.sh`**

- **Purpose:** This script serves as the main entrypoint for the Docker container.
- Workflow:
  1. Sets Bash options for stricter error handling.
  2. Prints a welcome message: "Welcome to openai/codex-universal!".
  3. Executes the `/opt/codex/setup_universal.sh` script to configure the language runtimes and tools based on environment variables.
  4. After setup, it prints "Environment ready. Dropping you into a bash shell."
  5. Finally, it executes `bash --login "$@"` to start an interactive login shell, passing any arguments it received.

<!-- end list -->

Bash

```
#!/bin/bash

echo "=================================="
echo "Welcome to openai/codex-universal!"
echo "=================================="

/opt/codex/setup_universal.sh # Calls the main setup script

echo "Environment ready. Dropping you into a bash shell."
exec bash --login "$@" # Starts a login bash shell
```

### **`setup_universal.sh`**

- **Purpose:** Configures specific versions of Python, Node.js, Rust, Go, and Swift based on `CODEX_ENV_*` environment variables.
- Workflow:
  1. Uses `bash --login` shebang, ensuring login profiles are sourced.
  2. `set -euo pipefail`: Enables strict error checking (exit on error, undefined variable, pipe failure).
  3. Reads `CODEX_ENV_*` variables, providing empty defaults if not set.
  4. **Python:** If `CODEX_ENV_PYTHON_VERSION` is set, uses `pyenv global` to switch to the specified version. This step is always run to ensure global Python tools are correctly pathed.
  5. **Node.js:** If `CODEX_ENV_NODE_VERSION` is set, uses `nvm alias default` and `nvm use` to switch. Enables `corepack` and installs global versions of `yarn`, `pnpm`, and `npm`. This step is always run.
  6. **Rust:** If `CODEX_ENV_RUST_VERSION` is set, it checks the current `rustc --version`. If the requested version differs, it installs the new toolchain using `rustup toolchain install --no-self-update` and sets it as default with `rustup default`.
  7. **Go:** If `CODEX_ENV_GO_VERSION` is set, it checks the current `go version`. If different, it uses `go install golang.org/dl/goX.Y.Z@latest` to get the downloader for the specific version, then `goX.Y.Z download` to install it. It also prepends the new Go binary path to `/etc/profile` to make it default in new login shells. It mentions that `golangci-lint` is already installed.
  8. **Swift:** If `CODEX_ENV_SWIFT_VERSION` is set, it checks the current `swift --version`. If different, it uses `swiftly install --use` to install and switch to the specified version.
- **Idempotency:** For Rust, Go, and Swift, the script attempts to be idempotent by checking the current version before performing an installation, saving bootup time. For Python and Node.js, the version switching commands are run regardless, as they also handle setting up global tools.
- **Error Handling:** `set -euo pipefail` ensures that the script exits immediately if any command fails or an unset variable is used.

---

## 5. **Dockerfile Walkthrough**

The actual `Dockerfile` was not provided in the input. However, its structure and contents can be inferred from other files:

- **Base Image:** The SBOM indicates `ubuntu:24.04` from Docker Hub is used as a base image.
- **Package Installations (APT):** A large number of packages are installed via `apt` from `apt.ubuntu.com`. These include development tools (`build-essential`, `cmake`, `git`, etc.), libraries (`libcurl4-openssl-dev`, `libssl-dev`, various `lib*-dev` packages), and utilities (`curl`, `wget`, `jq`, `python3`, `python3-pip`, etc.).
- Language Runtimes & Managers (Manual/Scripted Installation):
  - **Bun:** Installed via `curl+unzip` from GitHub.
  - **Go:** Installed via `curl+tar` from `golang.org`. (The `setup_universal.sh` script handles multiple Go versions on top of this base install).
  - **Gradle:** Installed via `curl+unzip` from `services.gradle.org`.
  - **Bazelisk:** Installed via `curl` from GitHub.
  - **Swift:** Installed via `swiftly script` from `swift.org`.
  - **LLVM:** Installed via a custom script (`llvm.sh`) from `apt.llvm.org`.
  - **Pyenv:** Installed via `git clone` from GitHub. (Used by `setup_universal.sh` to manage Python versions).
  - **NVM:** Installed via `git clone` from GitHub. (Used by `setup_universal.sh` to manage Node.js versions).
  - **Python versions (via Pyenv):** Multiple Python versions installed.
  - **Node.js versions (via NVM):** Multiple Node.js versions installed.
  - **Java (OpenJDK):** Installed via `apt`.
  - **Ruby:** System default installed via `apt` (package `ruby-full`).
  - **Rust:** Installed via `rustup`.
- **Python Tooling (pip/pipx):** `poetry`, `uv`, `ruff`, `black`, `mypy`, `pyright`, `isort` are installed.
- **Node.js Tooling (corepack):** `yarn`, `pnpm`, `npm` are managed/installed via `corepack`.
- **Scripts:** The `entrypoint.sh` and `setup_universal.sh` scripts are copied into the image (likely to `/opt/codex/` as referenced in `entrypoint.sh`).
- **Entrypoint/Cmd:** The `Dockerfile` would specify `entrypoint.sh` as the entrypoint.
- **Multi-platform builds:** The `.github/workflows/build-image.yml` indicates the Dockerfile is built for `linux/amd64` and `linux/arm64`.

The `README.md` mentions: "See Dockerfile for the full details of installed packages." This confirms its central role in defining the image content.

---

## 6. **Supplementary Tools and Packages**

In addition to the core language runtimes configurable via `CODEX_ENV_*` variables, the image comes pre-loaded with a wide array of development tools and libraries.

**Version Managers:**

- **Pyenv:** For managing Python versions. Version v2.5.5 installed via git clone.
- **NVM (Node Version Manager):** For managing Node.js versions. Version v0.40.2 installed via git clone.
- **Rustup:** For managing Rust toolchains.
- **Swiftly:** For managing Swift toolchains.

**Python Ecosystem Tools:**

- **Poetry:** Dependency management and packaging.
- **uv:** Fast Python package installer and resolver.
- **Ruff:** Linter.
- **Black:** Code formatter.
- **Mypy:** Static type checker.
- **Pyright:** Static type checker.
- **isort:** Import sorter.

**Node.js Ecosystem Tools (managed by Corepack):**

- **Corepack:** Manages package manager versions.
- **Yarn:** Package manager.
- **pnpm:** Package manager.
- **npm:** Package manager.

**Other Build/Utility Tools:**

- **Bazelisk:** A user-friendly launcher for Bazel. Version 1.26.0.
- **Bun:** JavaScript runtime and toolkit. Version 1.2.10.
- **Gradle:** Build automation tool. Version 8.14.
- **LLVM:** Compiler infrastructure (latest from apt.llvm.org).
- **Standard Linux Utilities:** A vast collection including `binutils`, `build-essential`, `cmake`, `curl`, `git`, `jq`, `make`, `openssh-client`, `protobuf-compiler`, `rsync`, `sudo`, `unzip`, `wget`, `zip`, and many development libraries (`lib*-dev`). These are primarily installed via `apt`.

A comprehensive list of system packages installed via `apt` can be found in the SBOM files.

---

## 7. **CI/CD and Automation Workflows**

The primary automation workflow is defined in `.github/workflows/build-image.yml`.

- **Name:** "Build image"

- **Triggers:**

  - Push events to the `main` branch.
  - Pull request events targeting the `main` branch.

- **Permissions:**

  - `contents: read`
  - `packages: write` (for pushing to ghcr.io)
  - `id-token: write` (for OIDC authentication with registry)
  - `attestations: write` (for generating artifact attestations)

- **Environment Variables (Workflow Level):**

  - `REGISTRY: ghcr.io`
  - `IMAGE_NAME: ${{ github.repository }}` (e.g., `openai/codex-universal`)

- **Job: `build-and-push`**

  - **Runner:** `ubuntu-latest`

  - **Permissions (Job Level):** Same as workflow level permissions.

  - Steps:

    1. `actions/checkout@v4`: Checks out the repository code.

    2. `docker/login-action@65b78e6e13532edd9afa3aa52ac7964289d1a9c1`: Logs in to `ghcr.io` using `github.actor` and `secrets.GITHUB_TOKEN`.

    3. `docker/setup-qemu-action@v3`: Sets up QEMU for multi-platform builds.

    4. `docker/setup-buildx-action@v3`: Sets up Docker Buildx for advanced build capabilities.

    5. ```
       docker/build-push-action@v6
       ```

       (id:

       ```
       docker_build
       ```

       ):

       - **Platforms:** `linux/amd64,linux/arm64` (Multi-architecture build).
       - **Push:** Conditional: `true` if `github.event_name == 'push'`, otherwise `false` (builds on PRs, pushes on merge to main).
       - **Tags:** `${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:latest`
       - **Cache:** Uses GitHub Actions cache (`type=gha`) for `cache-from` and `cache-to` (with `mode=max`).

    6. ```
       actions/attest-build-provenance@v2
       ```

       :

       - **Condition:** Only runs if `github.event_name == 'push'`.
       - **Action:** Generates and pushes SLSA-compliant build provenance attestations to the registry.
       - `subject-name`: `${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}`
       - `subject-digest`: `${{ steps.docker_build.outputs.digest }}` (Digest of the pushed image).

This workflow ensures that every push to `main` results in a new `:latest` Docker image being built for both amd64 and arm64 architectures, pushed to `ghcr.io`, and accompanied by a security attestation. Pull requests also trigger a build (but not a push) to verify changes.

---

## 8. **Contribution and Licensing**

- **SBOM Generation:** The SBOMs (`.md` and `.spdx.json`) were generated on "2025-05-15T23:37:28Z" by "Tool: ChatGPT SBOM Generator" for "Organization: OpenAI".

- **Data License for SBOM:** CC0-1.0.

- Package Licenses:

  The licenses for individual packages are diverse and detailed in the SBOM files. Common licenses include MIT, Apache-2.0, GPL variants, BSD, Python-2.0, etc.

  - For example, `bun` is MIT licensed.
  - `go` is BSD-3-Clause.
  - `ubuntu` base image has "Various (mostly GPLv2, LGPL, BSD, MIT)" licenses.

- **Repository License:** The overall license for the `openai/codex-universal` repository itself is not explicitly stated in the provided files, but individual components have their own licenses as documented in the SBOMs. Typically, OpenAI open-source projects use the MIT License, but this should be verified from the repository's main page or a dedicated `LICENSE` file at the root if available.

- **Contribution Guidelines:** Not explicitly provided in the given files. Standard GitHub practices (forking, pull requests) would likely apply. Contributors should ensure compliance with the licenses of all included software.

---

## 9. **Known Issues and Extensibility**

- **Not an Identical Environment:** The `README.md` explicitly states, "This is not an identical environment but should help for debugging and development." Developers should be aware that there might be subtle differences between this local image and the actual OpenAI Codex production environment.
- **Limited Supported Versions:** The `README.md` lists specific supported versions for language runtimes configurable via `CODEX_ENV_*` variables. While others might work or could be manually installed, only these are officially documented as supported by the setup scripts.
- Extensibility:
  - **Custom Dockerfile:** Users can extend the provided image by creating their own Dockerfile that uses `ghcr.io/openai/codex-universal:latest` as a base (`FROM ghcr.io/openai/codex-universal:latest`). This allows for adding more packages, custom configurations, or different tool versions.
  - **Modifying Scripts:** The `setup_universal.sh` script can be forked and modified to support additional language versions or different setup logic.
  - **Adding Packages at Runtime:** Within a running container, users can install additional packages using `apt`, `pip`, `npm`, etc., as needed for their specific project. However, these changes won't persist unless committed to a new image.
  - **Mounting Volumes:** As shown in the usage example, mounting local directories (`-v $(pwd):/workspace/...`) is a key way to bring project code and custom scripts into the environment.

---

## 10. **Verification, Self-Critique, and Ambiguities**

- Completeness:
  - This documentation covers all explicitly provided files.
  - The critical `Dockerfile` is not provided, so its section is based on inference from other files (SBOMs, README, build workflow). A full analysis requires the Dockerfile itself.
- Accuracy:
  - Information is grounded in the content of the provided files. Citations are used to link statements to their sources.
  - Version numbers and package lists are taken directly from the SBOMs and README.
- Clarity:
  - The documentation is structured with headers, tables, and code blocks for readability by both humans and LLMs.
  - Usage instructions are copy-pastable.
- Ambiguities and Uncertainties:
  - **Dockerfile Contents:** The exact build stages, layers, and specific commands within the Dockerfile are unknown. For instance, how base versions of language runtimes (before `setup_universal.sh` customization) are installed is inferred.
  - **Repository License:** The overarching license for the `codex-universal` repository is not specified in the provided files.
  - **Exact Parity with Codex:** The `README.md` notes it's "not an identical environment". The specific differences are not enumerated, which is a crucial detail for users expecting perfect replication.
  - **Supported `JAVA_VERSION` for `openjdk-${JAVA_VERSION}-jdk`**: The SBOM lists `openjdk-${JAVA_VERSION}-jdk` but later specifies Java OpenJDK 21. It's assumed `${JAVA_VERSION}` resolves to 21.
  - **Default versions in `setup_universal.sh`:** The script extracts `current` versions of Rust, Go, and Swift to compare against user-provided `CODEX_ENV_*` variables. The exact "default" versions baked into the image before this script runs are determined by the (missing) Dockerfile.
- Open Questions/Clarifications for Maintainers:
  1. Could the `Dockerfile` be made publicly available or its key sections documented to improve transparency and aid advanced customization?
  2. What is the official license for the `openai/codex-universal` repository itself?
  3. Can a more detailed list of known differences between this image and the production Codex environment be provided?
  4. What is the update strategy for the base image (`ubuntu:24.04`) and the pre-installed packages? How frequently are security patches applied?

This documentation should serve as a strong foundation. Access to the `Dockerfile` would allow for a more complete and verified "Dockerfile Walkthrough" section.

---
