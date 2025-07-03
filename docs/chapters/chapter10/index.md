---
title: "第10章 CI/CDパイプライン構築"
---

# 第10章 CI/CDパイプライン構築

### 本章の意義と学習目標

**なぜPodmanでCI/CDを構築する価値があるのか**

従来のDockerベースのCI/CDには、セキュリティとスケーラビリティの課題がありました：

1. **セキュリティ向上**: Docker-in-Docker不要、Rootless実行可能
2. **パイプライン効率化**: デーモンレスによる並列実行の向上
3. **Kubernetes準備**: 開発環境から本番まで一貫したワークフロー
4. **コスト削減**: ライセンスコスト不要、リソース効率向上

本章では、セキュアで効率的なCI/CDパイプラインの構築方法を学びます。

### 10.1 CI/CD概要とPodman統合

#### なぜPodmanがCI/CDに適しているのか

CI/CD環境は特に攻撃対象となりやすく、以下の要件が重要です：

- **最小権限での実行**: ビルドプロセスに不要な権限を与えない
- **環境の分離**: ビルド間の完全な分離
- **再現性**: 同じ結果を保証する決定論的なビルド
- **効率性**: 高速なビルドとデプロイ

#### 10.1.1 CI/CDパイプラインの構成要素

```
ソースコード → ビルド → テスト → イメージ作成 → レジストリ → デプロイ
     ↑                                                    ↓
     └──────────────── フィードバック ────────────────────┘
```

**Podmanの各段階での利点**

1. **ビルド段階**
   - Rootlessビルドによるセキュリティ
   - BuildahによるDockerfile不要のビルド
   - 並列ビルドの効率化

2. **テスト段階**
   - 分離された環境での安全なテスト実行
   - システムテストでのPod活用
   - リソース制限による安定性

3. **イメージ作成**
   - マルチアーキテクチャビルド
   - イメージ署名による信頼性
   - 最小権限でのプッシュ

4. **デプロイ段階**
   - Kubernetes YAMLの自動生成
   - systemd統合による確実なデプロイ
   - ロールバック機能

### 10.2 GitLab CI/CDとの統合

#### なぜGitLab Runnerの設定が重要なのか

RunnerはCI/CDの実行環境であり、セキュリティと効率の要です：

#### 10.2.1 GitLab Runner設定

```bash
# Podman対応GitLab Runner設定
cat > /etc/gitlab-runner/config.toml << EOF
[[runners]]
  name = "podman-runner"
  url = "https://gitlab.example.com"
  token = "REGISTRATION_TOKEN"
  executor = "docker"  # Dockerと互換性あり
  [runners.docker]
    tls_verify = false
    image = "alpine:latest"
    privileged = false      # 特権不要！（Dockerとの違い）
    disable_cache = false
    volumes = ["/cache"]
    runtime = "podman"      # Podmanランタイム使用
    helper_image = "gitlab/gitlab-runner-helper:x86_64-latest"
EOF

# なぜこの設定が優れているか：
# - privileged=false: セキュリティリスクの排除
# - Podmanランタイム: Rootless実行可能
# - キャッシュ有効: ビルド時間短縮
```

#### 10.2.2 .gitlab-ci.yml例

**実践的なパイプラインとその価値**

```yaml
# .gitlab-ci.yml
variables:
  CONTAINER_IMAGE: $CI_REGISTRY_IMAGE:$CI_COMMIT_SHORT_SHA
  CONTAINER_RELEASE: $CI_REGISTRY_IMAGE:latest

stages:
  - build
  - test
  - security
  - publish
  - deploy

before_script:
  - podman version
  - podman login -u $CI_REGISTRY_USER -p $CI_REGISTRY_PASSWORD $CI_REGISTRY

# ビルドステージ - なぜ効率的か
build:
  stage: build
  script:
    # キャッシュ活用で高速化
    - podman build 
        --cache-from $CONTAINER_RELEASE  # 前回のビルドを活用
        --tag $CONTAINER_IMAGE 
        --tag $CONTAINER_RELEASE 
        --file Containerfile .
    - podman push $CONTAINER_IMAGE
  artifacts:
    reports:
      container_scanning: gl-container-scanning-report.json

# テストステージ - 包括的な品質保証
test:unit:
  stage: test
  script:
    - podman run --rm $CONTAINER_IMAGE npm test
  coverage: '/Coverage: \d+\.\d+%/'  # カバレッジ自動取得

test:integration:
  stage: test
  services:
    - name: postgres:13
      alias: db
  variables:
    POSTGRES_DB: test
    POSTGRES_USER: test
    POSTGRES_PASSWORD: test
  script:
    # サービスコンテナとの統合テスト
    - podman run --rm 
        --network host  # CIでのサービス接続
        -e DATABASE_URL=postgresql://test:test@db/test 
        $CONTAINER_IMAGE 
        npm run test:integration

# セキュリティステージ - なぜ必須か
security:scan:
  stage: security
  script:
    # 脆弱性スキャン
    - podman run --rm 
        -v /var/run/podman/podman.sock:/var/run/docker.sock 
        aquasec/trivy image 
        --severity HIGH,CRITICAL 
        --exit-code 1  # 重大な脆弱性で失敗
        $CONTAINER_IMAGE
    # この段階でのブロックにより：
    # - 脆弱なイメージの本番投入を防止
    # - コンプライアンス要件の充足
    # - セキュリティインシデントの予防

security:secrets:
  stage: security
  script:
    # シークレットスキャン
    - podman run --rm 
        -v $(pwd):/src 
        trufflesecurity/trufflehog:latest 
        filesystem /src 
        --json 
        --fail  # シークレット検出で失敗
    # APIキーやパスワードの誤コミットを防止

# パブリッシュステージ - 信頼性の確保
publish:
  stage: publish
  only:
    - main  # mainブランチのみ
  script:
    - podman pull $CONTAINER_IMAGE
    - podman tag $CONTAINER_IMAGE $CONTAINER_RELEASE
    - podman push $CONTAINER_RELEASE
    # 署名付きプッシュ - なぜ重要か
    - podman push --sign-by $GPG_KEY_ID $CONTAINER_RELEASE
    # イメージの改ざん防止
    # 本番環境での信頼性保証

# デプロイステージ - 段階的なロールアウト
deploy:staging:
  stage: deploy
  environment:
    name: staging
    url: https://staging.example.com
  only:
    - main
  script:
    # ステージング環境へのデプロイ
    - |
      podman run --rm 
        -v $SSH_KEY:/root/.ssh/id_rsa:ro 
        -e HOST=$STAGING_HOST 
        alpine/ansible:latest 
        ansible-playbook -i $HOST, deploy.yml

deploy:production:
  stage: deploy
  environment:
    name: production
    url: https://example.com
  when: manual  # 手動承認
  only:
    - main
  script:
    # Blue-Greenデプロイメント
    - kubectl set image deployment/app app=$CONTAINER_RELEASE
    - kubectl rollout status deployment/app
    # 自動ロールバック機能付き
```

**このパイプラインが実現する価値**

1. **品質保証**: 自動テストによる欠陥の早期発見
2. **セキュリティ**: 脆弱性の自動検出とブロック
3. **効率性**: キャッシュとRootless実行による高速化
4. **信頼性**: 署名による改ざん防止
5. **安全性**: 段階的デプロイとロールバック

### 10.3 GitHub Actionsとの統合

#### なぜGitHub Actionsが人気なのか

GitHub Actionsは、以下の理由で多くの開発チームに選ばれています：

- **統合性**: コードと同じリポジトリでCI/CD管理
- **無料枠**: オープンソースプロジェクトは無料
- **マーケットプレイス**: 豊富な再利用可能アクション
- **セキュリティ**: GitHub のセキュリティ機能との統合

#### 10.3.1 GitHub Actions設定

**実践的なワークフローとその解説**

```yaml
# .github/workflows/ci-cd.yml
name: Build and Deploy

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: $\{\{ github.repository \}\}

jobs:
  build:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
      security-events: write  # セキュリティスキャン結果の書き込み
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
      
      - name: Set up Podman
        run: |
          # なぜPodmanを選ぶか：
          # - Dockerデーモン不要（GitHub Actionsでより安全）
          # - Rootless実行可能
          # - 同じDockerfileが使える
          sudo apt-get update
          sudo apt-get -y install podman
          podman version
      
      - name: Log in to Container Registry
        run: |
          # GitHub Container Registry使用の利点：
          # - GitHubとの完全統合
          # - きめ細かいアクセス制御
          # - パッケージとコードの紐付け
          echo "$\{\{ secrets.GITHUB_TOKEN \}\}" | podman login $\{\{ env.REGISTRY \}\} -u $\{\{ github.actor \}\} --password-stdin
      
      - name: Build image
        run: |
          # ビルドコンテキストの最適化
          # GitHub Actions特有の環境変数を活用
          podman build . \
            --file Containerfile \
            --tag $\{\{ env.IMAGE_NAME \}\}:$\{\{ github.sha \}\} \
            --build-arg BUILD_SHA=$\{\{ github.sha \}\} \
            --build-arg BUILD_DATE=$(date -u +%Y-%m-%dT%H:%M:%SZ)
      
      - name: Run tests
        run: |
          # コンテナ内でのテスト実行
          # なぜコンテナ内か：本番と同じ環境を保証
          podman run --rm $\{\{ env.IMAGE_NAME \}\}:$\{\{ github.sha \}\} npm test
      
      - name: Security scan with Trivy
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: $\{\{ env.IMAGE_NAME \}\}:$\{\{ github.sha \}\}
          format: 'sarif'  # GitHub Security タブ統合
          output: 'trivy-results.sarif'
      
      - name: Upload Trivy scan results
        uses: github/codeql-action/upload-sarif@v2
        with:
          sarif_file: 'trivy-results.sarif'
        # GitHub Security タブでの可視化
        # プルリクエストへの自動コメント
      
      - name: Push image
        if: github.event_name != 'pull_request'
        run: |
          # プルリクエストではプッシュしない（セキュリティ）
          podman tag $\{\{ env.IMAGE_NAME \}\}:$\{\{ github.sha \}\} $\{\{ env.REGISTRY \}\}/$\{\{ env.IMAGE_NAME \}\}:$\{\{ github.sha \}\}
          podman tag $\{\{ env.IMAGE_NAME \}\}:$\{\{ github.sha \}\} $\{\{ env.REGISTRY \}\}/$\{\{ env.IMAGE_NAME \}\}:latest
          podman push $\{\{ env.REGISTRY \}\}/$\{\{ env.IMAGE_NAME \}\}:$\{\{ github.sha \}\}
          podman push $\{\{ env.REGISTRY \}\}/$\{\{ env.IMAGE_NAME \}\}:latest

  deploy:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'  # mainブランチのみ
    
    steps:
      - name: Deploy to Kubernetes
        env:
          KUBE_CONFIG: $\{\{ secrets.KUBE_CONFIG \}\}
        run: |
          # Kubernetesへの安全なデプロイ
          echo "$KUBE_CONFIG" | base64 -d > kubeconfig
          export KUBECONFIG=kubeconfig
          
          # デプロイメントの更新
          kubectl set image deployment/app app=$\{\{ env.REGISTRY \}\}/$\{\{ env.IMAGE_NAME \}\}:$\{\{ github.sha \}\}
          
          # ロールアウト待機（タイムアウト付き）
          kubectl rollout status deployment/app --timeout=300s
```

**このワークフローが実現する価値**

1. **セキュリティファースト**
   - GITHUB_TOKENによる自動認証
   - セキュリティスキャン結果の可視化
   - プルリクエストでの自動チェック

2. **開発効率**
   - プルリクエストごとの自動ビルド・テスト
   - マージ前の問題検出
   - レビュープロセスの効率化

3. **透明性**
   - すべてのビルドログが公開（パブリックリポジトリ）
   - セキュリティ問題の早期発見
   - コミュニティからのフィードバック

### 10.4 Jenkinsとの統合

#### なぜ既存のJenkins環境でPodmanを使うのか

多くの企業では既にJenkinsが稼働しており、以下の理由でPodman統合が価値を生みます：

- **既存資産の活用**: Jenkins の豊富なプラグインエコシステム
- **セキュリティ強化**: Docker から Podman への段階的移行
- **スケーラビリティ**: エージェントでの Rootless 実行

#### 10.4.1 Jenkinsfile例

```groovy
// Jenkinsfile
pipeline {
    agent {
        label 'podman'  // Podman対応エージェント
    }
    
    environment {
        REGISTRY = 'registry.example.com'
        IMAGE_NAME = "${env.JOB_NAME}".toLowerCase()
        IMAGE_TAG = "${env.BUILD_NUMBER}"
        PODMAN_ARGS = '--storage-driver=vfs'  // Jenkins環境での安定性
    }
    
    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }
        
        stage('Build') {
            steps {
                script {
                    sh """
                        # なぜ storage-driver=vfs か：
                        # Jenkinsのワークスペース環境では
                        # overlayfsが使えない場合があるため
                        podman build ${PODMAN_ARGS} \
                            --tag ${REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG} \
                            --tag ${REGISTRY}/${IMAGE_NAME}:latest \
                            --file Containerfile .
                    """
                }
            }
        }
        
        stage('Test') {
            parallel {  // 並列実行で時間短縮
                stage('Unit Tests') {
                    steps {
                        sh """
                            podman run ${PODMAN_ARGS} --rm \
                                ${REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG} \
                                npm test
                        """
                    }
                }
                
                stage('Integration Tests') {
                    steps {
                        sh """
                            # docker-compose互換のpodman-compose使用
                            podman-compose -f docker-compose.test.yml up \
                                --abort-on-container-exit \
                                --exit-code-from app
                        """
                    }
                }
                
                stage('Security Scan') {
                    steps {
                        sh """
                            # Jenkinsでのセキュリティスキャン統合
                            podman run ${PODMAN_ARGS} --rm \
                                -v /var/run/podman/podman.sock:/var/run/docker.sock \
                                aquasec/trivy image \
                                --severity HIGH,CRITICAL \
                                ${REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG}
                        """
                    }
                }
            }
        }
        
        stage('Publish') {
            when {
                branch 'main'
            }
            steps {
                withCredentials([usernamePassword(
                    credentialsId: 'registry-creds',
                    usernameVariable: 'REGISTRY_USER',
                    passwordVariable: 'REGISTRY_PASS'
                )]) {
                    sh """
                        echo \$REGISTRY_PASS | podman login \
                            -u \$REGISTRY_USER \
                            --password-stdin \
                            ${REGISTRY}
                        
                        podman push ${REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG}
                        podman push ${REGISTRY}/${IMAGE_NAME}:latest
                    """
                }
            }
        }
        
        stage('Deploy') {
            when {
                branch 'main'
            }
            steps {
                script {
                    // 環境別デプロイメント
                    def environments = ['staging', 'production']
                    def deployments = environments.collectEntries { env ->
                        ["${env}" : {
                            stage("Deploy to ${env}") {
                                if (env == 'production') {
                                    input message: 'Deploy to production?'
                                }
                                
                                sh """
                                    ansible-playbook \
                                        -i inventory/${env} \
                                        -e image_tag=${IMAGE_TAG} \
                                        deploy.yml
                                """
                            }
                        }]
                    }
                    parallel deployments
                }
            }
        }
    }
    
    post {
        always {
            // クリーンアップ - なぜ重要か
            sh "podman system prune -f"
            // ディスク容量の枯渴防止
            // 次回ビルドの高速化
        }
        success {
            slackSend(
                color: 'good',
                message: "Build Successful: ${env.JOB_NAME} #${env.BUILD_NUMBER}"
            )
        }
        failure {
            slackSend(
                color: 'danger',
                message: "Build Failed: ${env.JOB_NAME} #${env.BUILD_NUMBER}"
            )
        }
    }
}
```

### 10.5 自動テスト戦略

#### なぜコンテナベースのテストが優れているのか

従来のテスト環境の問題：
- 環境依存による「開発環境では動いた」問題
- テスト環境の準備・クリーンアップの複雑さ
- 並列実行時の干渉

コンテナベーステストの解決策：
- 完全に隔離された環境
- 使い捨て可能な環境
- 本番と同一の環境

#### 10.5.1 テストコンテナパターン

```python
# test_with_containers.py
import pytest
import podman
from testcontainers.postgres import PostgresContainer
from testcontainers.redis import RedisContainer

@pytest.fixture(scope="session")
def postgres():
    """PostgreSQL テストコンテナ
    
    なぜテストコンテナを使うか：
    - 各テストで新しいDBインスタンス
    - スキーマ変更の影響を受けない
    - 並列テストが可能
    """
    with PostgresContainer("postgres:13") as postgres:
        yield postgres

@pytest.fixture(scope="session")
def redis():
    """Redis テストコンテナ"""
    with RedisContainer("redis:6-alpine") as redis:
        yield redis

def test_database_connection(postgres):
    """データベース接続テスト
    
    このアプローチの利点：
    - 実際のPostgreSQLを使用（モックではない）
    - 他のテストから完全に隔離
    - CI環境でも同じように動作
    """
    connection_url = postgres.get_connection_url()
    # 実際のデータベース操作
    assert connection_url is not None

def test_cache_operations(redis):
    """キャッシュ操作テスト"""
    redis_client = redis.get_client()
    redis_client.set("key", "value")
    assert redis_client.get("key") == b"value"

def test_full_stack_integration(postgres, redis):
    """フルスタック統合テスト
    
    複数のサービスを組み合わせたテスト
    本番環境と同じ構成を再現
    """
    # アプリケーションコンテナ起動
    app_container = podman.from_env().containers.run(
        "myapp:latest",
        environment={
            "DATABASE_URL": postgres.get_connection_url(),
            "REDIS_URL": f"redis://{redis.get_container_host_ip()}:{redis.get_exposed_port(6379)}"
        },
        detach=True
    )
    
    try:
        # テスト実行
        response = requests.get("http://localhost:8080/health")
        assert response.status_code == 200
    finally:
        app_container.stop()
        app_container.remove()
```

#### 10.5.2 E2Eテスト

**なぜE2Eテストが重要なのか**

単体テストでは検出できない、システム全体の統合問題を発見できます：
- API間の連携不具合
- パフォーマンス問題
- ユーザー視点での動作確認

```javascript
// e2e-test.js
const { chromium } = require('playwright');
const { GenericContainer } = require('testcontainers');

describe('E2E Tests', () => {
    let container;
    let browser;
    
    beforeAll(async () => {
        // アプリケーションコンテナ起動
        // なぜコンテナ化されたE2Eテストが優れているか：
        // - 環境依存なし
        // - 並列実行可能
        // - CI/CD環境での再現性
        container = await new GenericContainer('myapp:latest')
            .withExposedPorts(3000)
            .start();
        
        browser = await chromium.launch();
    });
    
    afterAll(async () => {
        await browser.close();
        await container.stop();
    });
    
    test('Homepage loads correctly', async () => {
        const page = await browser.newPage();
        const url = `http://localhost:${container.getMappedPort(3000)}`;
        
        await page.goto(url);
        const title = await page.title();
        
        expect(title).toBe('My Application');
    });
    
    test('User journey - complete purchase', async () => {
        // 実際のユーザー行動をシミュレート
        const page = await browser.newPage();
        const baseUrl = `http://localhost:${container.getMappedPort(3000)}`;
        
        // 1. 商品検索
        await page.goto(`${baseUrl}/products`);
        await page.fill('[data-testid="search"]', 'laptop');
        await page.click('[data-testid="search-button"]');
        
        // 2. 商品選択
        await page.click('[data-testid="product-1"]');
        await page.click('[data-testid="add-to-cart"]');
        
        // 3. チェックアウト
        await page.goto(`${baseUrl}/checkout`);
        await page.fill('[data-testid="email"]', 'test@example.com');
        await page.click('[data-testid="place-order"]');
        
        // 4. 確認
        await page.waitForSelector('[data-testid="order-confirmation"]');
        const confirmationText = await page.textContent('[data-testid="order-number"]');
        expect(confirmationText).toMatch(/ORDER-\d+/);
    });
});
```

### 10.6 デプロイメント戦略

#### なぜ高度なデプロイメント戦略が必要なのか

単純な「停止→更新→起動」では、以下の問題があります：
- サービス停止によるユーザー影響
- 問題発生時の復旧困難
- 段階的な検証不可

高度な戦略により、リスクを最小化しながら迅速なデプロイを実現します。

#### 10.6.1 Blue-Green Deployment

**Blue-Greenの価値**
- ゼロダウンタイムデプロイ
- 即座のロールバック可能
- 本番環境での検証

```bash
#!/bin/bash
# blue-green-deploy.sh

REGISTRY="registry.example.com"
APP_NAME="myapp"
NEW_VERSION=$1

# なぜ環境を色で識別するのか：
# - シンプルで理解しやすい
# - 人為的ミスの防止
# - 視覚的な状態管理

# 現在の環境を確認
CURRENT_ENV=$(podman ps --filter "label=app=$APP_NAME" --format "\{\{.Labels.environment\}\}")
if [ "$CURRENT_ENV" = "blue" ]; then
    NEW_ENV="green"
else
    NEW_ENV="blue"
fi

echo "Deploying to $NEW_ENV environment"

# 新環境にデプロイ
podman run -d \
    --name ${APP_NAME}-${NEW_ENV} \
    --label app=$APP_NAME \
    --label environment=$NEW_ENV \
    --label version=$NEW_VERSION \
    --network production \
    ${REGISTRY}/${APP_NAME}:${NEW_VERSION}

# ヘルスチェック - なぜ重要か
echo "Running health checks..."
for i in {1..30}; do
    if podman exec ${APP_NAME}-${NEW_ENV} curl -f http://localhost/health; then
        echo "Health check passed"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "Health check failed, aborting deployment"
        podman stop ${APP_NAME}-${NEW_ENV}
        podman rm ${APP_NAME}-${NEW_ENV}
        exit 1
    fi
    sleep 2
done

# スモークテスト - 基本機能の確認
echo "Running smoke tests..."
CONTAINER_IP=$(podman inspect ${APP_NAME}-${NEW_ENV} --format '\{\{.NetworkSettings.IPAddress\}\}')
./smoke-tests.sh $CONTAINER_IP || {
    echo "Smoke tests failed"
    podman stop ${APP_NAME}-${NEW_ENV}
    podman rm ${APP_NAME}-${NEW_ENV}
    exit 1
}

# トラフィック切り替え
echo "Switching traffic to $NEW_ENV"
# nginxの設定を更新してトラフィックを切り替え
podman exec nginx sed -i "s/${CURRENT_ENV}/${NEW_ENV}/g" /etc/nginx/conf.d/upstream.conf
podman exec nginx nginx -s reload

# 監視期間 - 問題の早期発見
echo "Monitoring new deployment for 60 seconds..."
sleep 60

# エラー率チェック
ERROR_RATE=$(curl -s http://localhost:9090/api/v1/query?query=rate\(http_requests_total\{status=~\"5..\"\}\[1m\]\) | jq '.data.result[0].value[1]' | tr -d '"')
if (( $(echo "$ERROR_RATE > 0.01" | bc -l) )); then
    echo "High error rate detected, rolling back"
    # ロールバック
    podman exec nginx sed -i "s/${NEW_ENV}/${CURRENT_ENV}/g" /etc/nginx/conf.d/upstream.conf
    podman exec nginx nginx -s reload
    podman stop ${APP_NAME}-${NEW_ENV}
    podman rm ${APP_NAME}-${NEW_ENV}
    exit 1
fi

# 旧環境を停止
echo "Stopping $CURRENT_ENV environment"
sleep 10  # 既存の接続が完了するまで待機
podman stop ${APP_NAME}-${CURRENT_ENV}
podman rm ${APP_NAME}-${CURRENT_ENV}

echo "Deployment completed successfully"
```

#### 10.6.2 Canary Deployment

**Canaryデプロイメントの価値**
- 段階的なリスク検証
- 実ユーザーでの検証
- 問題の影響範囲限定

```yaml
# canary-deployment.yml
apiVersion: v1
kind: Service
metadata:
  name: myapp-canary
spec:
  selector:
    app: myapp
    track: canary
  ports:
    - port: 80
      targetPort: 8080
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp-canary
spec:
  replicas: 1  # 最初は1レプリカのみ
  selector:
    matchLabels:
      app: myapp
      track: canary
  template:
    metadata:
      labels:
        app: myapp
        track: canary
    spec:
      containers:
      - name: app
        image: registry.example.com/myapp:canary
        ports:
        - containerPort: 8080
        # カナリー特有の設定
        env:
        - name: CANARY_DEPLOYMENT
          value: "true"
        - name: METRICS_ENABLED
          value: "true"  # 詳細なメトリクス収集
---
# Nginx設定で重み付けルーティング
apiVersion: v1
kind: ConfigMap
metadata:
  name: nginx-config
data:
  upstream.conf: |
    upstream myapp {
        # 90%のトラフィックは安定版へ
        server myapp-stable max_fails=3 fail_timeout=30s weight=9;
        # 10%のトラフィックはカナリー版へ
        server myapp-canary max_fails=3 fail_timeout=30s weight=1;
    }
```

**カナリーデプロイメントの自動化**

```python
# canary-controller.py
import time
import requests
from prometheus_client.parser import text_string_to_metric_families

class CanaryController:
    def __init__(self, prometheus_url, app_name):
        self.prometheus_url = prometheus_url
        self.app_name = app_name
        self.canary_weight = 0.1  # 初期は10%
        
    def get_error_rate(self, version):
        """エラー率を取得
        
        なぜエラー率を監視するか：
        - 最も直接的な品質指標
        - ユーザー影響の定量化
        - 自動判断の基準
        """
        query = f'rate(http_requests_total\{\{app="{self.app_name}",version="{version}",status=~"5.."\}\}[5m])'
        response = requests.get(f'{self.prometheus_url}/api/v1/query', params={'query': query})
        # ... パース処理
        
    def get_latency(self, version):
        """レイテンシを取得"""
        query = f'histogram_quantile(0.95, rate(http_request_duration_seconds_bucket\{\{app="{self.app_name}",version="{version}"\}\}[5m]))'
        # ... 
        
    def adjust_traffic(self, new_weight):
        """トラフィック配分を調整
        
        段階的な増加により：
        - 問題の早期発見
        - 影響範囲の制限
        - 安全な展開
        """
        # Nginxの設定を更新
        config = f"""
        upstream myapp \{\{
            server myapp-stable weight={int((1-new_weight)*10)};
            server myapp-canary weight={int(new_weight*10)};
        \}\}
        """
        # ... 設定適用
        
    def run_canary_deployment(self):
        """カナリーデプロイメントの実行"""
        
        # Phase 1: 初期デプロイ (10%)
        self.adjust_traffic(0.1)
        time.sleep(300)  # 5分間監視
        
        canary_error_rate = self.get_error_rate('canary')
        stable_error_rate = self.get_error_rate('stable')
        
        if canary_error_rate > stable_error_rate * 1.5:
            print("Canary has higher error rate, rolling back")
            self.adjust_traffic(0)
            return False
            
        # Phase 2: 段階的増加
        for weight in [0.25, 0.5, 0.75, 1.0]:
            print(f"Increasing canary traffic to {weight*100}%")
            self.adjust_traffic(weight)
            time.sleep(300)
            
            # 各段階でチェック
            if self.get_error_rate('canary') > 0.01:  # 1%以上のエラー
                print("Error rate threshold exceeded, rolling back")
                self.adjust_traffic(0)
                return False
                
        print("Canary deployment successful")
        return True
```

### 演習問題

1. GitLab CI/CDパイプラインを構築し、Podmanでのビルド・テスト・デプロイを自動化してください
2. Blue-Greenデプロイメント戦略を実装し、ゼロダウンタイムを実現してください
3. テストコンテナを使用した統合テストスイートを作成してください

---