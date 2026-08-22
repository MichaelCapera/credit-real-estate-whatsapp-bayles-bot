variable "aws_region" {
  description = "AWS region for deployment"
  default     = "us-east-1"
}

variable "project_name" {
  description = "Project name prefix for resource naming"
  default     = "credit-real-estate-bayles-whatsapp-bot"
}

variable "instance_type" {
  description = "EC2 instance type"
  default     = "t4g.nano"
}

variable "subnet_id" {
  description = "Subnet ID for the EC2 instance"
  default     = "subnet-0d5b9e77f7c8a9d9b"
}