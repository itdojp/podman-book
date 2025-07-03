# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a comprehensive technical book about Podman container technology titled "Podman完全ガイド" (Podman Complete Guide). The book covers container technology theory and practice, with a focus on enterprise Podman applications.

## Repository Structure

```
podman-book/
├── src/                    # Source markdown files
│   ├── introduction/       # Introduction chapter
│   ├── chapters/          # Main chapters (15 chapters)
│   ├── appendices/        # Appendices (A, B, C)
│   └── afterword/         # Afterword
├── docs/                  # Generated output (GitHub Pages)
├── book-config.json       # Book configuration
├── index.md              # Book homepage
└── CLAUDE.md             # This file
```

## Writing Guidelines

1. **Language**: All content is written in Japanese
2. **Technical Level**: Advanced - assumes reader has basic Linux/container knowledge
3. **Format**: Markdown with code examples and practical demonstrations
4. **Style**: Technical documentation with hands-on examples

## Book Structure

- **Part I: Basic** (Chapters 1-5)
  - Container fundamentals and Podman basics
- **Part II: Practice** (Chapters 6-10)  
  - Real-world development and operations
- **Part III: Advanced** (Chapters 11-15)
  - Enterprise and advanced topics

## Technical Focus

- **Podman Architecture**: Daemonless, rootless, systemd integration
- **Docker Compatibility**: Migration paths and compatibility layers
- **Security**: SELinux, user namespaces, rootless containers
- **Enterprise Features**: Kubernetes integration, monitoring, compliance

## Common Commands

```bash
# Install dependencies
npm install

# Build the book
npm run build

# Preview locally
npm run preview

# Clean build
npm run clean
```

## Important Notes

1. This book uses the Book Publishing Template v3.0
2. GitHub Pages deployment is from the /docs folder
3. The author is 太田和彦（株式会社アイティードゥ）
4. Focus on practical, hands-on examples
5. Include performance benchmarks and real-world measurements where applicable