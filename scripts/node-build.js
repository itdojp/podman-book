#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');

async function copyDirectory(src, dest) {
  try {
    await fs.mkdir(dest, { recursive: true });
    const entries = await fs.readdir(src, { withFileTypes: true });
    
    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);
      
      if (entry.isDirectory()) {
        await copyDirectory(srcPath, destPath);
      } else {
        await fs.copyFile(srcPath, destPath);
      }
    }
  } catch (error) {
    console.error(`Error copying ${src} to ${dest}:`, error);
  }
}

async function simpleBuild() {
  console.log('🔨 Building Podman Book (Node.js only)...');
  
  const sourceDir = path.join(process.cwd(), 'docs');
  const outputDir = path.join(process.cwd(), 'dist');
  
  try {
    // Clean output directory
    try {
      await fs.rm(outputDir, { recursive: true, force: true });
    } catch (e) {
      // Directory might not exist, that's ok
    }
    
    // Copy docs directory to dist
    await copyDirectory(sourceDir, outputDir);
    
    // Copy assets if they exist
    const assetsDir = path.join(process.cwd(), 'assets');
    try {
      await fs.access(assetsDir);
      await copyDirectory(assetsDir, path.join(outputDir, 'assets'));
    } catch (e) {
      console.log('No assets directory found, skipping...');
    }
    
    console.log('✅ Build completed successfully');
    console.log(`📁 Output directory: ${outputDir}`);
    
  } catch (error) {
    console.error('❌ Build failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  simpleBuild();
}

module.exports = simpleBuild;