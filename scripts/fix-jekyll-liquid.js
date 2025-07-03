#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');

/**
 * Fix Jekyll Liquid syntax errors in markdown files
 * Wraps code blocks containing {{ }} with {% raw %} tags
 */

async function fixJekyllLiquid() {
    console.log('🔧 Fixing Jekyll Liquid syntax errors...\n');
    
    const docsDir = path.join(__dirname, '..', 'docs');
    let fixedCount = 0;
    
    // Process all markdown files
    async function processDirectory(dir) {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        
        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            
            if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
                await processDirectory(fullPath);
            } else if (entry.name.endsWith('.md')) {
                await processMarkdownFile(fullPath);
            }
        }
    }
    
    async function processMarkdownFile(filePath) {
        let content = await fs.readFile(filePath, 'utf8');
        const originalContent = content;
        
        // Fix inline code with double curly braces
        // Match `...{{...}}...` but not already wrapped in raw tags
        content = content.replace(/`([^`]*\{\{[^`]*\}\}[^`]*)`/g, (match, code) => {
            if (!match.includes('{% raw %}')) {
                fixedCount++;
                return '{% raw %}`' + code + '`{% endraw %}';
            }
            return match;
        });
        
        // Fix code blocks with double curly braces
        // Match ```...{{...}}...``` blocks
        content = content.replace(/```(\w*)\n([\s\S]*?\{\{[\s\S]*?\}\}[\s\S]*?)```/g, (match, lang, code) => {
            if (!match.includes('{% raw %}')) {
                fixedCount++;
                return '```' + lang + '\n{% raw %}\n' + code + '{% endraw %}\n```';
            }
            return match;
        });
        
        // Special fix for malformed braces in chapter 10
        // Fix patterns like {{app=" without closing }}
        content = content.replace(/\{\{app="([^}]*)"(?!\}\})/g, '{{app="$1"}}');
        content = content.replace(/\{\{version="([^}]*)"(?!\}\})/g, '{{version="$1"}}');
        
        if (content !== originalContent) {
            await fs.writeFile(filePath, content);
            console.log(`  ✓ Fixed: ${path.relative(docsDir, filePath)}`);
        }
    }
    
    await processDirectory(docsDir);
    
    console.log(`\n✅ Fixed ${fixedCount} Jekyll Liquid syntax issues`);
}

// Run the fix
fixJekyllLiquid().catch(console.error);