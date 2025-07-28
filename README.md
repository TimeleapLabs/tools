# Timeleap Tools

This monorepo contains all CLI tools and internal utilities used to operate the [Timeleap](https://timeleap.swiss) distributed compute network.

---

## 🧩 Structure

```
packages/
├── tlp/           # Main Timeleap CLI (broker, worker, plugins)
external/
├── admin/         # Admin subnet CLI (currently external, moving to Bun soon)
```

Each package is a standalone Bun workspace. See individual READMEs for usage.

---

## 📦 Installation

Use the universal installer to install `tlp`:

```bash
curl -fsSL https://timeleap.swiss/install | bash
```

---

## 🔧 Build

```bash
bun install
bun run build
```

This will build all workspace tools (e.g. `tlp`) using Bun’s `--compile` mode.

---

## 🚀 Releasing

Each tool uses independent tags for GitHub Releases:

| Tool  | Tag format   | Example      |
| ----- | ------------ | ------------ |
| `tlp` | `tlp-vX.Y.Z` | `tlp-v0.1.0` |

Each release uploads platform-specific binaries:

- `tlp-linux-x64.zip`
- `tlp-darwin-x64.zip`
- `tlp-darwin-aarch64.zip`

---

## 🔒 Security

Secrets are handled locally per tool (e.g. `secrets.yaml`). Do not commit or share these.
