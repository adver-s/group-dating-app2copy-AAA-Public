data "aws_vpc" "selected" {
  count = var.vpc_id != "" ? 1 : 0
  id    = var.vpc_id
}

data "aws_vpc" "default" {
  count = var.vpc_id == "" ? 1 : 0
  default = true
}

locals {
  vpc_id = var.vpc_id != "" ? var.vpc_id : (length(data.aws_vpc.selected) > 0 ? data.aws_vpc.selected[0].id : data.aws_vpc.default[0].id)
}

resource "aws_security_group" "myapp_sg" {
  name        = "myapp-${var.stage}-sg"
  description = "Allow SSH, 3000, 4000"
  vpc_id      = local.vpc_id

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  ingress {
    from_port   = 3000
    to_port     = 3000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  ingress {
    from_port   = 4000
    to_port     = 4000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  tags = {
    Name    = "myapp-${var.stage}-sg"
    Stage   = var.stage
    Project = "myapp"
  }
}

resource "aws_instance" "myapp_ec2" {
  count         = var.instance_count
  ami           = var.myapp_ami_id
  instance_type = "t3.micro"
  key_name      = "dating-app-key-new"
  vpc_security_group_ids = [aws_security_group.myapp_sg.id]
  tags = {
    Name    = "myapp-${var.stage}-ec2-${count.index + 1}"
    Stage   = var.stage
    Project = "myapp"
  }
}

resource "aws_eip" "myapp_eip" {
  count      = var.instance_count
  instance   = aws_instance.myapp_ec2[count.index].id
  domain     = "vpc"
  tags = {
    Name    = "myapp-${var.stage}-eip-${count.index + 1}"
    Stage   = var.stage
    Project = "myapp"
  }
} 