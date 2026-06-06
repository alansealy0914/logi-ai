provider "aws" {
  region = "us-east-1"
}

# VPC, Subnets, Security Groups (omitted for brevity - use defaults or expand)

resource "aws_db_instance" "logiai_postgres" {
  allocated_storage    = 50
  engine               = "postgres"
  engine_version       = "16"
  instance_class       = "db.r6g.large"
  identifier           = "logiai-db"
  username             = "postgres"
  password             = var.db_password
  db_name              = "logiai"
  skip_final_snapshot  = true
  # Enable pgvector via parameter group
}

resource "aws_ecs_cluster" "logiai" {
  name = "logiai-cluster"
}

resource "aws_ecs_task_definition" "backend" {
  family                   = "logiai-backend"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "1024"
  memory                   = "2048"
  execution_role_arn       = aws_iam_role.ecs_task_execution.arn

  container_definitions = jsonencode([{
    name  = "backend"
    image = "your-ecr-repo/logiai-backend:latest"
    portMappings = [{ containerPort = 8000 }]
    environment = [
      { name = "GROQ_API_KEY", value = var.groq_key }
    ]
  }])
}

# ECR, Load Balancer, etc. (add as needed)