#!/bin/bash
set -e

echo "🚀 LogiAI AWS Deployment"
echo "========================"

# ── Prerequisites check ────────────────────────────────────────────────────
for cmd in terraform aws kubectl docker; do
  command -v $cmd &>/dev/null || { echo "❌ $cmd not found. Install it first."; exit 1; }
done

# ── Terraform ──────────────────────────────────────────────────────────────
echo ""
echo "1️⃣  Provisioning infrastructure with Terraform..."
cd terraform

terraform init
terraform plan \
  -var="db_password=${DB_PASSWORD:?Set DB_PASSWORD env var}" \
  -var="groq_api_key=${GROQ_API_KEY:?Set GROQ_API_KEY env var}" \
  -var="secret_key=${SECRET_KEY:-change-this-to-a-strong-secret}"

read -p "Apply Terraform? (yes/no): " confirm
[[ $confirm == "yes" ]] || { echo "Aborted."; exit 0; }

terraform apply -auto-approve \
  -var="db_password=$DB_PASSWORD" \
  -var="groq_api_key=$GROQ_API_KEY" \
  -var="secret_key=${SECRET_KEY:-change-this-to-a-strong-secret}"

BACKEND_ECR=$(terraform output -raw ecr_backend_url)
FRONTEND_ECR=$(terraform output -raw ecr_frontend_url)
EKS_CLUSTER=$(terraform output -raw eks_cluster_name)
RDS_ENDPOINT=$(terraform output -raw rds_endpoint)
cd ..

# ── ECR push ───────────────────────────────────────────────────────────────
echo ""
echo "2️⃣  Building and pushing Docker images to ECR..."
AWS_ACCOUNT=$(aws sts get-caller-identity --query Account --output text)
AWS_REGION=${AWS_REGION:-us-east-1}

aws ecr get-login-password --region $AWS_REGION | \
  docker login --username AWS --password-stdin $AWS_ACCOUNT.dkr.ecr.$AWS_REGION.amazonaws.com

docker build -t $BACKEND_ECR:latest  ./backend  && docker push $BACKEND_ECR:latest
docker build -t $FRONTEND_ECR:latest ./frontend && docker push $FRONTEND_ECR:latest

# ── kubeconfig ─────────────────────────────────────────────────────────────
echo ""
echo "3️⃣  Configuring kubectl..."
aws eks update-kubeconfig --name $EKS_CLUSTER --region $AWS_REGION

# ── K8s secrets ───────────────────────────────────────────────────────────
echo ""
echo "4️⃣  Applying Kubernetes secrets..."
DB_URL="postgresql+asyncpg://postgres:${DB_PASSWORD}@${RDS_ENDPOINT}/logiai"

kubectl apply -f k8s/namespace.yaml
kubectl create secret generic logiai-secrets \
  --namespace=logiai \
  --from-literal=DATABASE_URL="$DB_URL" \
  --from-literal=GROQ_API_KEY="$GROQ_API_KEY" \
  --from-literal=SECRET_KEY="${SECRET_KEY:-change-this-to-a-strong-secret}" \
  --dry-run=client -o yaml | kubectl apply -f -

# ── K8s manifests ──────────────────────────────────────────────────────────
echo ""
echo "5️⃣  Deploying to EKS..."
sed "s|BACKEND_ECR_URL|$BACKEND_ECR|g"   k8s/backend-deployment.yaml  | kubectl apply -f -
sed "s|FRONTEND_ECR_URL|$FRONTEND_ECR|g" k8s/frontend-deployment.yaml | kubectl apply -f -
kubectl apply -f k8s/services.yaml
kubectl apply -f k8s/hpa.yaml
kubectl apply -f k8s/ingress.yaml

kubectl rollout status deployment/logiai-backend  -n logiai --timeout=180s
kubectl rollout status deployment/logiai-frontend -n logiai --timeout=180s

# ── Seed database ─────────────────────────────────────────────────────────
echo ""
echo "6️⃣  Seeding database..."
BACKEND_POD=$(kubectl get pod -n logiai -l app=logiai-backend -o jsonpath='{.items[0].metadata.name}')
kubectl exec -n logiai $BACKEND_POD -- python -m seed

# ── Done ──────────────────────────────────────────────────────────────────
echo ""
echo "✅ Deployment complete!"
echo ""
echo "App URL:"
kubectl get ingress logiai-ingress -n logiai -o jsonpath='{.status.loadBalancer.ingress[0].hostname}'
echo ""
