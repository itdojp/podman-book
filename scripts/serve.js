#!/usr/bin/env node

const express = require('express');
const path = require('path');
const chokidar = require('chokidar');
const StaticSiteBuilder = require('./build');

class DevServer {
  constructor() {
    this.port = process.env.PORT || 4000;
    this.app = express();
    this.builder = new StaticSiteBuilder();
    this.isBuilding = false;
  }

  async start() {
    console.log('🚀 Starting development server...');
    
    // Initial build
    await this.build();
    
    // Setup static file serving
    this.app.use(express.static(this.builder.outputDir));
    
    // Setup file watching if --watch flag is provided
    if (process.argv.includes('--watch')) {
      this.setupFileWatcher();
    }
    
    // Start server
    this.app.listen(this.port, () => {
      console.log(`✅ Development server running at http://localhost:${this.port}`);
      console.log(`📁 Serving from: ${this.builder.outputDir}`);
      
      if (process.argv.includes('--watch')) {
        console.log('👁️  Watching for file changes...');
      }
    });
  }

  async build() {
    if (this.isBuilding) return;
    
    this.isBuilding = true;
    console.log('🔨 Rebuilding...');
    
    try {
      await this.builder.build();
      console.log('✅ Rebuild completed');
    } catch (error) {
      console.error('❌ Rebuild failed:', error);
    } finally {
      this.isBuilding = false;
    }
  }

  setupFileWatcher() {
    const watcher = chokidar.watch([
      'docs/**/*.md',
      '_layouts/**/*.html',
      '_includes/**/*.html',
      'assets/**/*',
      '_config.yml'
    ], {
      ignored: ['node_modules/**', 'dist/**'],
      persistent: true
    });

    let timeout;
    watcher.on('change', (filePath) => {
      console.log(`📝 File changed: ${filePath}`);
      
      // Debounce rebuilds
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        this.build();
      }, 500);
    });

    watcher.on('add', (filePath) => {
      console.log(`📄 File added: ${filePath}`);
      this.build();
    });

    watcher.on('unlink', (filePath) => {
      console.log(`🗑️  File deleted: ${filePath}`);
      this.build();
    });
  }
}

// Run the dev server
if (require.main === module) {
  const server = new DevServer();
  server.start().catch(error => {
    console.error('❌ Server failed to start:', error);
    process.exit(1);
  });
}

module.exports = DevServer;