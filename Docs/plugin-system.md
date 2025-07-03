# Plugin System Documentation

## Overview

The Book Publishing Template includes a powerful plugin system that allows you to extend and customize the build process. Plugins can modify content, add new features, and integrate with external tools.

## Quick Start

### Using Built-in Plugins

1. List available plugins:
   ```bash
   npm run plugin list
   ```

2. Enable a plugin:
   ```bash
   npm run plugin enable toc-generator
   ```

3. Build with plugins:
   ```bash
   npm run build:plugins
   ```

### Creating Custom Plugins

1. Create a new plugin template:
   ```bash
   npm run plugin create my-custom-plugin
   ```

2. Edit the plugin file in `plugins/my-custom-plugin/index.js`

3. Enable and test your plugin:
   ```bash
   npm run plugin enable my-custom-plugin
   npm run build:plugins
   ```

## Built-in Plugins

### TOC Generator
Automatically generates and updates table of contents with advanced features.

```json
{
  "plugins": [
    {
      "name": "toc-generator",
      "options": {
        "maxDepth": 3,
        "style": "detailed",
        "includeNumbers": true
      }
    }
  ]
}
```

### Syntax Highlighter
Enhanced syntax highlighting with themes and line numbers.

```json
{
  "plugins": [
    {
      "name": "syntax-highlighter",
      "options": {
        "theme": "github",
        "lineNumbers": true,
        "copyButton": true
      }
    }
  ]
}
```

### Math Renderer
Renders mathematical equations using KaTeX or MathJax.

```json
{
  "plugins": [
    {
      "name": "math-renderer",
      "options": {
        "engine": "katex",
        "throwOnError": false
      }
    }
  ]
}
```

## Plugin Architecture

### Plugin Structure

A plugin is a JavaScript module that exports an object with the following structure:

```javascript
module.exports = {
  // Required properties
  name: 'plugin-name',
  version: '1.0.0',
  
  // Optional properties
  description: 'What this plugin does',
  author: 'Your name',
  dependencies: ['other-plugin'],
  defaultOptions: {
    // Default configuration
  },
  
  // Hook implementations
  hooks: {
    beforeBuild: async (context) => {},
    processContent: async (content, context, metadata) => {},
    afterBuild: async (context) => {}
  }
};
```

### Available Hooks

#### Build Lifecycle Hooks

- **beforeBuild(context)**: Called before the build starts
- **afterBuild(context)**: Called after the build completes

#### Content Processing Hooks

- **beforeProcessFile(context, srcPath, destPath)**: Called before processing each file
- **processContent(content, context, metadata)**: Transform markdown content
- **afterProcessFile(context, srcPath, destPath)**: Called after processing each file

#### Asset Handling Hooks

- **processAsset(srcPath, destPath, context)**: Handle asset files

#### Table of Contents Hooks

- **beforeGenerateTOC(headings, context)**: Called before generating TOC
- **modifyTOC(headings, context)**: Modify TOC entries

#### Output Hooks

- **beforeWrite(content, destPath, context)**: Called before writing files
- **afterWrite(destPath, context)**: Called after writing files

### Plugin Context

The context object provided to hooks contains:

```javascript
{
  config: {},          // Build configuration
  srcDir: '',         // Source directory path
  publicDir: '',      // Output directory path
  api: {              // Plugin API
    readFile: async (path) => {},
    writeFile: async (path, content) => {},
    glob: async (pattern) => {},
    parseMarkdown: (content) => {},
    log: (message) => {},
    error: (message) => {}
  }
}
```

## Plugin Development

### Creating a Plugin

1. **Basic Plugin Template**:
   ```javascript
   module.exports = {
     name: 'my-plugin',
     version: '1.0.0',
     
     hooks: {
       processContent: async (content, context) => {
         // Your processing logic
         return modifiedContent;
       }
     }
   };
   ```

2. **Plugin with Options**:
   ```javascript
   module.exports = {
     name: 'my-plugin',
     version: '1.0.0',
     
     defaultOptions: {
       enabled: true,
       feature: 'default'
     },
     
     hooks: {
       processContent: async function(content, context) {
         if (!this.options.enabled) return content;
         
         // Use this.options to access configuration
         return processContent(content, this.options);
       }
     }
   };
   ```

### Best Practices

1. **Error Handling**: Always handle errors gracefully
   ```javascript
   try {
     // Plugin logic
   } catch (error) {
     context.api.error(`Plugin error: ${error.message}`);
     // Return original content on error
     return content;
   }
   ```

2. **Performance**: Avoid blocking operations
   ```javascript
   // Good: Async file operations
   const data = await context.api.readFile('data.json');
   
   // Bad: Synchronous operations
   const data = fs.readFileSync('data.json');
   ```

3. **Configuration**: Provide sensible defaults
   ```javascript
   defaultOptions: {
     feature: process.env.FEATURE || 'default',
     maxItems: 100,
     timeout: 5000
   }
   ```

## Plugin Configuration

### In book-config.json

```json
{
  "plugins": [
    // Simple enable
    "plugin-name",
    
    // With options
    {
      "name": "plugin-name",
      "options": {
        "setting": "value"
      }
    }
  ]
}
```

### Environment-specific Configuration

```json
{
  "plugins": process.env.NODE_ENV === 'production' ? [
    "minify-plugin",
    "optimize-images"
  ] : [
    "debug-plugin"
  ]
}
```

## Plugin Manager CLI

### Commands

```bash
# List all plugins
npm run plugin list

# Install/enable a plugin
npm run plugin install <name>

# Uninstall/disable a plugin
npm run plugin uninstall <name>

# Show plugin information
npm run plugin info <name>

# Validate all plugins
npm run plugin validate

# Create new plugin
npm run plugin create <name>
```

## Security Considerations

1. **Sandboxing**: Plugins run in a limited environment
2. **Module Access**: Only whitelisted modules are available
3. **File System**: Restricted to project directories
4. **Network**: No direct network access

## Troubleshooting

### Plugin Not Loading

1. Check plugin name matches exactly
2. Verify plugin exports correct structure
3. Check for syntax errors: `node -c plugins/plugin-name.js`

### Hook Not Executing

1. Verify hook name is correct
2. Ensure plugin is enabled in configuration
3. Check hook returns a value (for transform hooks)

### Performance Issues

1. Profile plugin execution time
2. Use async operations
3. Cache expensive computations

## Examples

### Content Filter Plugin

```javascript
module.exports = {
  name: 'content-filter',
  version: '1.0.0',
  
  defaultOptions: {
    words: ['todo', 'fixme', 'hack']
  },
  
  hooks: {
    processContent: async function(content, context) {
      const regex = new RegExp(
        `\\b(${this.options.words.join('|')})\\b`,
        'gi'
      );
      
      if (regex.test(content)) {
        context.api.log(`Found filtered words in ${context.currentFile}`);
      }
      
      return content.replace(regex, '[REDACTED]');
    }
  }
};
```

### Statistics Plugin

```javascript
module.exports = {
  name: 'build-stats',
  version: '1.0.0',
  
  hooks: {
    beforeBuild: async function(context) {
      this.stats = {
        files: 0,
        words: 0,
        startTime: Date.now()
      };
    },
    
    processContent: async function(content, context) {
      this.stats.files++;
      this.stats.words += content.split(/\s+/).length;
      return content;
    },
    
    afterBuild: async function(context) {
      const duration = Date.now() - this.stats.startTime;
      
      await context.api.writeFile(
        'build-stats.json',
        JSON.stringify({
          ...this.stats,
          duration,
          timestamp: new Date().toISOString()
        }, null, 2)
      );
      
      context.api.log(`Build stats: ${this.stats.files} files, ${this.stats.words} words in ${duration}ms`);
    }
  }
};
```