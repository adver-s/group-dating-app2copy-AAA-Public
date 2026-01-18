# Data source for existing RDS instance
data "aws_db_instance" "existing" {
  db_instance_identifier = "dating-app-cluster-instance-1"  # 既存のRDSインスタンス名
}

# VPC
resource "aws_vpc" "dating_app" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name    = "dating-app-vpc"
    Project = "dating-app"
    Environment = var.environment
  }
}

# Public Subnets
resource "aws_subnet" "public_1" {
  vpc_id                  = aws_vpc.dating_app.id
  cidr_block              = "10.0.1.0/24"
  availability_zone       = "${var.aws_region}a"
  map_public_ip_on_launch = true

  tags = {
    Name    = "dating-app-public-1"
    Project = "dating-app"
    Environment = var.environment
  }
}

resource "aws_subnet" "public_2" {
  vpc_id                  = aws_vpc.dating_app.id
  cidr_block              = "10.0.2.0/24"
  availability_zone       = "${var.aws_region}c"
  map_public_ip_on_launch = true

  tags = {
    Name    = "dating-app-public-2"
    Project = "dating-app"
    Environment = var.environment
  }
}

# Private Subnets
resource "aws_subnet" "private_1" {
  vpc_id            = aws_vpc.dating_app.id
  cidr_block        = "10.0.3.0/24"
  availability_zone = "${var.aws_region}a"

  tags = {
    Name    = "dating-app-private-1"
    Project = "dating-app"
    Environment = var.environment
  }
}

resource "aws_subnet" "private_2" {
  vpc_id            = aws_vpc.dating_app.id
  cidr_block        = "10.0.4.0/24"
  availability_zone = "${var.aws_region}c"

  tags = {
    Name    = "dating-app-private-2"
    Project = "dating-app"
    Environment = var.environment
  }
}

# Internet Gateway
resource "aws_internet_gateway" "dating_app" {
  vpc_id = aws_vpc.dating_app.id

  tags = {
    Name    = "dating-app-igw"
    Project = "dating-app"
    Environment = var.environment
  }
}

# Route Tables
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.dating_app.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.dating_app.id
  }

  tags = {
    Name    = "dating-app-public-rt"
    Project = "dating-app"
    Environment = var.environment
  }
}

resource "aws_route_table_association" "public_1" {
  subnet_id      = aws_subnet.public_1.id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "public_2" {
  subnet_id      = aws_subnet.public_2.id
  route_table_id = aws_route_table.public.id
}
