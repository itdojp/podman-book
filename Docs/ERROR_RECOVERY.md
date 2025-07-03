# Error Recovery System

Enhanced error messages and automatic recovery functionality for improved user experience during build failures.

## Features

- **Enhanced Error Messages**: Context-aware error descriptions with helpful details
- **Intelligent Suggestions**: Automatic generation of fix recommendations
- **File Similarity Detection**: "Did you mean?" suggestions for missing files
- **Automatic Recovery**: Self-healing capabilities for common issues
- **Partial Build Recovery**: Save progress when builds fail
- **Health Check**: Proactive system validation
- **Recovery Logging**: Detailed logs of all recovery actions

## Usage

### Basic Error Recovery
```bash
npm run recover
npm run recover -- --verbose
```

### Automatic Recovery Mode
```bash
npm run recover:auto
npm run recover -- --auto
```

### Integration with Build Process
```bash
# Recover after build failure
npm run build || npm run recover
```

## Enhanced Error Messages

### Before (Standard Error)
```
Error: ENOENT: no such file or directory, open 'src/chapters/chapter03/index.md'
```

### After (Enhanced Error)
```
File not found: 'src/chapters/chapter03/index.md'

Did you mean one of these files?
  1. src/chapters/chapter02/index.md (85% match)
  2. src/chapters/chapter01/index.md (75% match)
  3. src/chapters/chapter04/index.md (70% match)

Files in directory 'src/chapters':
  - chapter01/
  - chapter02/
  - chapter04/
```

## Error Types and Recovery

### File Not Found Errors
- **Detection**: Missing files and directories
- **Enhancement**: Similarity-based file suggestions
- **Recovery**: 
  - Automatic directory creation
  - Template file generation
  - Path correction suggestions

### Permission Errors
- **Detection**: Access denied, permission issues
- **Enhancement**: Detailed permission analysis
- **Recovery**:
  - Permission fix commands
  - Alternative path suggestions

### JSON Parsing Errors
- **Detection**: Invalid JSON syntax
- **Enhancement**: Line/column error location
- **Recovery**:
  - Syntax validation suggestions
  - Common fix patterns

### Build Process Errors
- **Detection**: Build failures, dependency issues
- **Enhancement**: Context-aware error analysis
- **Recovery**:
  - Partial build preservation
  - Dependency reinstallation
  - Clean build suggestions

### Markdown Processing Errors
- **Detection**: Malformed markdown content
- **Enhancement**: Content-specific error details
- **Recovery**:
  - Frontmatter validation
  - Link checking
  - Format correction

## Automatic Recovery Actions

### File System Recovery
```javascript
// Missing directory
✅ Create missing directory: src/chapters/chapter03

// Missing markdown file  
✅ Create template markdown file with proper structure

// Broken permissions
⚠️  Suggest permission fix: chmod +rw filename
```

### Build Recovery
```javascript
// Partial build preservation
✅ Save partial build results to .recovery/

// Dependency issues
✅ Reinstall dependencies: npm install

// Clean build
✅ Clean and rebuild: npm run clean && npm run build
```

## File Similarity Algorithm

The system uses Levenshtein distance to find similar files:

- **Character-level comparison** for exact matches
- **Directory proximity scoring** for related locations
- **Confidence threshold** filtering (default: 70%)
- **Maximum suggestions** limit (default: 5)

## Recovery Configuration

### Command Line Options

| Option | Description |
|--------|-------------|
| `--auto` | Enable automatic recovery actions |
| `--verbose` | Show detailed logging |
| `--no-backups` | Disable backup creation |

### Programmatic Usage

```javascript
const { ErrorRecoverySystem } = require('./scripts/error-recovery');

const recovery = new ErrorRecoverySystem({
  autoRecovery: true,
  verbose: true,
  suggestionThreshold: 80,
  maxSuggestions: 3
});

await recovery.init();

try {
  // Your code that might error
  await riskyOperation();
} catch (error) {
  const enhanced = await recovery.recoverFromError(error, {
    operation: 'build',
    file: 'problematic-file.md'
  });
  
  console.log(enhanced.enhancedMessage.enhanced);
}
```

## Recovery Logs

All recovery actions are logged to `.recovery/` directory:

### Log Structure
```json
{
  "timestamp": "2025-06-17T14:30:45.123Z",
  "errors": [
    {
      "originalError": {
        "message": "File not found",
        "code": "ENOENT"
      },
      "enhancedMessage": {
        "enhanced": "Detailed error description...",
        "severity": "high"
      },
      "suggestions": [
        {
          "type": "file_suggestion",
          "action": "Use file: similar-file.md",
          "confidence": 85
        }
      ]
    }
  ],
  "recoveries": [
    {
      "action": "create_directory",
      "description": "Create missing directory",
      "result": "Directory created successfully",
      "success": true
    }
  ]
}
```

## Health Check

The system performs proactive health checks:

### Checked Items
- Required directories (`src/`, `scripts/`)
- Required files (`package.json`, `src/introduction/index.md`)
- Configuration file validity
- File permissions
- Dependency availability

### Example Health Check Output
```
🏥 Running system health check...
✅ Required directory 'src' found
✅ Required directory 'scripts' found  
✅ Required file 'package.json' found
⚠️  Required file 'src/introduction/index.md' not found

Enhanced Error Information:
File not found: 'src/introduction/index.md'

Did you mean one of these files?
  1. src/afterword/index.md (75% match)
  2. src/chapters/chapter01/index.md (60% match)

Automatic Recovery:
🔧 Executing recovery action: Create missing directory: src/introduction
✅ Recovery action completed: Directory src/introduction created
🔧 Executing recovery action: Create template markdown file
✅ Recovery action completed: Template file created
```

## Integration Examples

### GitHub Actions
```yaml
- name: Build with Recovery
  run: |
    npm run build || {
      npm run recover --auto
      npm run build
    }
    
- name: Upload Recovery Logs
  if: failure()
  uses: actions/upload-artifact@v3
  with:
    name: recovery-logs
    path: .recovery/
```

### NPM Scripts
```json
{
  "scripts": {
    "build:safe": "npm run build || npm run recover:auto",
    "dev:recover": "npm run recover && npm run preview",
    "validate:health": "npm run recover -- --verbose"
  }
}
```

### Error Handling Wrapper
```javascript
// scripts/safe-build.js
const { ErrorRecoverySystem } = require('./error-recovery');
const { spawn } = require('child_process');

async function safeBuild() {
  const recovery = new ErrorRecoverySystem({ autoRecovery: true });
  await recovery.init();
  
  try {
    // Attempt build
    await runBuild();
  } catch (error) {
    // Enhanced error handling
    await recovery.recoverFromError(error, { operation: 'build' });
    
    // Retry once after recovery
    try {
      await runBuild();
    } catch (retryError) {
      console.error('Build failed even after recovery');
      process.exit(1);
    }
  }
}
```

## Best Practices

1. **Enable Auto Recovery in Development**
   ```bash
   npm run recover:auto
   ```

2. **Use Verbose Mode for Debugging**
   ```bash
   npm run recover -- --verbose
   ```

3. **Check Recovery Logs After Failures**
   ```bash
   cat .recovery/recovery-log-*.json
   ```

4. **Integrate with Build Pipeline**
   ```bash
   npm run build || npm run recover
   ```

5. **Regular Health Checks**
   ```bash
   npm run recover  # Runs health check by default
   ```

## Troubleshooting

### Recovery System Won't Start
- Check Node.js version (requires Node 14+)
- Ensure write permissions to `.recovery/` directory
- Verify `scripts/` directory exists

### No Suggestions Generated
- Lower suggestion threshold: `--threshold=50`
- Increase max suggestions: `--max-suggestions=10`
- Check if similar files actually exist

### Auto Recovery Not Working
- Ensure `--auto` flag is used
- Check that recovery actions are marked as `auto: true`
- Verify file permissions for write operations

The error recovery system significantly improves the development experience by providing clear, actionable feedback and automated fixes for common issues.
