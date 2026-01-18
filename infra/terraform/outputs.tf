output "instance_ids" {
  value = aws_instance.myapp_ec2[*].id
}
 
output "public_ips" {
  value = aws_eip.myapp_eip[*].public_ip
} 

output "existing_rds_endpoint" {
  description = "Existing RDS endpoint"
  value       = data.aws_db_instance.existing.endpoint
}

output "existing_rds_identifier" {
  description = "Existing RDS identifier"
  value       = data.aws_db_instance.existing.db_instance_identifier
}

output "vpc_id" {
  description = "VPC ID"
  value       = aws_vpc.dating_app.id
}

output "public_subnet_ids" {
  description = "Public subnet IDs"
  value       = [aws_subnet.public_1.id, aws_subnet.public_2.id]
}

output "private_subnet_ids" {
  description = "Private subnet IDs"
  value       = [aws_subnet.private_1.id, aws_subnet.private_2.id]
} 