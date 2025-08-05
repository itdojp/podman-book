#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');
const MarkdownIt = require('markdown-it');
const fm = require('front-matter');

const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
});

class StaticSiteBuilder {
  constructor() {
    this.sourceDir = path.join(process.cwd(), 'docs');
    this.outputDir = path.join(process.cwd(), 'dist');
    this.templateDir = path.join(process.cwd(), '_layouts');
    this.includesDir = path.join(process.cwd(), '_includes');
    this.assetsDir = path.join(process.cwd(), 'assets');
    this.config = this.loadConfig();
  }

  loadConfig() {
    const configPath = path.join(process.cwd(), '_config.yml');
    // For now, use basic config - in full implementation would parse YAML
    return {
      title: 'Podman完全ガイド',
      description: 'コンテナ技術の理論と実践 - エンタープライズ環境でのPodman活用法',
      url: 'https://itdojp.github.io',
      baseurl: '/podman-book',
      author: '株式会社アイティードゥ'
    };
  }

  async build() {
    console.log('🔨 Building static site...');
    
    // Clean output directory
    await fs.emptyDir(this.outputDir);
    
    // Copy assets
    if (await fs.pathExists(this.assetsDir)) {
      await fs.copy(this.assetsDir, path.join(this.outputDir, 'assets'));
      console.log('✅ Assets copied');
    }

    // Process markdown files
    await this.processMarkdownFiles();
    
    // Copy additional static files
    await this.copyStaticFiles();
    
    console.log('✅ Build completed successfully');
    console.log(`📁 Output directory: ${this.outputDir}`);
  }

  async processMarkdownFiles() {
    const files = await this.findMarkdownFiles(this.sourceDir);
    
    for (const file of files) {
      await this.processMarkdownFile(file);
    }
    
    console.log(`✅ Processed ${files.length} markdown files`);
  }

  async findMarkdownFiles(dir) {
    const files = [];
    
    if (!await fs.pathExists(dir)) {
      return files;
    }
    
    const items = await fs.readdir(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = await fs.stat(fullPath);
      
      if (stat.isDirectory()) {
        files.push(...await this.findMarkdownFiles(fullPath));
      } else if (item.endsWith('.md')) {
        files.push(fullPath);
      }
    }
    
    return files;
  }

  async processMarkdownFile(filePath) {
    const content = await fs.readFile(filePath, 'utf8');
    const parsed = fm(content);
    
    // Convert markdown to HTML
    const htmlContent = md.render(parsed.body);
    
    // Apply layout
    const html = await this.applyLayout(htmlContent, parsed.attributes, filePath);
    
    // Determine output path
    const outputPath = this.getOutputPath(filePath);
    
    // Ensure output directory exists
    await fs.ensureDir(path.dirname(outputPath));
    
    // Write HTML file
    await fs.writeFile(outputPath, html);
  }

  getOutputPath(inputPath) {
    let relativePath = path.relative(this.sourceDir, inputPath);
    
    // Convert .md to .html
    relativePath = relativePath.replace(/\.md$/, '.html');
    
    // Handle index files
    if (path.basename(relativePath) === 'index.html') {
      return path.join(this.outputDir, relativePath);
    } else {
      // Convert filename.html to filename/index.html
      const dir = path.dirname(relativePath);
      const name = path.basename(relativePath, '.html');
      return path.join(this.outputDir, dir, name, 'index.html');
    }
  }

  async applyLayout(content, frontMatter, filePath) {
    const layout = frontMatter.layout || 'default';
    const layoutPath = path.join(this.templateDir, `${layout}.html`);
    
    let template = `<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${frontMatter.title || this.config.title}</title>
    <meta name="description" content="${frontMatter.description || this.config.description}">
    <link rel="stylesheet" href="${this.config.baseurl}/assets/css/main.css">
    <link rel="stylesheet" href="${this.config.baseurl}/assets/css/syntax-highlighting.css">
    <link rel="stylesheet" href="${this.config.baseurl}/assets/css/search.css">
</head>
<body>
    <div class="book-layout">
        <header class="book-header">
            <div class="header-left">
                <label for="sidebar-toggle-checkbox" class="sidebar-toggle">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="3" y1="6" x2="21" y2="6"></line>
                        <line x1="3" y1="12" x2="21" y2="12"></line>
                        <line x1="3" y1="18" x2="21" y2="18"></line>
                    </svg>
                </label>
                <a href="${this.config.baseurl}/" class="header-title">
                    <h1>${this.config.title}</h1>
                </a>
            </div>
            <div class="header-right">
                <div class="search-container">
                    <input type="search" placeholder="Search..." class="search-input" id="search-input">
                    <div class="search-results" id="search-results"></div>
                </div>
                <button class="theme-toggle">
                    <svg class="theme-icon theme-icon-light" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="5"></circle>
                        <line x1="12" y1="1" x2="12" y2="3"></line>
                        <line x1="12" y1="21" x2="12" y2="23"></line>
                        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                        <line x1="1" y1="12" x2="3" y2="12"></line>
                        <line x1="21" y1="12" x2="23" y2="12"></line>
                        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                    </svg>
                    <svg class="theme-icon theme-icon-dark" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                    </svg>
                </button>
                <a href="https://github.com/itdojp/podman-book" class="github-link" target="_blank">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                    </svg>
                </a>
            </div>
        </header>
        
        <input type="checkbox" id="sidebar-toggle-checkbox" class="sidebar-toggle-checkbox">
        
        <aside class="book-sidebar">
            <nav class="sidebar-nav">
                <!-- Sidebar navigation will be included here -->
            </nav>
        </aside>
        
        <main class="book-main">
            <div class="book-content">
                <article class="page-content">
                    ${content}
                </article>
            </div>
        </main>
    </div>
    
    <label for="sidebar-toggle-checkbox" class="book-sidebar-overlay"></label>
    
    <script src="${this.config.baseurl}/assets/js/theme.js"></script>
    <script src="${this.config.baseurl}/assets/js/search.js"></script>
    
    <style>
    .sidebar-toggle-checkbox {
        display: none;
        position: absolute;
        opacity: 0;
        pointer-events: none;
    }
    
    @media (max-width: 767px) {
        .sidebar-toggle {
            display: flex !important;
        }
        
        .sidebar-toggle-checkbox:checked ~ .book-layout .book-sidebar {
            transform: translateX(0) !important;
        }
        
        .sidebar-toggle-checkbox:checked ~ .book-sidebar-overlay {
            opacity: 1 !important;
            visibility: visible !important;
        }
    }
    </style>
</body>
</html>`;

    if (await fs.pathExists(layoutPath)) {
      try {
        template = await fs.readFile(layoutPath, 'utf8');
        // Simple template replacement - in full implementation would use proper templating
        template = template.replace(/\{\{\s*content\s*\}\}/g, content);
        template = template.replace(/\{\{\s*page\.title\s*\}\}/g, frontMatter.title || '');
      } catch (error) {
        console.warn(`Warning: Could not read layout ${layout}, using default`);
      }
    }
    
    return template;
  }

  async copyStaticFiles() {
    // Copy any additional static files like CNAME, robots.txt, etc.
    const staticFiles = ['CNAME', 'robots.txt', '.nojekyll'];
    
    for (const file of staticFiles) {
      const sourcePath = path.join(process.cwd(), file);
      if (await fs.pathExists(sourcePath)) {
        await fs.copy(sourcePath, path.join(this.outputDir, file));
      }
    }
  }
}

// Run the build
if (require.main === module) {
  const builder = new StaticSiteBuilder();
  builder.build().catch(error => {
    console.error('❌ Build failed:', error);
    process.exit(1);
  });
}

module.exports = StaticSiteBuilder;