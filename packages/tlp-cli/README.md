# Timeleap CLI (`tlp`)

The Timeleap CLI is your single entrypoint to the distributed compute network powered by Timeleap.
It installs, configures, runs, and manages everything from brokers to workers — including plugins, secrets, and workloads.

---

## 🚀 Quick Install

```bash
curl -fsSL https://timeleap.swiss/install | bash
```

If you're installing from a custom binary:

```bash
curl -fsSL https://timeleap.sh/install.sh | TLP_BINARY_URL=https://yourhost.com/tlp-linux-x64.zip bash
```

---

## 🛠 Features

- ✅ Install broker and worker nodes
- 🔐 Manage secrets and identities
- ⚙️ Register and run plugins
- 🧱 Bootstrap minimal projects with `tlp init`
- 🔍 Self-update support (coming soon)

---

## 🧪 Usage

```bash
tlp --help
```

Example:

```bash
tlp init          # Create a fresh node config
tlp broker up     # Start the broker node
tlp worker up     # Start the worker node
tlp plugin add    # Register a new plugin
```

---

## 📦 Build Targets

We build static executables using Bun with `bun build --compile`, targeting:

| Platform    | Target                   | Zip Filename             |
| ----------- | ------------------------ | ------------------------ |
| Linux x64   | `bun-linux-x64-baseline` | `tlp-linux-x64.zip`      |
| macOS x64   | `bun-darwin-x64`         | `tlp-darwin-x64.zip`     |
| macOS ARM64 | `bun-darwin-arm64`       | `tlp-darwin-aarch64.zip` |

All files are uploaded to the [GitHub Releases](https://github.com/TimeleapLabs/tools/cli/releases/latest).

---

## 🔒 Security Notes

This CLI handles credentials and secrets. Keep your `secrets.yaml` file secure and don't share it.
Secrets are automatically created on project initialization.

---

## 📁 Repo Structure

```
.
├── src/index.ts          # CLI entrypoint (Bun)
├── src/assets/           # Templates and static assets
├── dist/                 # Compiled binaries and release zips
├── scripts/build.ts      # Multi-platform build script
└── scripts/install.sh    # Universal installer (curl | bash)
```

## 🧙 About Timeleap

Timeleap is a distributed compute network. It separates orchestration (broker) and execution (worker), enabling custom logic, plugins, and full control over workload routing.

> Learn more at [timeleap.swiss](https://timeleap.swiss)
