#!/bin/bash
# Usage:
#   bash infra/route53_acm.sh <EC2_PUBLIC_DNS> <HOSTED_ZONE_ID>
#
# Example:
#   bash infra/route53_acm.sh ec2-xx-xx-xx-xx.ap-northeast-1.compute.amazonaws.com ZXXXXXXXXXXX
#
# Requirements: aws cli, jq
set -euo pipefail

DOMAIN="stg.myapp.com"
REGION="us-east-1"
EC2_DNS="$1"
HOSTED_ZONE_ID="$2"

# 1. Create CNAME record for stg.myapp.com -> EC2 Public DNS
cat > tmp-cname.json <<EOF
{
  "Comment": "Create CNAME for stg.myapp.com",
  "Changes": [
    {
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "$DOMAIN",
        "Type": "CNAME",
        "TTL": 300,
        "ResourceRecords": [{ "Value": "$EC2_DNS" }]
      }
    }
  ]
}
EOF
aws route53 change-resource-record-sets --hosted-zone-id "$HOSTED_ZONE_ID" --change-batch file://tmp-cname.json
rm tmp-cname.json

echo "✔ CNAME record created: $DOMAIN -> $EC2_DNS"

# 2. Request ACM cert for stg.myapp.com in us-east-1
CERT_ARN=$(aws acm request-certificate \
  --domain-name "$DOMAIN" \
  --validation-method DNS \
  --region $REGION \
  --query CertificateArn --output text)
echo "✔ ACM certificate requested: $CERT_ARN"

# 3. Get DNS validation options and create CNAME for validation
sleep 5 # Wait for ACM to populate validation options
VAL_JSON=$(aws acm describe-certificate --certificate-arn "$CERT_ARN" --region $REGION)
VAL_NAME=$(echo "$VAL_JSON" | jq -r '.Certificate.DomainValidationOptions[0].ResourceRecord.Name')
VAL_VALUE=$(echo "$VAL_JSON" | jq -r '.Certificate.DomainValidationOptions[0].ResourceRecord.Value')

cat > tmp-validate.json <<EOF
{
  "Comment": "Add ACM DNS validation CNAME",
  "Changes": [
    {
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "$VAL_NAME",
        "Type": "CNAME",
        "TTL": 300,
        "ResourceRecords": [{ "Value": "$VAL_VALUE" }]
      }
    }
  ]
}
EOF
aws route53 change-resource-record-sets --hosted-zone-id "$HOSTED_ZONE_ID" --change-batch file://tmp-validate.json
rm tmp-validate.json

echo "✔ DNS validation CNAME created: $VAL_NAME -> $VAL_VALUE"
echo "All done!" 