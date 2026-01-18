# Terraform MyApp EC2 Module

This module provisions one or more EC2 instances for a given stage (prod or stg) in ap-northeast-1, with Elastic IPs and custom VPC support.

## Usage

1. Initialize:

   ```sh
   terraform init
   ```

2. Apply (for staging, 2 instances, custom VPC):

   ```sh
   terraform apply \
     -var="stage=stg" \
     -var="myapp_ami_id=ami-xxxxxxxx" \
     -var="instance_count=2" \
     -var="vpc_id=vpc-xxxxxxxx"
   ```

   Replace `ami-xxxxxxxx` with your "myapp" AMI ID and `vpc-xxxxxxxx` with your VPC ID.

## Variables

- `stage`: Deployment stage (`prod` or `stg`). Default: `stg`
- `myapp_ami_id`: The AMI ID to use for the EC2 instance (required)
- `instance_count`: Number of EC2 instances to launch (default: 1)
- `vpc_id`: VPC ID to use (optional; if not set, uses default VPC)

## Outputs

- `instance_ids`: List of EC2 instance IDs
- `public_ips`: List of EC2 public IP addresses 