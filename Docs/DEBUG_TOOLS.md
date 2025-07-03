# Debug Tools

Comprehensive debugging and profiling tools for the book publishing template build process.

## Features

- **Detailed Logging**: Verbose output with timestamps and color coding
- **Performance Profiling**: CPU profiling compatible with Chrome DevTools
- **Memory Analysis**: Real-time memory usage tracking and reporting
- **Build Step Visualization**: Track individual build steps with timing
- **Error Stack Traces**: Detailed error reporting with context
- **Breakpoint Support**: Pause execution at specific steps
- **Intermediate File Saving**: Save build artifacts for inspection
- **Multiple Output Formats**: Console, JSON, and HTML reports

## Usage

### Basic Debug Session
```bash
npm run debug
npm run debug -- --verbose
```

### Memory Profiling
```bash
npm run debug:memory
npm run debug -- --memory --verbose
```

### CPU Profiling
```bash
npm run debug:profile
npm run debug -- --profile --html
```

### Stack Trace Mode
```bash
npm run debug:trace
npm run debug -- --trace --verbose
```

### Advanced Options
```bash
# Save intermediate build files
npm run debug -- --save-intermediate

# Set breakpoints
npm run debug -- --break=build --break=validate

# Generate HTML report
npm run debug -- --html

# Debug specific command
npm run debug -- --verbose "npm run build:pdf"
```

## Command Line Options

| Option | Short | Description |
|--------|-------|-------------|
| `--verbose` | `-v` | Enable detailed logging |
| `--profile` | `-p` | Enable CPU profiling |
| `--memory` | `-m` | Enable memory tracking |
| `--trace` | `-t` | Enable stack trace logging |
| `--save-intermediate` | | Save intermediate build files |
| `--html` | | Generate HTML report |
| `--break=<step>` | | Set breakpoint at specific step |

## Output Files

Debug sessions create files in the `.debug/` directory:

- `debug-report-{timestamp}.json` - Complete session data
- `debug-report-{timestamp}.html` - Interactive HTML report
- `debug-cpu-profile-{timestamp}.cpuprofile` - CPU profile for Chrome DevTools
- `debug-intermediate-{step}-{timestamp}.json` - Intermediate results

## HTML Report Features

- Interactive memory usage charts
- Build step timeline
- Error and warning summaries
- Performance metrics
- Responsive design

## Chrome DevTools Integration

To analyze CPU profiles:

1. Run with `--profile` option
2. Open Chrome DevTools (F12)
3. Go to Performance tab
4. Click "Load Profile"
5. Select the generated `.cpuprofile` file

## Memory Analysis

Memory tracking provides:

- Heap memory usage over time
- RSS (Resident Set Size) tracking
- V8 heap statistics
- Memory delta per build step
- Peak memory consumption

## Breakpoint Debugging

Set breakpoints at specific build steps:

```bash
npm run debug -- --break=build --break=validate --verbose
```

When a breakpoint is hit:
- Current memory usage is displayed
- Stack trace is shown
- Execution pauses for inspection

## Performance Metrics

The debug tools track:

- Step execution time
- Memory usage patterns
- CPU utilization
- I/O operations
- Error frequency

## Troubleshooting

### Common Issues

1. **Permission Errors**: Ensure write access to `.debug/` directory
2. **Memory Overflow**: Use `--memory` sparingly for long builds
3. **Profile Size**: CPU profiles can be large for complex builds

### Error Codes

- Exit code 0: Success
- Exit code 1: Build errors detected

## Example Output

```
🔧 Starting debug session...
🚀 Starting debug session for: npm run build
🔄 Starting: build - Running: npm run build
💾 Memory: Heap 45MB, RSS 128MB
✅ Completed: build (2847ms)

============================================================
🔧 DEBUG SESSION SUMMARY
============================================================
📊 Session Statistics:
   Duration: 3s
   Steps completed: 1/1
   Errors: 0
   Warnings: 0
   Breakpoint hits: 0

⏱️  Step Performance:
   ✅ build: 2847ms

💾 Memory Statistics:
   Peak heap: 52MB
   Average heap: 47MB
   Peak RSS: 135MB
============================================================
```

## Integration with CI/CD

Debug tools can be integrated into CI/CD pipelines:

```yaml
# GitHub Actions example
- name: Debug Build
  run: |
    npm run debug -- --profile --html
    
- name: Upload Debug Report
  uses: actions/upload-artifact@v3
  with:
    name: debug-report
    path: .debug/
```

This enables detailed build analysis in automated environments.
