#!/bin/bash
set -euo pipefail

# Configurable variables
PROD_VPC_NAME="myapp-prod-vpc"
STG_VPC_NAME="myapp-stg-vpc"
STG_EC2_NAME="myapp-stg-ec2"
PROJECT_TAG="myapp"
STAGE_TAG="stg"
REGION="ap-northeast-1"

# Helper: Tag a resource
function tag_resource() {
  local resource_id=$1
  aws ec2 create-tags --resources "$resource_id" --tags Key=Stage,Value=$STAGE_TAG Key=Project,Value=$PROJECT_TAG --region $REGION
}

# 1. Get production VPC ID
function get_prod_vpc_id() {
  aws ec2 describe-vpcs --filters "Name=tag:Name,Values=$PROD_VPC_NAME" --region $REGION --query 'Vpcs[0].VpcId' --output text
}

# 2. Duplicate VPC
function duplicate_vpc() {
  local prod_vpc_id=$1
  local cidr_block=$(aws ec2 describe-vpcs --vpc-ids "$prod_vpc_id" --region $REGION --query 'Vpcs[0].CidrBlock' --output text)
  local stg_vpc_id=$(aws ec2 create-vpc --cidr-block "$cidr_block" --region $REGION --query 'Vpc.VpcId' --output text)
  aws ec2 create-tags --resources "$stg_vpc_id" --tags Key=Name,Value=$STG_VPC_NAME Key=Stage,Value=$STAGE_TAG Key=Project,Value=$PROJECT_TAG --region $REGION
  echo "$stg_vpc_id"
}

# 3. Duplicate subnets
function duplicate_subnets() {
  local prod_vpc_id=$1
  local stg_vpc_id=$2
  local stg_subnet_ids=()
  local subnets=$(aws ec2 describe-subnets --filters "Name=vpc-id,Values=$prod_vpc_id" --region $REGION --query 'Subnets')
  local count=$(echo "$subnets" | jq length)
  for ((i=0; i<$count; i++)); do
    local cidr=$(echo "$subnets" | jq -r ".[$i].CidrBlock")
    local az=$(echo "$subnets" | jq -r ".[$i].AvailabilityZone")
    local name_tag=$(echo "$subnets" | jq -r ".[$i].Tags[]? | select(.Key==\"Name\") | .Value")
    local stg_subnet_id=$(aws ec2 create-subnet --vpc-id "$stg_vpc_id" --cidr-block "$cidr" --availability-zone "$az" --region $REGION --query 'Subnet.SubnetId' --output text)
    aws ec2 create-tags --resources "$stg_subnet_id" --tags Key=Name,Value="${name_tag/-prod/-stg}" Key=Stage,Value=$STAGE_TAG Key=Project,Value=$PROJECT_TAG --region $REGION
    stg_subnet_ids+=("$stg_subnet_id")
  done
  echo "${stg_subnet_ids[@]}"
}

# 4. Duplicate security groups
function duplicate_security_groups() {
  local prod_vpc_id=$1
  local stg_vpc_id=$2
  local stg_sg_ids=()
  local sgs=$(aws ec2 describe-security-groups --filters "Name=vpc-id,Values=$prod_vpc_id" --region $REGION --query 'SecurityGroups')
  local count=$(echo "$sgs" | jq length)
  for ((i=0; i<$count; i++)); do
    local name=$(echo "$sgs" | jq -r ".[$i].GroupName")
    if [[ "$name" == "default" ]]; then continue; fi
    local desc=$(echo "$sgs" | jq -r ".[$i].Description")
    local stg_sg_id=$(aws ec2 create-security-group --group-name "${name/-prod/-stg}" --description "$desc" --vpc-id "$stg_vpc_id" --region $REGION --query 'GroupId' --output text)
    aws ec2 create-tags --resources "$stg_sg_id" --tags Key=Name,Value="${name/-prod/-stg}" Key=Stage,Value=$STAGE_TAG Key=Project,Value=$PROJECT_TAG --region $REGION
    stg_sg_ids+=("$stg_sg_id")
  done
  echo "${stg_sg_ids[@]}"
}

# 5. Tag existing EC2 for staging
function tag_ec2() {
  local ec2_id=$1
  aws ec2 create-tags --resources "$ec2_id" --tags Key=Name,Value=$STG_EC2_NAME Key=Stage,Value=$STAGE_TAG Key=Project,Value=$PROJECT_TAG --region $REGION
}

# 6. Output EC2 info
function output_ec2_info() {
  local ec2_id=$1
  aws ec2 describe-instances --instance-ids "$ec2_id" --region $REGION --query 'Reservations[0].Instances[0].[PublicIpAddress,InstanceId]' --output text
}

# Main
function main() {
  echo "[1] Get production VPC ID"
  local prod_vpc_id=$(get_prod_vpc_id)
  echo "Production VPC: $prod_vpc_id"

  echo "[2] Duplicate VPC"
  local stg_vpc_id=$(duplicate_vpc "$prod_vpc_id")
  echo "Staging VPC: $stg_vpc_id"

  echo "[3] Duplicate subnets"
  local stg_subnet_ids=( $(duplicate_subnets "$prod_vpc_id" "$stg_vpc_id") )
  echo "Staging Subnets: ${stg_subnet_ids[*]}"

  echo "[4] Duplicate security groups"
  local stg_sg_ids=( $(duplicate_security_groups "$prod_vpc_id" "$stg_vpc_id") )
  echo "Staging SGs: ${stg_sg_ids[*]}"

  # 既存EC2のIDを指定（手動で設定 or 取得ロジックを追加）
  local stg_ec2_id="i-0d38086d3c1198692"
  tag_ec2 "$stg_ec2_id"

  echo "[5] Output EC2 info"
  output_ec2_info "$stg_ec2_id"
}

main "$@" 