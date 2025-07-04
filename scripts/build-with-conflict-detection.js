#!/usr/bin/env node

/**
 * Jekyll競合対応付きビルドスクリプト
 * Book Publishing Template v3.1+ 対応
 */

const fs = require('fs-extra');
const path = require('path');
const { JekyllConflictDetector } = require('./jekyll-conflict-detector');

class ConflictAwareBuildSystem {
    constructor(options = {}) {
        this.options = {
            buildScript: options.buildScript || 'build-simple.js',
            conflictDetection: options.conflictDetection !== false, // デフォルト有効
            autoFix: options.autoFix !== false, // デフォルト有効
            backupOriginals: options.backupOriginals !== false,
            ...options
        };
        
        this.detector = new JekyllConflictDetector({
            autoFix: this.options.autoFix,
            verbose: this.options.verbose
        });
    }
    
    async build() {
        console.log('🔨 Jekyll競合対応ビルドシステム開始\n');
        
        try {
            // 1. 事前競合チェック
            if (this.options.conflictDetection) {
                await this.preProcessConflicts();
            }
            
            // 2. 通常のビルド実行
            await this.executeMainBuild();
            
            // 3. 事後チェック
            if (this.options.conflictDetection) {
                await this.postProcessValidation();
            }
            
            console.log('\n✅ ビルド完了');
            
        } catch (error) {
            console.error('\n❌ ビルドエラー:', error.message);
            
            // エラー時の自動復旧試行
            if (this.options.backupOriginals) {
                await this.attemptRecovery();
            }
            
            throw error;
        }
    }
    
    async preProcessConflicts() {
        console.log('📋 Step 1: Jekyll競合事前チェック');
        
        const srcPath = path.join(process.cwd(), 'src');
        const results = await this.detector.scanDirectory(srcPath);
        
        if (results.totalConflicts > 0) {
            console.log(`   ⚠️  ${results.totalConflicts}件の競合を検出`);
            
            if (this.options.autoFix) {
                console.log('   🔧 自動修正を適用中...');
                
                // バックアップ作成
                if (this.options.backupOriginals) {
                    await this.createBackup(srcPath);
                }
                
                // 修正適用
                const detector = new JekyllConflictDetector({ 
                    autoFix: true, 
                    dryRun: false 
                });
                await detector.scanDirectory(srcPath);
                
                console.log('   ✅ 自動修正完了');
            } else {
                console.log('   💡 --auto-fix オプションで自動修正可能');
            }
        } else {
            console.log('   ✅ Jekyll競合なし');
        }
    }
    
    async executeMainBuild() {
        console.log('📋 Step 2: メインビルド実行');
        
        const buildScriptPath = path.join(__dirname, this.options.buildScript);
        
        if (await fs.pathExists(buildScriptPath)) {
            // 既存のビルドスクリプトを実行
            const { spawn } = require('child_process');
            
            return new Promise((resolve, reject) => {
                const child = spawn('node', [buildScriptPath], {
                    stdio: 'inherit',
                    cwd: process.cwd()
                });
                
                child.on('close', (code) => {
                    if (code === 0) {
                        console.log('   ✅ メインビルド完了');
                        resolve();
                    } else {
                        reject(new Error(`ビルドスクリプトが終了コード ${code} で失敗`));
                    }
                });
                
                child.on('error', reject);
            });
        } else {
            throw new Error(`ビルドスクリプトが見つかりません: ${buildScriptPath}`);
        }
    }
    
    async postProcessValidation() {
        console.log('📋 Step 3: ビルド後検証');
        
        const docsPath = path.join(process.cwd(), 'docs');
        
        if (await fs.pathExists(docsPath)) {
            const results = await this.detector.scanDirectory(docsPath);
            
            if (results.totalConflicts > 0) {
                console.log(`   ⚠️  ビルド後のdocsディレクトリに${results.totalConflicts}件の競合残存`);
                
                // docs内の競合も修正
                const detector = new JekyllConflictDetector({ 
                    autoFix: true, 
                    dryRun: false 
                });
                await detector.scanDirectory(docsPath);
                console.log('   🔧 docs内の競合を修正');
            } else {
                console.log('   ✅ ビルド後検証完了');
            }
        } else {
            console.log('   ℹ️  docsディレクトリが存在しません');
        }
    }
    
    async createBackup(srcPath) {
        const backupPath = path.join(process.cwd(), '.backup-src');
        await fs.copy(srcPath, backupPath);
        console.log(`   💾 バックアップ作成: ${backupPath}`);
    }
    
    async attemptRecovery() {
        const backupPath = path.join(process.cwd(), '.backup-src');
        const srcPath = path.join(process.cwd(), 'src');
        
        if (await fs.pathExists(backupPath)) {
            console.log('🔄 バックアップからの復旧を試行中...');
            await fs.remove(srcPath);
            await fs.copy(backupPath, srcPath);
            console.log('✅ バックアップからの復旧完了');
        }
    }
}

// 設定ファイル読み込み
async function loadBuildConfig() {
    const configPath = path.join(process.cwd(), 'book-config.json');
    
    if (await fs.pathExists(configPath)) {
        const config = await fs.readJson(configPath);
        return config.buildOptions || {};
    }
    
    return {};
}

// CLI実行
async function main() {
    const args = process.argv.slice(2);
    const configOptions = await loadBuildConfig();
    
    const options = {
        ...configOptions,
        autoFix: args.includes('--auto-fix') || configOptions.autoFix,
        verbose: args.includes('--verbose') || configOptions.verbose,
        backupOriginals: !args.includes('--no-backup') && configOptions.backupOriginals !== false
    };
    
    const buildSystem = new ConflictAwareBuildSystem(options);
    await buildSystem.build();
}

if (require.main === module) {
    main().catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
}

module.exports = { ConflictAwareBuildSystem };