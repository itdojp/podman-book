#!/usr/bin/env node

/**
 * GitHub Actions Workflow Configuration Script
 * 
 * 不要なワークフローを無効化して、ハングアップやエラーを防ぐ
 */

const fs = require('fs').promises;
const path = require('path');

async function configureWorkflows() {
  const workflowsDir = path.join(process.cwd(), '.github', 'workflows');
  
  try {
    await fs.access(workflowsDir);
  } catch {
    console.log('✅ .github/workflows ディレクトリが見つかりません - 設定は不要です');
    return;
  }
  
  const files = await fs.readdir(workflowsDir);
  const unnecessaryWorkflows = [
    'content-validation.yml',
    'quality-checks.yml',
    'build-with-cache.yml',
    'parallel-build-test.yml',
    'validate-secrets.yml',
    'publish.yml'
  ];
  
  let disabledCount = 0;
  
  for (const workflow of unnecessaryWorkflows) {
    const workflowPath = path.join(workflowsDir, workflow);
    const disabledPath = `${workflowPath}.disabled`;
    
    try {
      await fs.access(workflowPath);
      await fs.rename(workflowPath, disabledPath);
      console.log(`🔧 無効化: ${workflow}`);
      disabledCount++;
    } catch {
      // ファイルが存在しない場合はスキップ
    }
  }
  
  if (disabledCount > 0) {
    console.log(`\n✅ ${disabledCount}個のワークフローを無効化しました`);
    console.log('📝 推奨: 変更をコミットして不要なワークフロー実行を防止してください');
  } else {
    console.log('✅ 無効化が必要なワークフローは見つかりませんでした');
  }
  
  // 残っているワークフローを表示
  const remainingFiles = await fs.readdir(workflowsDir);
  const activeWorkflows = remainingFiles.filter(f => f.endsWith('.yml'));
  
  if (activeWorkflows.length > 0) {
    console.log('\n📋 有効なワークフロー:');
    activeWorkflows.forEach(w => console.log(`  - ${w}`));
  }
}

if (require.main === module) {
  configureWorkflows().catch(console.error);
}

module.exports = configureWorkflows;