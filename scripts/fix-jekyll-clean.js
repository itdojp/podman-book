#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');

/**
 * Clean fix for Jekyll Liquid syntax errors
 * Escapes double curly braces in code blocks and inline code
 */

async function fixJekyllLiquid() {
    console.log('🔧 Fixing Jekyll Liquid syntax errors (clean version)...\n');
    
    const docsDir = path.join(__dirname, '..', 'docs');
    let fixedFiles = 0;
    
    // Process all markdown files
    async function processDirectory(dir) {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        
        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            
            if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
                await processDirectory(fullPath);
            } else if (entry.name.endsWith('.md')) {
                const fixed = await processMarkdownFile(fullPath);
                if (fixed) fixedFiles++;
            }
        }
    }
    
    async function processMarkdownFile(filePath) {
        let content = await fs.readFile(filePath, 'utf8');
        const originalContent = content;
        let fixCount = 0;
        
        // Escape double curly braces by replacing {{ with \{\{ and }} with \}\}
        // This approach is simpler and more reliable than using raw tags
        
        // Process code blocks (```...```)
        content = content.replace(/(```[^\n]*\n)([\s\S]*?)(\n```)/g, (match, start, code, end) => {
            if (code.includes('{{') || code.includes('}}')) {
                fixCount++;
                const escapedCode = code
                    .replace(/\{\{/g, '\\{\\{')
                    .replace(/\}\}/g, '\\}\\}');
                return start + escapedCode + end;
            }
            return match;
        });
        
        // Process inline code (`...`)
        content = content.replace(/`([^`]+)`/g, (match, code) => {
            if (code.includes('{{') || code.includes('}}')) {
                fixCount++;
                const escapedCode = code
                    .replace(/\{\{/g, '\\{\\{')
                    .replace(/\}\}/g, '\\}\\}');
                return '`' + escapedCode + '`';
            }
            return match;
        });
        
        if (content !== originalContent) {
            await fs.writeFile(filePath, content);
            console.log(`  ✓ Fixed ${fixCount} issues in: ${path.relative(docsDir, filePath)}`);
            return true;
        }
        return false;
    }
    
    await processDirectory(docsDir);
    
    console.log(`\n✅ Fixed Jekyll Liquid syntax in ${fixedFiles} files`);
}

// Run the fix
fixJekyllLiquid().catch(console.error);