# Watch Mode

Automatic file monitoring and rebuilding for efficient development workflow.

## Features

- **File Change Detection**: Monitors all markdown, YAML, and JSON files
- **Automatic Rebuilds**: Triggers builds when files change
- **Live Reload**: Automatically refreshes browser on changes
- **Selective Rebuilding**: Smart detection of incremental vs full rebuild needs
- **WebSocket Integration**: Real-time browser communication
- **Development Server**: Optional integrated HTTP server
- **Build Queue Management**: Debounced builds for multiple rapid changes
- **Error Reporting**: Live error notifications in browser console

## Usage

### Basic Watch Mode
```bash
npm run watch
```

This starts the file watcher and WebSocket server without the development server.

### Development Mode (with Server)
```bash
npm run dev
# or
npm run watch -- --server
```

This starts watch mode with an integrated development server.

### Custom Configuration
```bash
# Custom ports
npm run watch -- --port=8080 --ws-port=8081

# Verbose logging
npm run watch -- --verbose

# Custom directories
npm run watch -- --src=content --public=dist
```

## How It Works

### File Watching
The watch mode monitors:
- `src/**/*.md` - All markdown content files
- `src/**/*.yml` and `src/**/*.yaml` - Configuration files
- `src/**/*.json` - Data files
- `book-config.json` - Main book configuration
- `package.json` - Project configuration

### Build Strategy

#### Incremental Builds
Triggered for:
- Content changes in markdown files
- Minor configuration updates
- Asset modifications

#### Full Rebuilds
Triggered for:
- File deletions (`unlink` events)
- Changes to `book-config.json`
- Changes to `package.json`
- Structural changes (chapter index files)

### Live Reload

1. **WebSocket Server**: Runs on port 3001 by default
2. **Client Script Injection**: Automatically injects live reload script into HTML files
3. **Browser Connection**: Establishes WebSocket connection for real-time updates
4. **Auto Reconnect**: Handles connection drops gracefully

## Command Line Options

| Option | Short | Description | Default |
|--------|-------|-------------|---------|
| `--server` | `-s` | Start development server | false |
| `--verbose` | `-v` | Enable detailed logging | false |
| `--port=<n>` | | HTTP server port | 3000 |
| `--ws-port=<n>` | | WebSocket server port | 3001 |
| `--src=<dir>` | | Source directory | src |
| `--public=<dir>` | | Output directory | public |

## Console Output

```
[14:23:45] 🔍 Starting watch mode...
[14:23:45] 🔨 Running initial build...
[14:23:47] ✅ Initial build complete
[14:23:47] ✅ Watch mode ready
[14:23:47]    👀 Watching: src
[14:23:47]    🌐 WebSocket: ws://localhost:3001
[14:23:47]    🎉 Dev server: http://localhost:3000

[14:24:12] 📄 change: src/chapters/chapter01/index.md
[14:24:12] 🔄 Build #1 - Processing 1 changes...
[14:24:13] ✅ Build complete in 847ms
[14:24:13] 🔌 Client connected (1 total)
```

## Advanced Features

### Build Queue Management

Multiple rapid file changes are intelligently batched:

```javascript
// Debounce delay prevents excessive rebuilds
debounceDelay: 300 // milliseconds
```

### Build Cache

The watch mode maintains a cache of file hashes to optimize rebuilds:

```javascript
// Get changed files since timestamp
const changes = await watcher.getChangedFiles(timestamp);

// Get build statistics
const stats = watcher.getBuildStats();
console.log(stats);
// {
//   buildCount: 5,
//   cachedFiles: 23,
//   connectedClients: 2,
//   queuedChanges: 0,
//   isBuilding: false
// }
```

### Custom Integration

```javascript
const { WatchMode } = require('./scripts/watch-mode');

const watcher = new WatchMode({
  port: 8080,
  wsPort: 8081,
  srcDir: 'content',
  publicDir: 'dist',
  startServer: true,
  verbose: true,
  debounceDelay: 500,
  ignored: ['node_modules', '.git', '*.tmp', 'drafts/**']
});

await watcher.init();
```

## Live Reload Client

The injected client script handles:

- **Automatic reconnection** on connection loss
- **Page reload** on successful builds
- **Error logging** on build failures
- **Connection status** in browser console

### Manual Client Integration

If automatic injection doesn't work, add this to your HTML:

```html
<script>
(function() {
  const ws = new WebSocket('ws://localhost:3001');
  ws.onmessage = function(event) {
    const data = JSON.parse(event.data);
    if (data.type === 'reload') {
      location.reload();
    }
  };
})();
</script>
```

## Troubleshooting

### Port Already in Use
```bash
# Use different ports
npm run watch -- --port=8080 --ws-port=8081
```

### Files Not Being Watched
- Check if files match the watch patterns
- Verify files aren't in ignored list
- Use `--verbose` for detailed logging

### Live Reload Not Working
- Check WebSocket port is accessible
- Verify script injection in HTML files
- Check browser console for errors
- Ensure no firewall/proxy blocking WebSocket

### Build Errors Not Shown
```bash
# Enable verbose mode
npm run watch -- --verbose
```

## Performance Optimization

### Debounce Configuration
Adjust for your workflow:
- **Fast (100ms)**: Quick feedback, more builds
- **Default (300ms)**: Balanced performance
- **Slow (500ms+)**: Fewer builds, better for large projects

### Ignored Patterns
Optimize by excluding unnecessary files:
```javascript
ignored: [
  'node_modules',
  '.git',
  '**/*.tmp',
  '**/*.swp',
  '**/drafts/**',
  '**/.DS_Store'
]
```

## Integration Examples

### With npm Scripts
```json
{
  "scripts": {
    "dev": "npm run watch -- --server",
    "dev:verbose": "npm run watch -- --server --verbose",
    "dev:custom": "npm run watch -- --server --port=8080"
  }
}
```

### With Proxy Servers
For complex setups, use watch mode with a proxy:

```javascript
// proxy-dev.js
const proxy = require('http-proxy-middleware');
const express = require('express');
const app = express();

// Serve static files
app.use(express.static('public'));

// Proxy API calls
app.use('/api', proxy({
  target: 'http://localhost:4000',
  changeOrigin: true
}));

app.listen(3000);
```

### CI/CD Integration
Watch mode can be used in CI for testing:

```yaml
# GitHub Actions example
- name: Start Watch Mode
  run: |
    npm run watch &
    WATCH_PID=$!
    sleep 5  # Wait for initial build
    
- name: Run Tests
  run: npm test
  
- name: Stop Watch Mode
  run: kill $WATCH_PID
```

## Best Practices

1. **Use Development Mode** for active development:
   ```bash
   npm run dev
   ```

2. **Enable Verbose Mode** when debugging:
   ```bash
   npm run watch -- --verbose
   ```

3. **Customize Ignore Patterns** for your project:
   - Exclude draft directories
   - Ignore backup files
   - Skip temporary files

4. **Monitor Build Performance**:
   - Check build times in console
   - Adjust debounce delay if needed
   - Use incremental builds when possible

5. **Handle Errors Gracefully**:
   - Watch mode continues after build errors
   - Check browser console for error details
   - Fix errors to trigger successful rebuild

The watch mode significantly improves development workflow by providing instant feedback on changes and eliminating manual rebuild steps.
