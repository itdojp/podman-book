# Parallel Build System

## Overview

The parallel build system provides significant performance improvements for large book projects by processing files concurrently using Node.js Worker Threads.

## Features

- **Automatic Detection**: Automatically uses parallel build for projects with more than 20 files
- **Worker Thread Pool**: Utilizes multiple CPU cores for concurrent processing
- **GitHub Actions Matrix**: Supports matrix-based builds in CI/CD for extreme parallelization
- **Streaming Processing**: Handles large files efficiently with streaming
- **Build Profiling**: Detailed performance metrics and optimization insights

## Usage

### Local Development

```bash
# Run parallel build
npm run build:parallel

# Run with profiling
npm run build:profile
```

### GitHub Actions

The deploy workflow automatically detects large projects and uses parallel builds:

```yaml
# Automatic detection in deploy.yml
- name: Check build size
  run: |
    FILE_COUNT=$(find src -name "*.md" -type f | wc -l)
    if [ "$FILE_COUNT" -gt 20 ]; then
      echo "use_parallel=true" >> $GITHUB_OUTPUT
    fi
```

### Manual Matrix Build

For extreme parallelization in GitHub Actions:

```yaml
# Use parallel-build-test.yml workflow
on:
  workflow_dispatch:
    inputs:
      parallelism:
        description: 'Number of parallel jobs'
        default: '5'
        options: ['1', '3', '5', '8', '10']
```

## Configuration

Configure parallel build settings in `book-config.json`:

```json
{
  "parallel": {
    "enabled": true,
    "maxWorkers": 8,
    "chunkSize": 65536,
    "largeFileThreshold": 1048576
  },
  "profiling": {
    "enabled": true,
    "outputFile": ".build-profile.json",
    "memorySnapshots": true
  }
}
```

### Configuration Options

- `enabled`: Enable/disable parallel processing
- `maxWorkers`: Maximum number of worker threads (default: CPU count, max 8)
- `chunkSize`: Size of chunks for streaming processing (default: 64KB)
- `largeFileThreshold`: Files larger than this use streaming (default: 1MB)

## Performance Benchmarks

Typical performance improvements:

| Project Size | Files | Sequential | Parallel | Speedup |
|-------------|-------|------------|----------|---------|
| Small       | 10    | 2.5s       | 2.8s     | 0.9x    |
| Medium      | 50    | 12.3s      | 4.1s     | 3.0x    |
| Large       | 200   | 48.7s      | 8.2s     | 5.9x    |
| Huge        | 1000  | 241.3s     | 32.5s    | 7.4x    |

## Architecture

### Components

1. **ParallelProcessor**: Manages worker thread pool and task distribution
2. **StreamingProcessor**: Handles large file processing with streams
3. **BuildProfiler**: Collects performance metrics and generates reports
4. **Worker Threads**: Process individual files in isolation

### Process Flow

```
Main Thread
    ├── Load Configuration
    ├── Discover Files
    ├── Create Task Queue
    └── Spawn Workers
         ├── Worker 1: Process files 1-10
         ├── Worker 2: Process files 11-20
         ├── Worker 3: Process files 21-30
         └── Worker N: Process files...
              └── Merge Results → Generate TOC → Copy Assets
```

## Testing

Run the parallel build test suite:

```bash
npm run test:parallel
```

This runs tests for:
- Small projects (sequential processing)
- Medium projects (parallel processing)
- Large projects (maximum parallelization)

## Troubleshooting

### Build Slower Than Expected

1. Check worker count: `cat .build-profile.json | jq .summary.workers`
2. Verify parallel mode is enabled in configuration
3. Ensure sufficient system resources (CPU, memory)

### Build Failures

1. Check worker errors in build output
2. Verify all dependencies are installed
3. Check for file system permissions

### Memory Issues

1. Reduce `maxWorkers` in configuration
2. Lower `chunkSize` for streaming
3. Enable memory snapshots in profiling

## Best Practices

1. **File Organization**: Keep related content in same directories for better cache locality
2. **Exclude Patterns**: Use exclude patterns to skip draft/private files early
3. **Worker Count**: Set `maxWorkers` to CPU count - 1 for optimal performance
4. **CI/CD**: Use matrix builds for very large projects (>500 files)

## Integration with Other Features

- **Incremental Builds**: Parallel processing works with incremental builds
- **Format Exports**: PDF/EPUB generation can use parallel preprocessing
- **Content Validation**: Validation runs in parallel for faster feedback

## Future Enhancements

- [ ] Distributed builds across multiple machines
- [ ] Intelligent file chunking based on complexity
- [ ] GPU acceleration for image processing
- [ ] Real-time progress visualization