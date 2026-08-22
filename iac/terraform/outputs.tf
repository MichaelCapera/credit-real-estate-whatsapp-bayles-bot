output "instance_public_ip" {
  description = "Public IP address of the EC2 instance"
  value       = aws_instance.credit_real_estate_bayles_whatsapp_bot.public_ip
}

output "ssh_command" {
  description = "SSH connection command"
  value       = "ssh -i ${var.project_name}-key.pem ubuntu@${aws_instance.credit_real_estate_bayles_whatsapp_bot.public_ip}"
}

output "private_key_location" {
  description = "Location of the private key file"
  value       = "${var.project_name}-key.pem"
}

output "ami_used" {
  description = "AMI ID used for the instance"
  value       = data.aws_ami.ubuntu.id
}