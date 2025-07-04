#!/usr/bin/env node

/**
 * Jekyll Liquid Conflict Detector & Auto-Fixer
 * 
 * 技術書で頻出するコンテナ構文などとJekyll Liquidの競合を自動検出・修正
 */

const fs = require('fs-extra');
const path = require('path');

class JekyllConflictDetector {
    constructor(options = {}) {
        this.options = {
            autoFix: options.autoFix || false,
            verbose: options.verbose || false,
            dryRun: options.dryRun || false,
            ...options
        };
        
        // 競合パターンの定義
        this.conflictPatterns = [
            {
                name: 'Container Format Strings',
                description: 'Podman/Docker format strings like {{.Container}}',
                pattern: /\{\{\.[\w\.]+\}\}/g,
                examples: ['{{.Container}}', '{{.Names}}', '{{.Status}}'],
                category: 'container'
            },
            {
                name: 'Prometheus Query',
                description: 'Prometheus query syntax with labels',
                pattern: /\{\{[^}]*app="[^"]*"[^}]*\}\}/g,
                examples: ['{{app="myapp",version="1.0"}}'],
                category: 'monitoring'
            },
            {
                name: 'Template Variables',
                description: 'Generic template variables',
                pattern: /\{\{[A-Z_][A-Z0-9_]*\}\}/g,
                examples: ['{{BOOK_TITLE}}', '{{VERSION}}'],
                category: 'template'
            },
            {
                name: 'Kubernetes Templates',
                description: 'Kubernetes manifest template syntax',
                pattern: /\{\{\s*\.Values\.[^}]+\}\}/g,
                examples: ['{{ .Values.image.tag }}'],
                category: 'kubernetes'
            }
        ];
        
        // GitHub Actions構文は除外（${{ }}は問題なし）
        this.safePatterns = [
            /\$\{\{[^}]*\}\}/g  // GitHub Actions: ${{ secrets.TOKEN }}
        ];
    }
    
    async scanDirectory(dirPath) {
        const results = {
            totalFiles: 0,
            conflictFiles: 0,
            totalConflicts: 0,
            conflictsByCategory: {},
            files: []
        };
        
        await this._scanRecursive(dirPath, results);
        return results;
    }
    
    async _scanRecursive(dirPath, results) {
        const entries = await fs.readdir(dirPath, { withFileTypes: true });
        
        for (const entry of entries) {
            const fullPath = path.join(dirPath, entry.name);
            
            if (entry.isDirectory() && !this._shouldSkipDirectory(entry.name)) {
                await this._scanRecursive(fullPath, results);
            } else if (entry.name.endsWith('.md')) {
                await this._scanFile(fullPath, results);
            }
        }
    }
    
    async _scanFile(filePath, results) {
        const content = await fs.readFile(filePath, 'utf8');
        const conflicts = this._detectConflicts(content);
        
        results.totalFiles++;
        
        if (conflicts.length > 0) {
            results.conflictFiles++;
            results.totalConflicts += conflicts.length;
            
            const fileResult = {
                path: filePath,
                conflicts: conflicts,
                fixed: false
            };
            
            // カテゴリ別集計
            conflicts.forEach(conflict => {
                const category = conflict.pattern.category;
                results.conflictsByCategory[category] = 
                    (results.conflictsByCategory[category] || 0) + 1;
            });
            
            // 自動修正
            if (this.options.autoFix && !this.options.dryRun) {
                const fixedContent = this._applyFixes(content, conflicts);
                await fs.writeFile(filePath, fixedContent);
                fileResult.fixed = true;
            }
            
            results.files.push(fileResult);
        }
    }
    
    _detectConflicts(content) {
        const conflicts = [];
        
        // まず安全なパターンをマスク
        let maskedContent = content;
        const masks = [];
        this.safePatterns.forEach(pattern => {
            maskedContent = maskedContent.replace(pattern, (match) => {
                const maskId = `__SAFE_${masks.length}__`;
                masks.push({ id: maskId, content: match });
                return maskId;
            });
        });
        
        // 競合パターンを検出
        this.conflictPatterns.forEach(pattern => {
            const matches = [...maskedContent.matchAll(pattern.pattern)];
            matches.forEach(match => {
                conflicts.push({
                    pattern: pattern,
                    match: match[0],
                    index: match.index,
                    line: this._getLineNumber(content, match.index)
                });
            });
        });
        
        return conflicts;
    }
    
    _applyFixes(content, conflicts) {
        let fixedContent = content;
        
        // 後ろから修正して位置がずれないようにする
        const sortedConflicts = conflicts.sort((a, b) => b.index - a.index);
        
        sortedConflicts.forEach(conflict => {
            const original = conflict.match;
            const escaped = this._escapeForJekyll(original);
            
            fixedContent = 
                fixedContent.substring(0, conflict.index) + 
                escaped + 
                fixedContent.substring(conflict.index + original.length);
        });
        
        return fixedContent;
    }
    
    _escapeForJekyll(text) {
        // {{ }} を \{\{ \}\} にエスケープ
        return text.replace(/\{\{/g, '\\{\\{').replace(/\}\}/g, '\\}\\}');
    }
    
    _getLineNumber(content, index) {
        return content.substring(0, index).split('\n').length;
    }
    
    _shouldSkipDirectory(dirname) {
        const skipDirs = ['node_modules', '.git', '.github', 'dist', 'build'];
        return skipDirs.includes(dirname) || dirname.startsWith('.');
    }
    
    generateReport(results) {
        const report = {
            summary: this._generateSummary(results),
            recommendations: this._generateRecommendations(results),
            details: results
        };
        
        return report;
    }
    
    _generateSummary(results) {
        return {
            totalFiles: results.totalFiles,
            conflictFiles: results.conflictFiles,
            conflictRate: `${((results.conflictFiles / results.totalFiles) * 100).toFixed(1)}%`,
            totalConflicts: results.totalConflicts,
            categoriesAffected: Object.keys(results.conflictsByCategory).length,
            topCategory: this._getTopCategory(results.conflictsByCategory)
        };
    }
    
    _generateRecommendations(results) {
        const recommendations = [];
        
        if (results.conflictsByCategory.container > 10) {
            recommendations.push({
                type: 'high',
                message: 'この書籍は大量のコンテナ構文を含みます。ビルドプロセスに自動エスケープを組み込むことを強く推奨します。'
            });
        }
        
        if (results.conflictsByCategory.template > 0) {
            recommendations.push({
                type: 'medium',
                message: 'テンプレート変数が検出されました。書籍設定でのプレースホルダー置換を確認してください。'
            });
        }
        
        if (results.totalConflicts > 50) {
            recommendations.push({
                type: 'high',
                message: '大量の競合が検出されました。手動修正の代わりに自動修正ツールの使用を推奨します。'
            });
        }
        
        return recommendations;
    }
    
    _getTopCategory(categories) {
        let topCategory = null;
        let maxCount = 0;
        
        Object.entries(categories).forEach(([category, count]) => {
            if (count > maxCount) {
                maxCount = count;
                topCategory = category;
            }
        });
        
        return { category: topCategory, count: maxCount };
    }
}

// CLI実行部分
async function main() {
    const args = process.argv.slice(2);
    const options = {
        autoFix: args.includes('--fix'),
        verbose: args.includes('--verbose'),
        dryRun: args.includes('--dry-run')
    };
    
    const detector = new JekyllConflictDetector(options);
    const scanPath = args.find(arg => !arg.startsWith('--')) || './src';
    
    console.log('🔍 Jekyll Liquid競合検出ツール');
    console.log(`📁 スキャン対象: ${scanPath}`);
    console.log(`⚙️  オプション: ${JSON.stringify(options)}\n`);
    
    try {
        const results = await detector.scanDirectory(scanPath);
        const report = detector.generateReport(results);
        
        // 結果表示
        console.log('📊 検出結果サマリー:');
        console.log(`   ファイル数: ${report.summary.totalFiles}`);
        console.log(`   競合ファイル: ${report.summary.conflictFiles} (${report.summary.conflictRate})`);
        console.log(`   競合総数: ${report.summary.totalConflicts}`);
        
        if (report.summary.topCategory.category) {
            console.log(`   主要カテゴリ: ${report.summary.topCategory.category} (${report.summary.topCategory.count}件)`);
        }
        
        // カテゴリ別詳細
        if (Object.keys(results.conflictsByCategory).length > 0) {
            console.log('\n📈 カテゴリ別内訳:');
            Object.entries(results.conflictsByCategory).forEach(([category, count]) => {
                console.log(`   ${category}: ${count}件`);
            });
        }
        
        // 推奨事項
        if (report.recommendations.length > 0) {
            console.log('\n💡 推奨事項:');
            report.recommendations.forEach(rec => {
                const icon = rec.type === 'high' ? '🚨' : '⚠️';
                console.log(`   ${icon} ${rec.message}`);
            });
        }
        
        // 詳細リスト（最初の10件のみ）
        if (results.files.length > 0) {
            console.log('\n📋 競合詳細 (最初の10件):');
            results.files.slice(0, 10).forEach(file => {
                console.log(`   📄 ${path.relative(process.cwd(), file.path)}`);
                file.conflicts.slice(0, 3).forEach(conflict => {
                    console.log(`      Line ${conflict.line}: ${conflict.match} (${conflict.pattern.name})`);
                });
                if (file.conflicts.length > 3) {
                    console.log(`      ... および${file.conflicts.length - 3}件の追加競合`);
                }
            });
        }
        
        if (options.autoFix && !options.dryRun) {
            console.log(`\n✅ ${results.conflictFiles}ファイルを自動修正しました`);
        } else if (options.dryRun) {
            console.log('\n🔍 ドライランモード: 実際の修正は行われませんでした');
        } else if (results.totalConflicts > 0) {
            console.log('\n💡 修正を適用するには --fix オプションを使用してください');
        }
        
    } catch (error) {
        console.error('❌ エラーが発生しました:', error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = { JekyllConflictDetector };