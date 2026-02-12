---
title: "第15章 マイクロサービスアーキテクチャ"
---

# 第15章 マイクロサービスアーキテクチャ

## 本章の意義と学習目標

**なぜPodmanでマイクロサービスを学ぶのか**

マイクロサービスアーキテクチャは現代のソフトウェア開発の主流となっていますが、その複雑性により開発環境の構築が課題となっています。Podmanは以下の価値を提供します：

1. **開発環境の簡素化**: Podとネットワーク機能による簡単なサービス間連携
2. **本番環境との一貫性**: Kubernetes互換性による開発から本番への円滑な移行
3. **リソース効率**: 軽量なコンテナによる多数のサービス同時実行
4. **セキュリティ**: Rootlessモードによる安全な開発環境

本章では、Podmanを使用した実践的なマイクロサービス開発を学びます。

### 13.1 マイクロサービスの基本概念

#### 13.1.1 モノリスからマイクロサービスへ

**なぜマイクロサービスが必要か**

モノリシックアーキテクチャの課題：
- スケーラビリティの制限
- 技術スタックの固定化
- デプロイメントリスク
- チーム間の依存性

マイクロサービスがもたらす価値：
- 独立したスケーリング
- 技術選択の自由
- 障害の局所化
- チームの自律性

#### 13.1.2 設計原則

**単一責任の原則**
```yaml
# service-boundaries.yaml
services:
  user-service:
    responsibility: "ユーザー認証とプロファイル管理"
    data_ownership: "users, profiles, sessions"
    
  product-service:
    responsibility: "商品カタログと在庫管理"
    data_ownership: "products, inventory"
    
  order-service:
    responsibility: "注文処理とワークフロー"
    data_ownership: "orders, order_items"
    
  payment-service:
    responsibility: "決済処理と請求"
    data_ownership: "payments, invoices"
```

### 13.2 Podmanによるマイクロサービス環境構築

#### 13.2.1 サービスディスカバリー

**DNSベースのサービスディスカバリー**
```bash
# ネットワーク作成
podman network create microservices

# データベースサービス
podman run -d \
  --name postgres \
  --network microservices \
  -e POSTGRES_PASSWORD=secret \
  postgres:15

# ユーザーサービス
podman run -d \
  --name user-service \
  --network microservices \
  -e DB_HOST=postgres \
  -e DB_NAME=users \
  user-service:latest

# APIゲートウェイ
podman run -d \
  --name api-gateway \
  --network microservices \
  -p 8080:8080 \
  -e USER_SERVICE_URL=http://user-service:8000 \
  api-gateway:latest
```

#### 13.2.2 サービス間通信パターン

**同期通信（REST）**
```python
# api_gateway.py
import aiohttp
from flask import Flask, jsonify
import asyncio

app = Flask(__name__)

class ServiceClient:
    def __init__(self, base_url):
        self.base_url = base_url
        self.session = None
    
    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.session.close()
    
    async def get(self, path):
        async with self.session.get(f"{self.base_url}{path}") as resp:
            return await resp.json()

@app.route('/api/users/<user_id>/orders')
async def get_user_orders(user_id):
    async with ServiceClient("http://user-service:8000") as user_client, \
               ServiceClient("http://order-service:8001") as order_client:
        
        # 並列API呼び出し
        user_task = asyncio.create_task(user_client.get(f"/users/{user_id}"))
        orders_task = asyncio.create_task(order_client.get(f"/users/{user_id}/orders"))
        
        user, orders = await asyncio.gather(user_task, orders_task)
        
        return jsonify({
            "user": user,
            "orders": orders
        })
```

**非同期通信（メッセージング）**
```python
# order_service.py
import pika
import json

class OrderService:
    def __init__(self):
        self.connection = pika.BlockingConnection(
            pika.ConnectionParameters('rabbitmq')
        )
        self.channel = self.connection.channel()
        
        # イベント発行用のExchange
        self.channel.exchange_declare(
            exchange='order_events',
            exchange_type='topic'
        )
    
    def create_order(self, order_data):
        # 注文処理
        order = self.process_order(order_data)
        
        # イベント発行
        event = {
            'event_type': 'order_created',
            'order_id': order['id'],
            'user_id': order['user_id'],
            'total': order['total'],
            'timestamp': datetime.utcnow().isoformat()
        }
        
        self.channel.basic_publish(
            exchange='order_events',
            routing_key='order.created',
            body=json.dumps(event)
        )
        
        return order
```

### 13.3 コンテナオーケストレーション

#### 13.3.1 docker-compose.yml

```yaml
version: '3.8'

services:
  # インフラストラクチャサービス
  postgres:
    image: postgres:15
    environment:
      POSTGRES_USER: admin
      POSTGRES_PASSWORD: secret
    volumes:
      - postgres-data:/var/lib/postgresql/data
      - ./init-databases.sql:/docker-entrypoint-initdb.d/init.sql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U admin"]
      interval: 10s
      timeout: 5s
      retries: 5

  rabbitmq:
    image: rabbitmq:3-management
    environment:
      RABBITMQ_DEFAULT_USER: admin
      RABBITMQ_DEFAULT_PASS: secret
    ports:
      - "15672:15672"
    volumes:
      - rabbitmq-data:/var/lib/rabbitmq

  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes
    volumes:
      - redis-data:/data

  # アプリケーションサービス
  user-service:
    build: ./services/user-service
    environment:
      DATABASE_URL: postgresql://admin:secret@postgres/users
      REDIS_URL: redis://redis:6379
      JWT_SECRET: ${JWT_SECRET}
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_started
    deploy:
      replicas: 2
      resources:
        limits:
          cpus: '0.5'
          memory: 512M

  order-service:
    build: ./services/order-service
    environment:
      DATABASE_URL: postgresql://admin:secret@postgres/orders
      RABBITMQ_URL: amqp://admin:secret@rabbitmq:5672
    depends_on:
      postgres:
        condition: service_healthy
      rabbitmq:
        condition: service_started
    deploy:
      replicas: 3

  payment-service:
    build: ./services/payment-service
    environment:
      DATABASE_URL: postgresql://admin:secret@postgres/payments
      RABBITMQ_URL: amqp://admin:secret@rabbitmq:5672
      STRIPE_API_KEY: ${STRIPE_API_KEY}
    depends_on:
      postgres:
        condition: service_healthy
      rabbitmq:
        condition: service_started

  # API Gateway
  api-gateway:
    build: ./api-gateway
    ports:
      - "8080:8080"
    environment:
      USER_SERVICE_URL: http://user-service:8000
      ORDER_SERVICE_URL: http://order-service:8001
      PAYMENT_SERVICE_URL: http://payment-service:8002
    depends_on:
      - user-service
      - order-service
      - payment-service

  # 監視サービス
  prometheus:
    image: prom/prometheus:latest
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus-data:/prometheus
    ports:
      - "9090:9090"

  grafana:
    image: grafana/grafana:latest
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - grafana-data:/var/lib/grafana
      - ./grafana/dashboards:/etc/grafana/provisioning/dashboards
    ports:
      - "3000:3000"
    depends_on:
      - prometheus

volumes:
  postgres-data:
  rabbitmq-data:
  redis-data:
  prometheus-data:
  grafana-data:

networks:
  default:
    driver: bridge
```

#### 13.3.2 Podman Podでのマイクロサービス

```bash
#!/bin/bash
# deploy-microservices.sh

# Podの作成（共有ネットワーク名前空間）
podman pod create \
  --name microservices-pod \
  --publish 8080:8080 \
  --publish 9090:9090 \
  --publish 3000:3000

# PostgreSQL
podman run -d \
  --pod microservices-pod \
  --name postgres \
  -e POSTGRES_PASSWORD=secret \
  -v postgres-data:/var/lib/postgresql/data \
  postgres:15

# Redis
podman run -d \
  --pod microservices-pod \
  --name redis \
  -v redis-data:/data \
  redis:7-alpine

# RabbitMQ
podman run -d \
  --pod microservices-pod \
  --name rabbitmq \
  -e RABBITMQ_DEFAULT_USER=admin \
  -e RABBITMQ_DEFAULT_PASS=secret \
  rabbitmq:3-management

# アプリケーションサービス
for service in user-service order-service payment-service api-gateway; do
  podman run -d \
    --pod microservices-pod \
    --name $service \
    --env-file ./$service/.env \
    $service:latest
done
```

### 13.4 サービスメッシュパターン

#### 13.4.1 サイドカープロキシ

```yaml
# envoy-sidecar.yaml
apiVersion: v1
kind: Pod
metadata:
  name: service-with-envoy
spec:
  containers:
  - name: service
    image: myservice:latest
    ports:
    - containerPort: 8000
  
  - name: envoy
    image: envoyproxy/envoy:v1.25-latest
    ports:
    - containerPort: 9901  # Admin
    - containerPort: 10000 # Proxy
    volumeMounts:
    - name: envoy-config
      mountPath: /etc/envoy
    command: ["envoy"]
    args: ["-c", "/etc/envoy/envoy.yaml"]
  
  volumes:
  - name: envoy-config
    configMap:
      name: envoy-config
```

**Envoy設定**
```yaml
# envoy.yaml
static_resources:
  listeners:
  - name: listener_0
    address:
      socket_address:
        address: 0.0.0.0
        port_value: 10000
    filter_chains:
    - filters:
      - name: envoy.filters.network.http_connection_manager
        typed_config:
          "@type": type.googleapis.com/envoy.extensions.filters.network.http_connection_manager.v3.HttpConnectionManager
          stat_prefix: ingress_http
          route_config:
            name: local_route
            virtual_hosts:
            - name: local_service
              domains: ["*"]
              routes:
              - match:
                  prefix: "/"
                route:
                  cluster: local_service
                  timeout: 30s
                  retry_policy:
                    retry_on: "5xx"
                    num_retries: 3
                    per_try_timeout: 10s
          http_filters:
          - name: envoy.filters.http.router
  
  clusters:
  - name: local_service
    connect_timeout: 5s
    type: STATIC
    lb_policy: ROUND_ROBIN
    load_assignment:
      cluster_name: local_service
      endpoints:
      - lb_endpoints:
        - endpoint:
            address:
              socket_address:
                address: 127.0.0.1
                port_value: 8000
    health_checks:
    - timeout: 3s
      interval: 5s
      unhealthy_threshold: 2
      healthy_threshold: 2
      http_health_check:
        path: /health
```

### 13.5 分散トレーシング

#### 13.5.1 OpenTelemetryの実装

```python
# tracing.py
from opentelemetry import trace
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.instrumentation.flask import FlaskInstrumentor
from opentelemetry.instrumentation.requests import RequestsInstrumentor
from opentelemetry.instrumentation.sqlalchemy import SQLAlchemyInstrumentor

def setup_tracing(service_name, otlp_endpoint="otel-collector:4317"):
    """分散トレーシングのセットアップ"""
    
    # トレーサープロバイダー設定
    trace.set_tracer_provider(TracerProvider())
    tracer_provider = trace.get_tracer_provider()
    
    # OTLPエクスポーター
    otlp_exporter = OTLPSpanExporter(
        endpoint=otlp_endpoint,
        insecure=True
    )
    
    # バッチプロセッサー
    span_processor = BatchSpanProcessor(otlp_exporter)
    tracer_provider.add_span_processor(span_processor)
    
    # 自動インストルメンテーション
    FlaskInstrumentor().instrument()
    RequestsInstrumentor().instrument()
    SQLAlchemyInstrumentor().instrument()
    
    return trace.get_tracer(service_name)

# 使用例
from flask import Flask, request
import requests

app = Flask(__name__)
tracer = setup_tracing("order-service")

@app.route('/orders', methods=['POST'])
def create_order():
    with tracer.start_as_current_span("create_order") as span:
        # リクエスト情報をスパンに追加
        span.set_attribute("user.id", request.json.get('user_id'))
        span.set_attribute("order.total", request.json.get('total'))
        
        # ユーザーサービス呼び出し
        with tracer.start_as_current_span("validate_user"):
            user_response = requests.get(
                f"http://user-service/users/{request.json['user_id']}"
            )
            
        # 在庫確認
        with tracer.start_as_current_span("check_inventory"):
            for item in request.json['items']:
                inventory_response = requests.post(
                    "http://inventory-service/check",
                    json={'product_id': item['product_id'], 'quantity': item['quantity']}
                )
        
        # 注文作成
        with tracer.start_as_current_span("save_order"):
            order = create_order_in_db(request.json)
        
        return jsonify(order), 201
```

#### 13.5.2 分散ログの相関

```python
# logging_config.py
import logging
import json
from opentelemetry import trace

class StructuredFormatter(logging.Formatter):
    def format(self, record):
        # 現在のスパンコンテキストを取得
        span = trace.get_current_span()
        span_context = span.get_span_context() if span else None
        
        log_data = {
            'timestamp': self.formatTime(record),
            'level': record.levelname,
            'service': 'order-service',
            'message': record.getMessage(),
            'logger': record.name,
        }
        
        # トレース情報を追加
        if span_context and span_context.is_valid:
            log_data['trace_id'] = format(span_context.trace_id, '032x')
            log_data['span_id'] = format(span_context.span_id, '016x')
        
        # 追加のコンテキスト情報
        if hasattr(record, 'user_id'):
            log_data['user_id'] = record.user_id
        
        return json.dumps(log_data)

# ロガー設定
def setup_logging():
    handler = logging.StreamHandler()
    handler.setFormatter(StructuredFormatter())
    
    logger = logging.getLogger()
    logger.addHandler(handler)
    logger.setLevel(logging.INFO)
    
    return logger
```

### 13.6 レジリエンスパターン

#### 13.6.1 サーキットブレーカー

```python
# circuit_breaker.py
import time
from enum import Enum
from functools import wraps
import threading

class CircuitState(Enum):
    CLOSED = "closed"
    OPEN = "open"
    HALF_OPEN = "half_open"

class CircuitBreaker:
    def __init__(self, failure_threshold=5, recovery_timeout=60, expected_exception=Exception):
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout
        self.expected_exception = expected_exception
        self.failure_count = 0
        self.last_failure_time = None
        self.state = CircuitState.CLOSED
        self._lock = threading.Lock()
    
    def __call__(self, func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            with self._lock:
                if self.state == CircuitState.OPEN:
                    if self._should_attempt_reset():
                        self.state = CircuitState.HALF_OPEN
                    else:
                        raise Exception(f"Circuit breaker is OPEN for {func.__name__}")
            
            try:
                result = func(*args, **kwargs)
                with self._lock:
                    self._on_success()
                return result
            except self.expected_exception as e:
                with self._lock:
                    self._on_failure()
                raise e
        
        return wrapper
    
    def _should_attempt_reset(self):
        return (
            self.last_failure_time and
            time.time() - self.last_failure_time >= self.recovery_timeout
        )
    
    def _on_success(self):
        self.failure_count = 0
        self.state = CircuitState.CLOSED
    
    def _on_failure(self):
        self.failure_count += 1
        self.last_failure_time = time.time()
        if self.failure_count >= self.failure_threshold:
            self.state = CircuitState.OPEN

# 使用例
@CircuitBreaker(failure_threshold=3, recovery_timeout=30)
def call_payment_service(payment_data):
    response = requests.post(
        "http://payment-service/process",
        json=payment_data,
        timeout=5
    )
    response.raise_for_status()
    return response.json()
```

#### 13.6.2 リトライとタイムアウト

```python
# resilience.py
import time
import random
from functools import wraps

def exponential_backoff_retry(max_retries=3, base_delay=1, max_delay=60):
    """指数バックオフによるリトライ"""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            retries = 0
            delay = base_delay
            
            while retries < max_retries:
                try:
                    return func(*args, **kwargs)
                except Exception as e:
                    retries += 1
                    if retries == max_retries:
                        raise e
                    
                    # ジッターを加えた指数バックオフ
                    jitter = random.uniform(0, delay * 0.1)
                    sleep_time = min(delay + jitter, max_delay)
                    
                    time.sleep(sleep_time)
                    delay *= 2
            
        return wrapper
    return decorator

# 使用例
@exponential_backoff_retry(max_retries=3)
def fetch_user_data(user_id):
    response = requests.get(
        f"http://user-service/users/{user_id}",
        timeout=3
    )
    response.raise_for_status()
    return response.json()
```

### 13.7 実践演習

#### 演習1: ECサイトのマイクロサービス化

**目標**: モノリシックなECサイトをマイクロサービスに分解し、Podmanで実装する

**要件**:
- ユーザー管理サービス
- 商品カタログサービス
- カートサービス
- 注文サービス
- 決済サービス
- 通知サービス

**実装のポイント**:
- サービス間の境界定義
- データの一貫性確保
- 分散トランザクション処理
- 監視とログの統合

#### 演習2: サーキットブレーカーの実装と検証

**目標**: マイクロサービス間の通信にサーキットブレーカーを実装し、障害時の挙動を確認する

**手順**:
1. 障害を模擬するサービスの作成
2. サーキットブレーカーの実装
3. 負荷テストツールでの検証
4. メトリクスの可視化

---