#!/usr/bin/env node

/**
 * 📚 Easy Setup for Legacy Template
 * 
 * 既存テンプレート向けの軽量セットアップスクリプト
 * 既存の複雑な構成に最小限の変更で改善を提供
 */

const fs = require('fs').promises;
const path = require('path');
const readline = require('readline');

class LegacyEasySetup {
  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    this.config = {};
  }

  async ask(question) {
    return new Promise((resolve) => {
      this.rl.question(question, resolve);
    });
  }

  log(message, type = 'info') {
    const prefix = {
      info: '📝',
      success: '✅',
      warning: '⚠️',
      error: '❌'
    };
    console.log(`${prefix[type]} ${message}`);
  }

  async main() {
    console.clear();
    console.log('📚 Book Publishing Template - Quick Setup');
    console.log('=========================================\n');
    
    this.log('既存テンプレートの設定を簡単にします...');

    try {
      await this.gatherBasicInfo();
      await this.updateBookConfig();
      await this.createSimpleCommands();
      await this.showNextSteps();
    } catch (error) {
      this.log(`セットアップエラー: ${error.message}`, 'error');
    } finally {
      this.rl.close();
    }
  }

  async gatherBasicInfo() {
    this.log('基本情報を入力してください:');
    
    this.config.title = await this.ask('📖 書籍タイトル: ');
    this.config.author = await this.ask('👤 著者名: ');
    this.config.githubUser = await this.ask('🐙 GitHubユーザー名: ');
    this.config.description = await this.ask('📝 書籍の説明: ');
    
    const suggestedRepo = this.config.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    
    const defaultPublicRepo = `${suggestedRepo}-public`;
    this.config.publicRepo = await this.ask(`📂 パブリックリポジトリ名 [${defaultPublicRepo}]: `) || defaultPublicRepo;
    
    console.log('\n✅ 基本情報を収集しました\n');
  }

  async updateBookConfig() {
    this.log('book-config.jsonを更新中...');
    
    try {
      // 既存のbook-config.jsonを読み込み
      const configPath = 'book-config.json';
      let existingConfig = {};
      
      try {
        const configContent = await fs.readFile(configPath, 'utf-8');
        existingConfig = JSON.parse(configContent);
      } catch {
        // ファイルが存在しない場合は新規作成
      }

      // 基本情報を更新
      const updatedConfig = {
        ...existingConfig,
        book: {
          ...existingConfig.book,
          title: this.config.title,
          author: {
            name: this.config.author,
            github: this.config.githubUser
          },
          description: this.config.description
        },
        deployment: {
          ...existingConfig.deployment,
          publicRepoUrl: `https://github.com/${this.config.githubUser}/${this.config.publicRepo}`
        }
      };

      await fs.writeFile(configPath, JSON.stringify(updatedConfig, null, 2));
      this.log('book-config.json を更新しました', 'success');
      
    } catch (error) {
      this.log('設定ファイルの更新に失敗しました', 'warning');
      this.log('手動で book-config.json を編集してください', 'warning');
    }
  }

  async createSimpleCommands() {
    this.log('簡単コマンドを作成中...');
    
    try {
      // package.jsonにシンプルなコマンドを追加
      const packagePath = 'package.json';
      const packageContent = await fs.readFile(packagePath, 'utf-8');
      const packageJson = JSON.parse(packageContent);
      
      // 既存のscriptsに追加（上書きしない）
      packageJson.scripts = {
        ...packageJson.scripts,
        "setup:quick": "node easy-setup-legacy.js",
        "start": "npm run build && npm run preview",
        "help": "echo 'Available commands:\\n  npm start - Build and preview\\n  npm run deploy - Deploy to GitHub Pages\\n  npm run setup:quick - Run this setup again'"
      };

      await fs.writeFile(packagePath, JSON.stringify(packageJson, null, 2));
      this.log('package.json にクイックコマンドを追加しました', 'success');
      
    } catch (error) {
      this.log('package.json の更新をスキップしました', 'warning');
    }
  }

  async showNextSteps() {
    console.log('\n🎉 セットアップ完了!\n');
    console.log('📋 次のステップ:');
    console.log(`1. パブリックリポジトリを作成: ${this.config.publicRepo}`);
    console.log('2. Personal Access Token を作成');
    console.log('3. Repository Secrets に DEPLOY_TOKEN を設定');
    console.log('4. npm run build でテストビルド');
    console.log('5. npm run deploy でデプロイ');
    
    console.log('\n🚀 クイックコマンド:');
    console.log('  npm start      # ビルド＆プレビュー');
    console.log('  npm run help   # ヘルプ表示');
    
    console.log('\n💡 より使いやすいv2.0テンプレートも利用可能です:');
    console.log('  https://github.com/itdojp/book-publishing-template2');
    
    console.log('\nHappy Writing! 📚✨');
  }
}

// Execute setup
if (require.main === module) {
  const setup = new LegacyEasySetup();
  setup.main().catch(console.error);
}

module.exports = LegacyEasySetup;