---
layout: book
order: 15
title: "第14章：パフォーマンスチューニング"
---

# 第14章：パフォーマンスチューニング

### 本章の意義と学習目標

**なぜエンタープライズ環境でPodmanが選ばれるのか**

エンタープライズ環境には、個人開発や小規模チームとは異なる厳格な要件があります：

1. **セキュリティコンプライアンス**: 業界標準や規制への準拠
2. **監査要件**: すべての操作の追跡可能性
3. **高可用性**: ビジネス継続性の確保
4. **既存システムとの統合**: レガシーシステムとの共存

Podmanは、これらの要件に対して以下の価値を提供します：
- Rootlessによるセキュリティ強化
- systemd統合による運用の標準化
- Red Hatによるエンタープライズサポート
- 既存のLinux管理ツールとの親和性

### 14.1 エンタープライズセキュリティ

#### 14.1.1 コンプライアンス対応

**セキュリティポリシーの実装**
```bash
#!/bin/bash
# security-compliance-check.sh

echo "=== Enterprise Security Compliance Check ==="
echo "Date: $(date)"
echo "Checking against: CIS Docker Benchmark v1.4.0 adapted for Podman"

# 結果を保存する配列
declare -a passed=()
declare -a failed=()
declare -a warnings=()

# チェック関数
check() {
    local id=$1
    local description=$2
    local command=$3
    local expected=$4
    
    echo -n "[$id] $description... "
    
    result=$(eval $command 2>/dev/null)
    if [[ "$result" == *"$expected"* ]]; then
        echo "PASS"
        passed+=("$id: $description")
    else
        echo "FAIL"
        failed+=("$id: $description")
    fi
}

# 1. ホスト設定
check "1.1" "Rootlessモードの確認" "podman info --format '\{\{.Host.Security.Rootless\}\}'" "true"
check "1.2" "SELinuxの有効化" "getenforce" "Enforcing"
check "1.3" "監査ログの有効化" "auditctl -l | grep -c podman" "1"

# 2. Podman設定
check "2.1" "ユーザー名前空間の有効化" "sysctl user.max_user_namespaces" "0"
check "2.2" "seccompプロファイルの使用" "podman info --format '\{\{.Host.Security.SECCOMPEnabled\}\}'" "true"

# 3. イメージセキュリティ
echo -e "\n[3.x] イメージセキュリティチェック"
for image in $(podman images --format "\{\{.Repository\}\}:\{\{.Tag\}\}" | grep -v "localhost/"); do
    echo "  Checking image: $image"
    
    # ルートユーザーチェック
    user=$(podman run --rm $image whoami 2>/dev/null || echo "error")
    if [ "$user" = "root" ]; then
        warnings+=("Image $image runs as root")
    fi
    
    # 署名確認
    if ! podman image trust show $image >/dev/null 2>&1; then
        warnings+=("Image $image has no signature policy")
    fi
done

# 4. コンテナランタイムセキュリティ
echo -e "\n[4.x] ランタイムセキュリティチェック"
for container in $(podman ps -q); do
    name=$(podman inspect $container --format '\{\{.Name\}\}')
    echo "  Checking container: $name"
    
    # 特権モードチェック
    privileged=$(podman inspect $container --format '\{\{.HostConfig.Privileged\}\}')
    if [ "$privileged" = "true" ]; then
        failed+=("Container $name is running in privileged mode")
    fi
    
    # ケーパビリティチェック
    caps=$(podman inspect $container --format '\{\{.EffectiveCaps\}\}')
    if [ "$caps" != "[]" ] && [ "$caps" != "null" ]; then
        warnings+=("Container $name has additional capabilities: $caps")
    fi
done

# レポート生成
echo -e "\n=== Compliance Report Summary ==="
echo "Passed: ${#passed[@]}"
echo "Failed: ${#failed[@]}"
echo "Warnings: ${#warnings[@]}"

# 詳細レポート生成
cat > compliance-report-$(date +%Y%m%d-%H%M%S).json << EOF
{
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "summary": {
    "passed": ${#passed[@]},
    "failed": ${#failed[@]},
    "warnings": ${#warnings[@]}
  },
  "details": {
    "passed": [$(printf '"%s",' "${passed[@]}" | sed 's/,$//')]",
    "failed": [$(printf '"%s",' "${failed[@]}" | sed 's/,$//')]",
    "warnings": [$(printf '"%s",' "${warnings[@]}" | sed 's/,$//')"]
  }
}
EOF

echo "Report saved to compliance-report-*.json"
```

#### 14.1.2 監査ログの実装

```python
#!/usr/bin/env python3
# audit_logger.py

import json
import datetime
import hashlib
import subprocess
import threading
import queue
from pathlib import Path

class PodmanAuditLogger:
    def __init__(self, log_dir="/var/log/podman-audit"):
        self.log_dir = Path(log_dir)
        self.log_dir.mkdir(parents=True, exist_ok=True)
        self.event_queue = queue.Queue()
        self.running = True
        
        # バックグラウンドワーカー起動
        self.worker_thread = threading.Thread(target=self._process_events)
        self.worker_thread.start()
    
    def start_monitoring(self):
        """Podmanイベントの監視開始"""
        process = subprocess.Popen(
            ['podman', 'events', '--format', 'json'],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            bufsize=1
        )
        
        for line in process.stdout:
            if line.strip():
                try:
                    event = json.loads(line)
                    self.event_queue.put(event)
                except json.JSONDecodeError:
                    continue
    
    def _process_events(self):
        """イベント処理ワーカー"""
        while self.running:
            try:
                event = self.event_queue.get(timeout=1)
                self._log_event(event)
            except queue.Empty:
                continue
    
    def _log_event(self, event):
        """監査ログエントリーの作成"""
        timestamp = datetime.datetime.utcnow()
        
        # 監査エントリー構築
        audit_entry = {
            "timestamp": timestamp.isoformat(),
            "event_time": event.get("time", ""),
            "event_type": event.get("Type", ""),
            "action": event.get("Action", ""),
            "actor": {
                "id": event.get("Actor", {}).get("ID", ""),
                "attributes": event.get("Actor", {}).get("Attributes", {})
            },
            "scope": event.get("scope", ""),
            "time_nano": event.get("timeNano", ""),
            "metadata": {}
        }
        
        # ユーザー情報の追加
        try:
            user_info = subprocess.run(
                ['id', '-un'],
                capture_output=True,
                text=True
            ).stdout.strip()
            audit_entry["user"] = user_info
        except:
            audit_entry["user"] = "unknown"
        
        # ハッシュ計算（改ざん防止）
        entry_string = json.dumps(audit_entry, sort_keys=True)
        audit_entry["hash"] = hashlib.sha256(entry_string.encode()).hexdigest()
        
        # ログファイルへの書き込み
        log_file = self.log_dir / f"audit-{timestamp.strftime('%Y%m%d')}.jsonl"
        with open(log_file, 'a') as f:
            f.write(json.dumps(audit_entry) + '\n')
        
        # 重要イベントの即時アラート
        if self._is_critical_event(event):
            self._send_alert(audit_entry)
    
    def _is_critical_event(self, event):
        """重要イベントの判定"""
        critical_actions = [
            "exec_died",  # 不正なプロセス終了
            "remove",     # コンテナ削除
            "kill"        # コンテナ強制終了
        ]
        
        suspicious_images = [
            "alpine",  # 最小イメージ（攻撃によく使われる）
            "busybox"
        ]
        
        action = event.get("Action", "")
        image = event.get("Actor", {}).get("Attributes", {}).get("image", "")
        
        return action in critical_actions or any(s in image for s in suspicious_images)
    
    def _send_alert(self, audit_entry):
        """アラート送信（SIEM統合など）"""
        # 実装例: Syslog, SIEM API, メール通知など
        print(f"ALERT: Critical event detected - {audit_entry['action']}")
    
    def generate_compliance_report(self, start_date, end_date):
        """コンプライアンスレポート生成"""
        events = []
        
        # 指定期間のログファイルを読み込み
        for log_file in self.log_dir.glob("audit-*.jsonl"):
            with open(log_file, 'r') as f:
                for line in f:
                    event = json.loads(line)
                    event_time = datetime.datetime.fromisoformat(event['timestamp'])
                    
                    if start_date <= event_time <= end_date:
                        events.append(event)
        
        # レポート生成
        report = {
            "period": {
                "start": start_date.isoformat(),
                "end": end_date.isoformat()
            },
            "total_events": len(events),
            "events_by_type": {},
            "events_by_user": {},
            "critical_events": []
        }
        
        for event in events:
            # タイプ別集計
            event_type = event['event_type']
            report['events_by_type'][event_type] = report['events_by_type'].get(event_type, 0) + 1
            
            # ユーザー別集計
            user = event['user']
            report['events_by_user'][user] = report['events_by_user'].get(user, 0) + 1
            
            # 重要イベント抽出
            if self._is_critical_event(event):
                report['critical_events'].append(event)
        
        return report

if __name__ == "__main__":
    logger = PodmanAuditLogger()
    logger.start_monitoring()
```

### 14.2 高可用性とディザスタリカバリ

#### 14.2.1 アクティブ-スタンバイ構成

```bash
#!/bin/bash
# ha-setup.sh

# 高可用性Podmanクラスター構築スクリプト

ACTIVE_NODE="node1.example.com"
STANDBY_NODE="node2.example.com"
VIP="192.168.100.100"
SHARED_STORAGE="/mnt/shared-storage"

# Pacemakerクラスター設定
setup_pacemaker() {
    echo "Setting up Pacemaker cluster..."
    
    # 両ノードで実行
    for node in $ACTIVE_NODE $STANDBY_NODE; do
        ssh $node << 'EOF'
# Pacemaker/Corosyncインストール
dnf install -y pacemaker corosync pcs fence-agents-all

# サービス有効化
systemctl enable --now pcsd
systemctl enable pacemaker corosync

# haclusterユーザーのパスワード設定
echo "hacluster:StrongPassword123!" | chpasswd
EOF
    done
    
    # クラスター作成
    pcs host auth $ACTIVE_NODE $STANDBY_NODE -u hacluster -p StrongPassword123!
    pcs cluster setup podman-cluster $ACTIVE_NODE $STANDBY_NODE --force
    pcs cluster start --all
    pcs cluster enable --all
    
    # 基本設定
    pcs property set stonith-enabled=false
    pcs property set no-quorum-policy=ignore
}

# 仮想IPリソース設定
setup_vip() {
    echo "Setting up Virtual IP..."
    
    pcs resource create virtual_ip ocf:heartbeat:IPaddr2 \
        ip=$VIP \
        cidr_netmask=24 \
        op monitor interval=30s
}

# Podmanレジストリの高可用性設定
setup_ha_registry() {
    echo "Setting up HA Registry..."
    
    # 共有ストレージのマウント
    cat > /etc/systemd/system/mnt-shared\x2dstorage.mount << EOF
[Unit]
Description=Shared Storage Mount
After=network-online.target

[Mount]
What=${SHARED_STORAGE}
Where=/mnt/shared-storage
Type=nfs
Options=_netdev,auto

[Install]
WantedBy=multi-user.target
EOF
    
    systemctl daemon-reload
    systemctl enable --now mnt-shared\\x2dstorage.mount
    
    # レジストリサービス作成
    cat > /etc/systemd/system/podman-registry.service << 'EOF'
[Unit]
Description=Podman Registry
After=network-online.target mnt-shared\x2dstorage.mount
Requires=mnt-shared\x2dstorage.mount

[Service]
Type=notify
ExecStartPre=-/usr/bin/podman rm -f registry
ExecStart=/usr/bin/podman run \
    --name registry \
    --publish 5000:5000 \
    --volume /mnt/shared-storage/registry:/var/lib/registry \
    --sdnotify=conmon \
    docker.io/registry:2

ExecStop=/usr/bin/podman stop -t 10 registry
Restart=on-failure
RestartSec=30

[Install]
WantedBy=multi-user.target
EOF
    
    # Pacemakerリソースとして登録
    pcs resource create podman-registry systemd:podman-registry \
        op monitor interval=30s \
        op start timeout=60s \
        op stop timeout=60s
    
    # リソースグループ作成
    pcs resource group add podman-services virtual_ip podman-registry
}

# データレプリケーション設定
setup_data_replication() {
    echo "Setting up data replication..."
    
    # rsyncによる定期同期
    cat > /usr/local/bin/sync-podman-data.sh << 'EOF'
#!/bin/bash
# アクティブノードからスタンバイノードへのデータ同期

ACTIVE=$1
STANDBY=$2

# コンテナボリューム同期
rsync -avz --delete \
    ${ACTIVE}:/var/lib/containers/storage/volumes/ \
    ${STANDBY}:/var/lib/containers/storage/volumes/

# イメージ同期
for image in $(ssh $ACTIVE podman images --format "\{\{.Repository\}\}:\{\{.Tag\}\}"); do
    ssh $ACTIVE podman save $image | ssh $STANDBY podman load
done
EOF
    
    chmod +x /usr/local/bin/sync-podman-data.sh
    
    # cronジョブ設定
    echo "*/5 * * * * /usr/local/bin/sync-podman-data.sh $ACTIVE_NODE $STANDBY_NODE" | crontab -
}

# 監視スクリプト
cat > /usr/local/bin/monitor-podman-ha.sh << 'EOF'
#!/bin/bash
# Podman HA監視スクリプト

while true; do
    # クラスターステータス確認
    if ! pcs status >/dev/null 2>&1; then
        echo "ALERT: Pacemaker cluster is not healthy"
        # アラート送信
    fi
    
    # レジストリヘルスチェック
    if ! curl -s http://${VIP}:5000/v2/_catalog >/dev/null; then
        echo "ALERT: Registry is not accessible"
        # フェイルオーバートリガー
        pcs resource move podman-services
    fi
    
    sleep 30
done
EOF

chmod +x /usr/local/bin/monitor-podman-ha.sh

# メイン実行
setup_pacemaker
setup_vip
setup_ha_registry
setup_data_replication

echo "HA setup completed!"
```

### 14.3 既存システムとの統合

#### 14.3.1 LDAP/Active Directory統合

```python
#!/usr/bin/env python3
# ldap_integration.py

import ldap
import json
import subprocess
from flask import Flask, request, jsonify
from functools import wraps
import jwt
import datetime

app = Flask(__name__)

class LDAPAuthenticator:
    def __init__(self, config):
        self.ldap_server = config['ldap_server']
        self.base_dn = config['base_dn']
        self.bind_dn = config['bind_dn']
        self.bind_password = config['bind_password']
        self.user_filter = config['user_filter']
        self.group_filter = config['group_filter']
    
    def authenticate(self, username, password):
        """LDAP認証"""
        try:
            # LDAP接続
            conn = ldap.initialize(f"ldap://{self.ldap_server}")
            conn.protocol_version = ldap.VERSION3
            conn.set_option(ldap.OPT_REFERRALS, 0)
            
            # バインドDNで接続
            conn.simple_bind_s(self.bind_dn, self.bind_password)
            
            # ユーザー検索
            search_filter = self.user_filter.format(username=username)
            result = conn.search_s(
                self.base_dn,
                ldap.SCOPE_SUBTREE,
                search_filter,
                ['dn', 'memberOf', 'cn', 'mail']
            )
            
            if not result:
                return False, None
            
            user_dn = result[0][0]
            user_attrs = result[0][1]
            
            # ユーザー認証
            try:
                user_conn = ldap.initialize(f"ldap://{self.ldap_server}")
                user_conn.simple_bind_s(user_dn, password)
                user_conn.unbind()
                
                # グループメンバーシップ確認
                groups = self._get_user_groups(conn, user_attrs.get('memberOf', []))
                
                user_info = {
                    'username': username,
                    'dn': user_dn,
                    'cn': user_attrs.get('cn', [b''])[0].decode(),
                    'email': user_attrs.get('mail', [b''])[0].decode(),
                    'groups': groups
                }
                
                return True, user_info
                
            except ldap.INVALID_CREDENTIALS:
                return False, None
            
        except Exception as e:
            print(f"LDAP error: {e}")
            return False, None
        finally:
            if 'conn' in locals():
                conn.unbind()
    
    def _get_user_groups(self, conn, member_of):
        """ユーザーのグループ取得"""
        groups = []
        
        for group_dn in member_of:
            group_dn = group_dn.decode()
            # グループ名抽出
            cn = group_dn.split(',')[0].split('=')[1]
            groups.append(cn)
        
        return groups
    
    def authorize_podman_access(self, user_info):
        """Podmanアクセス権限の確認"""
        allowed_groups = [
            'PodmanAdmins',
            'PodmanUsers',
            'ContainerDevelopers'
        ]
        
        user_groups = user_info.get('groups', [])
        return any(group in allowed_groups for group in user_groups)
    
    def get_resource_permissions(self, user_info):
        """リソースレベルの権限取得"""
        permissions = {
            'can_create_containers': False,
            'can_pull_images': False,
            'can_push_images': False,
            'can_manage_volumes': False,
            'resource_limits': {}
        }
        
        user_groups = user_info.get('groups', [])
        
        if 'PodmanAdmins' in user_groups:
            # 管理者は全権限
            permissions.update({
                'can_create_containers': True,
                'can_pull_images': True,
                'can_push_images': True,
                'can_manage_volumes': True,
                'resource_limits': {
                    'max_containers': -1,  # 無制限
                    'max_cpu': -1,
                    'max_memory': -1
                }
            })
        elif 'PodmanUsers' in user_groups:
            # 一般ユーザー
            permissions.update({
                'can_create_containers': True,
                'can_pull_images': True,
                'can_push_images': False,
                'can_manage_volumes': True,
                'resource_limits': {
                    'max_containers': 10,
                    'max_cpu': 4,
                    'max_memory': '8G'
                }
            })
        
        return permissions

# JWT設定
JWT_SECRET = 'your-secret-key'
JWT_ALGORITHM = 'HS256'
JWT_EXPIRATION_HOURS = 8

def generate_token(user_info):
    """JWTトークン生成"""
    payload = {
        'username': user_info['username'],
        'groups': user_info['groups'],
        'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def require_auth(f):
    """認証デコレーター"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        token = request.headers.get('Authorization', '').replace('Bearer ', '')
        
        if not token:
            return jsonify({'error': 'No token provided'}), 401
        
        try:
            payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
            request.user = payload
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Invalid token'}), 401
        
        return f(*args, **kwargs)
    
    return decorated_function

# LDAP設定
ldap_config = {
    'ldap_server': 'ldap.company.com',
    'base_dn': 'DC=company,DC=com',
    'bind_dn': 'CN=ServiceAccount,OU=Services,DC=company,DC=com',
    'bind_password': 'service_password',
    'user_filter': '(&(objectClass=user)(sAMAccountName={username}))',
    'group_filter': '(&(objectClass=group)(member={user_dn}))'
}

authenticator = LDAPAuthenticator(ldap_config)

# APIエンドポイント
@app.route('/auth/login', methods=['POST'])
def login():
    """ログインエンドポイント"""
    username = request.json.get('username')
    password = request.json.get('password')
    
    if not username or not password:
        return jsonify({'error': 'Username and password required'}), 400
    
    success, user_info = authenticator.authenticate(username, password)
    
    if not success:
        return jsonify({'error': 'Invalid credentials'}), 401
    
    if not authenticator.authorize_podman_access(user_info):
        return jsonify({'error': 'Access denied'}), 403
    
    # 権限情報を含めてトークン生成
    permissions = authenticator.get_resource_permissions(user_info)
    user_info['permissions'] = permissions
    
    token = generate_token(user_info)
    
    return jsonify({
        'token': token,
        'user': user_info
    })

@app.route('/api/containers', methods=['POST'])
@require_auth
def create_container():
    """コンテナ作成API"""
    # 権限確認
    user_groups = request.user.get('groups', [])
    
    if 'PodmanUsers' not in user_groups and 'PodmanAdmins' not in user_groups:
        return jsonify({'error': 'Insufficient permissions'}), 403
    
    # コンテナ作成リクエストの検証
    container_config = request.json
    
    # リソース制限の適用
    if 'PodmanUsers' in user_groups and 'PodmanAdmins' not in user_groups:
        # 一般ユーザーにはリソース制限を適用
        container_config['memory'] = min(
            container_config.get('memory', '1G'),
            '8G'
        )
        container_config['cpus'] = min(
            container_config.get('cpus', 1),
            4
        )
    
    # Podmanコマンド実行
    try:
        cmd = ['podman', 'create']
        
        if 'name' in container_config:
            cmd.extend(['--name', container_config['name']])
        
        if 'memory' in container_config:
            cmd.extend(['--memory', container_config['memory']])
        
        if 'cpus' in container_config:
            cmd.extend(['--cpus', str(container_config['cpus'])])
        
        cmd.append(container_config['image'])
        
        result = subprocess.run(cmd, capture_output=True, text=True)
        
        if result.returncode != 0:
            return jsonify({'error': result.stderr}), 400
        
        container_id = result.stdout.strip()
        
        # 監査ログ記録
        log_entry = {
            'timestamp': datetime.datetime.utcnow().isoformat(),
            'user': request.user['username'],
            'action': 'create_container',
            'container_id': container_id,
            'config': container_config
        }
        
        # ログファイルに記録
        with open('/var/log/podman-api-audit.log', 'a') as f:
            f.write(json.dumps(log_entry) + '\n')
        
        return jsonify({
            'container_id': container_id,
            'status': 'created'
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, ssl_context='adhoc')
```

### 14.4 実践演習

#### 演習1: エンタープライズ向けPodman環境の構築

**目標**: 以下の要件を満たすPodman環境を構築する
- LDAP認証統合
- 高可用性構成
- 自動バックアップ
- コンプライアンス監査

**実装手順**:
1. LDAP/ADサーバーとの連携設定
2. Pacemaker/Corosyncによるクラスター構築
3. バックアップジョブの設定
4. 監査ログシステムの実装

#### 演習2: ディザスタリカバリ訓練

**目標**: 障害発生時の復旧手順を確立し、訓練を実施する

**シナリオ**:
1. プライマリノードの完全障害
2. データ破損からの復旧
3. ランサムウェア攻撃からの復旧

**期待される成果**:
- RTO（目標復旧時間）の測定
- RPO（目標復旧時点）の確認
- 復旧手順書の作成

---