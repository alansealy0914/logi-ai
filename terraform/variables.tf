variable "aws_region" {
  default = "us-east-1"
}

variable "project" {
  default = "logiai"
}

variable "db_password" {
  description = "RDS master password"
  sensitive   = true
}

variable "groq_api_key" {
  description = "Groq API key for the AI assistant"
  sensitive   = true
}

variable "secret_key" {
  description = "JWT secret key"
  sensitive   = true
  default     = "change-this-to-a-strong-secret"
}

variable "eks_node_instance_type" {
  default = "t3.medium"
}

variable "eks_node_desired" {
  default = 2
}

variable "eks_node_min" {
  default = 1
}

variable "eks_node_max" {
  default = 4
}
