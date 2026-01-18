#!/bin/bash

# 設定
AWS_REGION="us-east-1"
ECR_REPOSITORY_NAME="group-dating-app"
IMAGE_TAG="latest"

# 色付きのログ出力
log_info() {
    echo -e "\033[32m[INFO]\033[0m $1"
}

log_error() {
    echo -e "\033[31m[ERROR]\033[0m $1"
}

log_warning() {
    echo -e "\033[33m[WARNING]\033[0m $1"
}

# AWS CLIの確認
if ! command -v aws &> /dev/null; then
    log_error "AWS CLIがインストールされていません"
    exit 1
fi

# AWS認証情報の確認
if ! aws sts get-caller-identity &> /dev/null; then
    log_error "AWS認証情報が設定されていません"
    exit 1
fi

log_info "AWS認証情報を確認しました"

# ECRリポジトリの存在確認と作成
log_info "ECRリポジトリを確認中..."
if ! aws ecr describe-repositories --repository-names $ECR_REPOSITORY_NAME --region $AWS_REGION &> /dev/null; then
    log_info "ECRリポジトリを作成中..."
    aws ecr create-repository \
        --repository-name $ECR_REPOSITORY_NAME \
        --region $AWS_REGION \
        --image-scanning-configuration scanOnPush=true \
        --encryption-configuration encryptionType=AES256
    log_info "ECRリポジトリを作成しました"
else
    log_info "ECRリポジトリは既に存在します"
fi

# ECRリポジトリのURIを取得
ECR_REPOSITORY_URI=$(aws ecr describe-repositories \
    --repository-names $ECR_REPOSITORY_NAME \
    --region $AWS_REGION \
    --query 'repositories[0].repositoryUri' \
    --output text)

log_info "ECRリポジトリURI: $ECR_REPOSITORY_URI"

# Dockerイメージのビルド
log_info "Dockerイメージをビルド中..."
docker build -t $ECR_REPOSITORY_NAME:$IMAGE_TAG .

if [ $? -ne 0 ]; then
    log_error "Dockerイメージのビルドに失敗しました"
    exit 1
fi

log_info "Dockerイメージのビルドが完了しました"

# ECRにログイン
log_info "ECRにログイン中..."
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ECR_REPOSITORY_URI

if [ $? -ne 0 ]; then
    log_error "ECRログインに失敗しました"
    exit 1
fi

log_info "ECRログインが完了しました"

# イメージにタグを付ける
log_info "Dockerイメージにタグを付与中..."
docker tag $ECR_REPOSITORY_NAME:$IMAGE_TAG $ECR_REPOSITORY_URI:$IMAGE_TAG

# イメージをプッシュ
log_info "DockerイメージをECRにプッシュ中..."
docker push $ECR_REPOSITORY_URI:$IMAGE_TAG

if [ $? -ne 0 ]; then
    log_error "Dockerイメージのプッシュに失敗しました"
    exit 1
fi

log_info "✅ Dockerイメージのプッシュが完了しました"
log_info "イメージURI: $ECR_REPOSITORY_URI:$IMAGE_TAG"

# イメージの詳細情報を表示
log_info "プッシュされたイメージの詳細:"
aws ecr describe-images \
    --repository-name $ECR_REPOSITORY_NAME \
    --region $AWS_REGION \
    --query 'imageDetails[0]' \
    --output table 