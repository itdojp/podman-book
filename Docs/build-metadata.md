# Build Metadata Management

The build metadata management system tracks and analyzes the build history of your book project, providing insights into file changes, build patterns, and project statistics.

## Overview

The system consists of two main components:

1. **BuildMeta class** (in `build-incremental.js`) - Automatic metadata tracking during builds
2. **MetaManager** (in `meta-manager.js`) - Advanced analysis and management tools

## Metadata Structure

The metadata is stored in `.build-meta.json` with the following structure:

```json
{
  "version": "2.0",
  "lastBuild": "2025-06-16T10:11:04.012Z",
  "files": {
    "path/to/file.md": {
      "hash": "sha256-hash",
      "lastModified": "2025-06-16T10:11:04.000Z",
      "size": 857,
      "buildCount": 2
    }
  },
  "stats": {
    "totalBuilds": 3,
    "totalFiles": 12,
    "averageBuildTime": 22
  }
}
```

## Available Commands

### Status Overview
```bash
npm run meta:status
```
Shows a summary of:
- Last build timestamp
- Total builds and tracked files
- Project size statistics
- File type distribution
- Build frequency patterns

### Detailed Analysis
```bash
npm run meta:analyze
```
Provides detailed analysis including:
- Most frequently built files
- Largest files in the project
- Recently modified files
- Build efficiency metrics

### Cleanup Operations
```bash
npm run meta:cleanup          # Remove entries for deleted files
npm run meta:cleanup 30       # Also remove entries older than 30 days
```

### Export Data
```bash
npm run meta:export           # Export to JSON
npm run meta:export csv       # Export to CSV
```

### Generate Reports
```bash
npm run meta:report           # Generate detailed analysis report
```

### Reset Metadata
```bash
npm run meta:reset            # Clear all metadata
```

## Use Cases

### Performance Optimization
- Identify files that are built most frequently
- Find bottlenecks in your build process
- Monitor build time trends

### Project Insights
- Track which content sections are most active
- Understand file size distribution
- Monitor project growth over time

### Maintenance
- Clean up metadata for deleted files
- Archive old build history
- Export data for external analysis

## CLI Usage

You can also use the metadata manager directly:

```bash
node scripts/meta-manager.js <command> [options]

Commands:
  status              Show metadata status and summary
  analyze             Detailed analysis of build patterns
  cleanup [days]      Remove deleted files and optionally old entries
  reset               Reset all metadata
  export [json|csv]   Export metadata to file
  report              Generate detailed analysis report
```

## Integration

The metadata system is automatically integrated with:
- **Incremental builds** - Updates metadata on every build
- **Security scanning** - Tracks content filtering results
- **Configuration system** - Respects exclude patterns

## File Tracking

The system tracks:
- **Content files** - Markdown files in src/
- **Assets** - Images and other resources
- **Configuration** - Jekyll layouts and config files
- **Documentation** - README, setup guides, etc.

Files are tracked using SHA-256 hashes for reliable change detection, even when timestamps are unreliable.

## Reports and Analytics

Generated reports include:
- Build frequency analysis
- File size distribution
- Content type breakdown
- Performance metrics
- Historical trends

Reports can be exported in JSON or CSV format for integration with external tools or for archival purposes.