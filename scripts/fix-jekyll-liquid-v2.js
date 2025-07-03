#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');

/**
 * Fix Jekyll Liquid syntax errors in markdown files
 * Properly wraps code blocks containing {{ }} with {% raw %} tags
 */

async function fixJekyllLiquid() {
    console.log('🔧 Fixing Jekyll Liquid syntax errors (v2)...\n');
    
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
        
        // First, fix any malformed raw tags (from previous script)
        content = content.replace(/``{% raw %}`([^`]+)`{% endraw %}``/g, '```$1\n{% raw %}\n$1\n{% endraw %}\n```');
        
        // Fix code blocks with double curly braces
        // This regex matches code blocks that contain {{ or }} and aren't already wrapped
        const codeBlockRegex = /(```[^\n]*\n)([\s\S]*?)(\n```)/g;
        
        content = content.replace(codeBlockRegex, (match, start, code, end) => {
            // Check if the code contains {{ or }} and isn't already wrapped
            if ((code.includes('{{') || code.includes('}}')) && !code.includes('{% raw %}')) {
                fixedCount++;
                return start + '{% raw %}\n' + code + '\n{% endraw %}' + end;
            }
            return match;
        });
        
        // Fix inline code with double curly braces
        // Only wrap if not already wrapped
        const inlineCodeRegex = /`([^`]+)`/g;
        
        content = content.replace(inlineCodeRegex, (match, code) => {
            // Check if the code contains {{ or }} and the surrounding context doesn't have raw tags
            if ((code.includes('{{') || code.includes('}}')) && 
                !match.includes('{% raw %}') &&
                !content.substring(content.indexOf(match) - 10, content.indexOf(match)).includes('{% raw %}')) {
                fixedCount++;
                return '{% raw %}`' + code + '`{% endraw %}';
            }
            return match;
        });
        
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