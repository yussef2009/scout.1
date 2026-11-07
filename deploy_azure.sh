#!/usr/bin/env bash
# ==============================================================================
# SCOT AI — Microsoft Azure Container Apps Production Deployment Script
# Provisions:
#   1. Azure Resource Group (scot-ai-rg)
#   2. Azure Container Registry (ACR) & Cloud Container Build
#   3. Azure Container App Environment (scot-ai-env)
#   4. Azure Container App (scot-ai-api) with full secret injection
#   5. Custom Domain Binding (api.your-domain.tech) + Free Azure Managed SSL
# ==============================================================================

set -euo pipefail

# ── Color Output Helpers ──────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

log_info() { echo -e "${CYAN}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

echo -e "${BLUE}"
echo "=================================================================="
echo "    SCOT AI — AZURE CONTAINER APPS PRODUCTION DEPLOYMENT         "
echo "=================================================================="
echo -e "${NC}"

# ── 1. Configuration & Parameters ─────────────────────────────────────────────
RESOURCE_GROUP="${AZURE_RESOURCE_GROUP:-scot-ai-rg}"
LOCATION="${AZURE_LOCATION:-eastus}"
ENV_NAME="${AZURE_CONTAINER_ENV:-scot-ai-env}"
APP_NAME="${AZURE_APP_NAME:-scot-ai-api}"
CUSTOM_DOMAIN="${CUSTOM_DOMAIN:-api.your-domain.tech}"

# Clean unique ACR name (alphanumeric only, 5-50 chars)
RANDOM_SUFFIX=$(od -N 3 -tx1 /dev/urandom 2>/dev/null | head -1 | tr -d ' ' | cut -c1-6 || echo "$RANDOM")
ACR_NAME="${AZURE_ACR_NAME:-scotaiacr${RANDOM_SUFFIX}}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="${SCRIPT_DIR}/ai_engine/.env"

# Load local .env if available
if [[ -f "$ENV_FILE" ]]; then
  log_info "Loading environment variables from: ${ENV_FILE}"
  # Export non-comment lines
  set -a
  # shellcheck source=/dev/null
  source <(grep -v '^#' "$ENV_FILE" | grep -v '^\s*$')
  set +a
else
  log_warn "No .env file found at ${ENV_FILE}. Falling back to active environment variables."
fi

# Fallback defaults
MONGODB_URI="${MONGODB_URI:-mongodb+srv://user:password@cluster0.mongodb.net/?retryWrites=true&w=majority}"
MONGODB_DB_NAME="${MONGODB_DB_NAME:-scot_ai_db}"
APPWRITE_ENDPOINT="${APPWRITE_ENDPOINT:-https://cloud.appwrite.io/v1}"
APPWRITE_PROJECT_ID="${APPWRITE_PROJECT_ID:-}"
APPWRITE_API_KEY="${APPWRITE_API_KEY:-}"
APPWRITE_BUCKET_ID="${APPWRITE_BUCKET_ID:-scot-ai-matches}"
CLERK_SECRET_KEY="${CLERK_SECRET_KEY:-}"
ROBOFLOW_API_KEY="${ROBOFLOW_API_KEY:-}"
SENTRY_DSN="${SENTRY_DSN:-}"
DD_API_KEY="${DD_API_KEY:-}"
DD_SITE="${DD_SITE:-datadoghq.com}"
DD_SERVICE="${DD_SERVICE:-scot-ai-api}"
DD_ENV="${DD_ENV:-production}"
FRONTEND_URL="${FRONTEND_URL:-https://your-domain.tech}"

# ── 2. Pre-flight Checks ──────────────────────────────────────────────────────
log_info "Verifying Azure CLI installation..."
if ! command -v az &>/dev/null; then
  log_error "Azure CLI ('az') is not installed. Please install it: https://aka.ms/installazurecliwindows"
  exit 1
fi

log_info "Verifying Azure authentication session..."
if ! az account show &>/dev/null; then
  log_warn "Not logged in to Azure. Running 'az login'..."
  az login --use-device-code
fi

CURRENT_SUB=$(az account show --query name -o tsv)
log_success "Authenticated to Azure subscription: ${CURRENT_SUB}"

# Ensure Container Apps extension is up-to-date
log_info "Ensuring 'containerapp' Azure CLI extension is installed..."
az extension add --name containerapp --upgrade --yes &>/dev/null || true

# Register required Azure resource providers
log_info "Verifying resource provider registrations (Microsoft.App, Microsoft.OperationalInsights)..."
az provider register --namespace Microsoft.App --wait &>/dev/null || true
az provider register --namespace Microsoft.OperationalInsights --wait &>/dev/null || true

# ── 3. Azure Resource Group ───────────────────────────────────────────────────
log_info "Checking Resource Group '${RESOURCE_GROUP}' in '${LOCATION}'..."
if ! az group show --name "$RESOURCE_GROUP" &>/dev/null; then
  log_info "Creating Resource Group '${RESOURCE_GROUP}'..."
  az group create --name "$RESOURCE_GROUP" --location "$LOCATION" -o table
  log_success "Resource Group '${RESOURCE_GROUP}' created."
else
  log_info "Resource Group '${RESOURCE_GROUP}' already exists."
fi

# ── 4. Azure Container Registry (ACR) ─────────────────────────────────────────
log_info "Checking Azure Container Registry '${ACR_NAME}'..."
if ! az acr show --name "$ACR_NAME" --resource-group "$RESOURCE_GROUP" &>/dev/null; then
  log_info "Creating Azure Container Registry '${ACR_NAME}' (Basic SKU)..."
  az acr create \
    --resource-group "$RESOURCE_GROUP" \
    --name "$ACR_NAME" \
    --sku Basic \
    --admin-enabled true \
    -o table
  log_success "ACR '${ACR_NAME}' created."
else
  log_info "ACR '${ACR_NAME}' already exists."
fi

log_info "Retrieving ACR credentials..."
ACR_LOGIN_SERVER=$(az acr show --name "$ACR_NAME" --resource-group "$RESOURCE_GROUP" --query loginServer -o tsv)
ACR_USERNAME=$(az acr credential show --name "$ACR_NAME" --query username -o tsv)
ACR_PASSWORD=$(az acr credential show --name "$ACR_NAME" --query "passwords[0].value" -o tsv)
log_success "ACR Login Server: ${ACR_LOGIN_SERVER}"

# ── 5. Build Container Image via ACR Cloud Build ──────────────────────────────
IMAGE_TAG="${ACR_LOGIN_SERVER}/${APP_NAME}:latest"
log_info "Building production Docker image via ACR Cloud Build: ${IMAGE_TAG}..."
az acr build \
  --registry "$ACR_NAME" \
  --image "${APP_NAME}:latest" \
  "${SCRIPT_DIR}/ai_engine"

log_success "Container image successfully built and stored in ACR!"

# ── 6. Azure Container App Environment ────────────────────────────────────────
log_info "Checking Container App Environment '${ENV_NAME}'..."
if ! az containerapp env show --name "$ENV_NAME" --resource-group "$RESOURCE_GROUP" &>/dev/null; then
  log_info "Creating Container App Environment '${ENV_NAME}'..."
  az containerapp env create \
    --name "$ENV_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --location "$LOCATION" \
    -o table
  log_success "Container App Environment '${ENV_NAME}' created."
else
  log_info "Container App Environment '${ENV_NAME}' already exists."
fi

# ── 7. Deploy / Update Container App ──────────────────────────────────────────
log_info "Deploying container app '${APP_NAME}' with secrets & environment configuration..."

# Deploy container app with dedicated 2 vCPU and 4.0Gi RAM for YOLOv11 inference
az containerapp create \
  --name "$APP_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --environment "$ENV_NAME" \
  --image "$IMAGE_TAG" \
  --registry-server "$ACR_LOGIN_SERVER" \
  --registry-username "$ACR_USERNAME" \
  --registry-password "$ACR_PASSWORD" \
  --target-port 8000 \
  --ingress external \
  --cpu 2.0 \
  --memory 4.0Gi \
  --min-replicas 1 \
  --max-replicas 5 \
  --secrets \
    mongodb-uri="$MONGODB_URI" \
    appwrite-key="${APPWRITE_API_KEY:-not-set}" \
    clerk-key="${CLERK_SECRET_KEY:-not-set}" \
    sentry-dsn="${SENTRY_DSN:-not-set}" \
    dd-api-key="${DD_API_KEY:-not-set}" \
  --env-vars \
    ENV="production" \
    MONGODB_DB_NAME="$MONGODB_DB_NAME" \
    MONGODB_URI=secretref:mongodb-uri \
    APPWRITE_ENDPOINT="$APPWRITE_ENDPOINT" \
    APPWRITE_PROJECT_ID="$APPWRITE_PROJECT_ID" \
    APPWRITE_BUCKET_ID="$APPWRITE_BUCKET_ID" \
    APPWRITE_API_KEY=secretref:appwrite-key \
    CLERK_SECRET_KEY=secretref:clerk-key \
    ROBOFLOW_API_KEY="$ROBOFLOW_API_KEY" \
    SENTRY_DSN=secretref:sentry-dsn \
    DD_API_KEY=secretref:dd-api-key \
    DD_SITE="$DD_SITE" \
    DD_SERVICE="$DD_SERVICE" \
    DD_ENV="$DD_ENV" \
    CUSTOM_DOMAIN="https://${CUSTOM_DOMAIN}" \
    FRONTEND_URL="$FRONTEND_URL" \
    API_SUBDOMAIN="https://${CUSTOM_DOMAIN}" \
  -o table

APP_FQDN=$(az containerapp show --name "$APP_NAME" --resource-group "$RESOURCE_GROUP" --query properties.configuration.ingress.fqdn -o tsv)
log_success "Container App deployed! Default Azure FQDN: https://${APP_FQDN}"

# ── 8. Custom Domain & Managed SSL Certificate Binding ────────────────────────
echo ""
echo -e "${YELLOW}==================================================================${NC}"
echo -e "${YELLOW}               CUSTOM DOMAIN & MANAGED SSL BINDING               ${NC}"
echo -e "${YELLOW}==================================================================${NC}"
log_info "Target Custom Domain: ${CUSTOM_DOMAIN}"

# Fetch domain verification code
DOMAIN_VERIFICATION_ID=$(az containerapp show --name "$APP_NAME" --resource-group "$RESOURCE_GROUP" --query properties.customDomainVerificationId -o tsv 2>/dev/null || echo "")

echo ""
echo "Please ensure the following DNS records exist on your DNS provider (e.g., Cloudflare, Namecheap):"
echo -e "  ${GREEN}CNAME${NC} Record: ${CUSTOM_DOMAIN}  --->  ${APP_FQDN}"
if [[ -n "$DOMAIN_VERIFICATION_ID" ]]; then
  echo -e "  ${GREEN}TXT${NC}   Record: asuid.${CUSTOM_DOMAIN}  --->  ${DOMAIN_VERIFICATION_ID}"
fi
echo ""

read -rp "Have you configured the DNS records above? [y/N]: " DNS_READY
if [[ "$DNS_READY" =~ ^[Yy]$ ]]; then
  log_info "Registering custom hostname '${CUSTOM_DOMAIN}'..."
  az containerapp hostname add \
    --name "$APP_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --hostname "$CUSTOM_DOMAIN" || true

  log_info "Binding free Azure-managed SSL certificate to '${CUSTOM_DOMAIN}'..."
  az containerapp hostname bind \
    --name "$APP_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --hostname "$CUSTOM_DOMAIN" \
    --environment "$ENV_NAME" \
    --validation-method CNAME || {
      log_warn "SSL certificate issuance is in progress or pending DNS propagation."
      log_warn "You can retry domain binding anytime with:"
      echo "  az containerapp hostname bind --name $APP_NAME --resource-group $RESOURCE_GROUP --hostname $CUSTOM_DOMAIN --environment $ENV_NAME --validation-method CNAME"
    }

  log_success "Custom domain configured: https://${CUSTOM_DOMAIN}"
else
  log_info "Skipping domain binding. You can bind it later once DNS records are active."
fi

# ── 9. Final Verification ─────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}==================================================================${NC}"
echo -e "${GREEN}               SCOT AI DEPLOYMENT SUMMARY                         ${NC}"
echo -e "${GREEN}==================================================================${NC}"
echo -e "  Resource Group : ${RESOURCE_GROUP}"
echo -e "  ACR Registry   : ${ACR_LOGIN_SERVER}"
echo -e "  Container App  : ${APP_NAME}"
echo -e "  Azure Endpoint : https://${APP_FQDN}"
echo -e "  Custom Domain  : https://${CUSTOM_DOMAIN}"
echo -e "  Health Check   : https://${APP_FQDN}/health"
echo -e "  Swagger Docs   : https://${APP_FQDN}/docs"
echo -e "${GREEN}==================================================================${NC}"

