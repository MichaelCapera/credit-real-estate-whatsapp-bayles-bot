# ============================================
# 📋 TERRAFORM CONFIGURATION
# ============================================

terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    tls = {
      source  = "hashicorp/tls"
      version = "~> 4.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# ============================================
# 📡 DATA SOURCES
# ============================================

data "aws_vpc" "default" {
  default = true
}

data "aws_subnets" "public" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }
}

data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"]

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd-gp3/ubuntu-noble-24.04-arm64-server-*"]
  }

  filter {
    name   = "architecture"
    values = ["arm64"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

# ============================================
# 🔑 SSH KEY PAIR
# ============================================

resource "tls_private_key" "whatsapp_key" {
  algorithm = "RSA"
  rsa_bits  = 4096
}

resource "aws_key_pair" "whatsapp_key" {
  key_name   = "${var.project_name}-key"
  public_key = tls_private_key.whatsapp_key.public_key_openssh
}

resource "local_file" "private_key" {
  content  = tls_private_key.whatsapp_key.private_key_pem
  filename = "${var.project_name}-key.pem"
  file_permission = "0400"
}

# ============================================
# 🔐 SECURITY GROUP
# ============================================

resource "aws_security_group" "whatsapp_sg" {
  name        = "${var.project_name}-sg"
  description = "WhatsApp Bot Security Group"
  vpc_id      = data.aws_vpc.default.id

  ingress {
    description = "SSH from anywhere"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "${var.project_name}-sg" }
}

# ============================================
# 🖥️ EC2 INSTANCE
# ============================================

resource "aws_instance" "credit_real_estate_bayles_whatsapp_bot" {
  ami                    = data.aws_ami.ubuntu.id
  instance_type          = var.instance_type
  key_name               = aws_key_pair.whatsapp_key.key_name
  vpc_security_group_ids = [aws_security_group.whatsapp_sg.id]
  subnet_id              = var.subnet_id 
  associate_public_ip_address = true

  user_data = <<-EOF
    #!/bin/bash
    set -e

    echo "=========================================="
    echo "🚀 INSTALLING DOCKER"
    echo "=========================================="

    apt-get update -y
    apt-get install -y ca-certificates curl gnupg lsb-release

    mkdir -p /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

    apt-get update -y
    apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

    usermod -aG docker ubuntu

    mkdir -p /home/ubuntu/whatsapp-bot
    chown ubuntu:ubuntu /home/ubuntu/whatsapp-bot

    echo "=========================================="
    echo "✅ DOCKER INSTALLED SUCCESSFULLY"
    echo "=========================================="
  EOF

  root_block_device {
    volume_size = 20
    volume_type = "gp3"
  }

  tags = {
    Name    = "${var.project_name}-instance"
    Project = var.project_name
  }
}