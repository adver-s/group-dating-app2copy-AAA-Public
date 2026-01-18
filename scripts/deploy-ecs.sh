#!/bin/bash

# 色付きログ関数
log_info() {
    echo -e "\033[32m[INFO]\033[0m $1"
}

log_error() {
    echo -e "\033[31m[ERROR]\033[0m $1"
}

log_warn() {
    echo -e "\033[33m[WARN]\033[0m $1"
}

# AWS CLI がインストールされているかチェック
if ! command -v aws &> /dev/null; then
    log_error "AWS CLI がインストールされていません"
    exit 1
fi

# 設定
CLUSTER_NAME="group-dating-cluster"
SERVICE_NAME="group-dating-app"
TASK_DEFINITION_FILE="ecs-task-definition.json"
REGION="us-east-1"

log_info "🚀 ECSデプロイを開始します..."

# 1. IAMロールを作成
log_info "IAMロールを作成中..."
node scripts/create-ecs-roles.js

# 2. ECSクラスターを作成（存在しない場合）
log_info "ECSクラスターを確認中..."
if ! aws ecs describe-clusters --clusters $CLUSTER_NAME --region $REGION --query 'clusters[0].status' --output text 2>/dev/null | grep -q "ACTIVE"; then
    log_info "ECSクラスターを作成中..."
    aws ecs create-cluster --cluster-name $CLUSTER_NAME --region $REGION
    log_info "✅ ECSクラスターが作成されました"
else
    log_info "✅ ECSクラスターは既に存在します"
fi

# 3. CloudWatch Logsグループを作成
log_info "CloudWatch Logsグループを作成中..."
aws logs create-log-group --log-group-name "/ecs/group-dating-app" --region $REGION 2>/dev/null || log_warn "Logsグループは既に存在します"

# 4. タスク定義を登録
log_info "タスク定義を登録中..."
aws ecs register-task-definition --cli-input-json file://$TASK_DEFINITION_FILE --region $REGION

if [ $? -eq 0 ]; then
    log_info "✅ タスク定義が登録されました"
else
    log_error "❌ タスク定義の登録に失敗しました"
    exit 1
fi

# 5. サービスを作成または更新
log_info "ECSサービスを確認中..."
if aws ecs describe-services --cluster $CLUSTER_NAME --services $SERVICE_NAME --region $REGION --query 'services[0].status' --output text 2>/dev/null | grep -q "ACTIVE"; then
    log_info "サービスを更新中..."
    aws ecs update-service \
        --cluster $CLUSTER_NAME \
        --service $SERVICE_NAME \
        --task-definition $SERVICE_NAME \
        --region $REGION
else
    log_info "サービスを作成中..."
    aws ecs create-service \
        --cluster $CLUSTER_NAME \
        --service-name $SERVICE_NAME \
        --task-definition $SERVICE_NAME \
        --desired-count 1 \
        --launch-type FARGATE \
        --network-configuration "awsvpcConfiguration={subnets=[subnet-12345678],securityGroups=[sg-12345678],assignPublicIp=ENABLED}" \
        --region $REGION
fi

if [ $? -eq 0 ]; then
    log_info "✅ ECSサービスが正常にデプロイされました"
    log_info "サービスURL: https://your-alb-domain.com"
else
    log_error "❌ ECSサービスのデプロイに失敗しました"
    exit 1
fi

log_info "�� ECSデプロイが完了しました！" 