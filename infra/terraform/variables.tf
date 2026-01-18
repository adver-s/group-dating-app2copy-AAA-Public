variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "ap-northeast-1"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

variable "vpc_id" {
  description = "VPC ID (optional)"
  type        = string
  default     = ""
}

variable "myapp_ami_id" {
  description = "AMI ID for EC2 instances"
  type        = string
  default     = "ami-0d52744d6551d851e" # Amazon Linux 2023
}

variable "instance_count" {
  description = "Number of EC2 instances"
  type        = number
  default     = 1
}

variable "stage" {
  description = "Deployment stage"
  type        = string
  default     = "prod"
} 