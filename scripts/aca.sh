#!/bin/bash
# ============================================================================
# Azure Container Apps Deployment Script for Admin Service
# ============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

print_header() { echo -e "\n${BLUE}============================================================================${NC}"; echo -e "${BLUE}$1${NC}"; echo -e "${BLUE}============================================================================${NC}\n"; }
print_success() { echo -e "${GREEN}✓ $1${NC}"; }
print_info() { echo -e "${BLUE}ℹ $1${NC}"; }
print_error() { echo -e "${RED}✗ $1${NC}"; }

read_with_default() { read -p "$1 [$2]: " value; echo "${value:-$2}"; }

# Prerequisites
print_header "Checking Prerequisites"
command -v az &>/dev/null || { print_error "Azure CLI not installed"; exit 1; }
print_success "Azure CLI installed"
command -v docker &>/dev/null || { print_error "Docker not installed"; exit 1; }
print_success "Docker installed"
az account show &>/dev/null || az login

# Configuration
print_header "Azure Configuration"
RESOURCE_GROUP=$(read_with_default "Enter Resource Group name" "rg-xshopai-aca")
LOCATION=$(read_with_default "Enter Azure Location" "swedencentral")
ACR_NAME=$(read_with_default "Enter Azure Container Registry name" "acrxshopaiaca")
ENVIRONMENT_NAME=$(read_with_default "Enter Container Apps Environment name" "cae-xshopai-aca")
COSMOS_ACCOUNT=$(read_with_default "Enter Cosmos DB account name" "cosmos-xshopai-aca")

APP_NAME="admin-service"
APP_PORT=1013
DATABASE_NAME="admin_db"

read -p "Proceed with deployment? (y/N): " confirm
[[ ! "$confirm" =~ ^[Yy]$ ]] && exit 0

# Cosmos DB
print_header "Setting Up Cosmos DB"
if az cosmosdb show --name "$COSMOS_ACCOUNT" --resource-group "$RESOURCE_GROUP" &>/dev/null; then
    print_info "Cosmos DB account exists"
else
    az cosmosdb create \
        --name "$COSMOS_ACCOUNT" \
        --resource-group "$RESOURCE_GROUP" \
        --kind MongoDB \
        --capabilities EnableMongo \
        --default-consistency-level Session \
        --output none
    print_success "Cosmos DB account created"
fi

COSMOS_CONNECTION_STRING=$(az cosmosdb keys list \
    --name "$COSMOS_ACCOUNT" \
    --resource-group "$RESOURCE_GROUP" \
    --type connection-strings \
    --query "connectionStrings[0].connectionString" -o tsv)

# Build and Push
print_header "Building and Deploying"
ACR_LOGIN_SERVER=$(az acr show --name "$ACR_NAME" --query loginServer -o tsv)
az acr login --name "$ACR_NAME"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVICE_DIR="$(dirname "$SCRIPT_DIR")"
cd "$SERVICE_DIR"

IMAGE_TAG="${ACR_LOGIN_SERVER}/${APP_NAME}:latest"
docker build -t "$IMAGE_TAG" .
docker push "$IMAGE_TAG"
print_success "Image pushed: $IMAGE_TAG"

# Container App
if ! az containerapp env show --name "$ENVIRONMENT_NAME" --resource-group "$RESOURCE_GROUP" &>/dev/null; then
    az containerapp env create \
        --name "$ENVIRONMENT_NAME" \
        --resource-group "$RESOURCE_GROUP" \
        --location "$LOCATION" \
        --output none
fi

if az containerapp show --name "$APP_NAME" --resource-group "$RESOURCE_GROUP" &>/dev/null; then
    az containerapp update \
        --name "$APP_NAME" \
        --resource-group "$RESOURCE_GROUP" \
        --image "$IMAGE_TAG" \
        --output none
    print_success "Container app updated"
else
    az containerapp create \
        --name "$APP_NAME" \
        --resource-group "$RESOURCE_GROUP" \
        --environment "$ENVIRONMENT_NAME" \
        --image "$IMAGE_TAG" \
        --registry-server "$ACR_LOGIN_SERVER" \
        --target-port "$APP_PORT" \
        --ingress internal \
        --min-replicas 1 \
        --max-replicas 5 \
        --cpu 0.5 \
        --memory 1Gi \
        --enable-dapr \
        --dapr-app-id "$APP_NAME" \
        --dapr-app-port "$APP_PORT" \
        --secrets "cosmos-conn=$COSMOS_CONNECTION_STRING" \
        --env-vars \
            "PORT=$APP_PORT" \
            "NODE_ENV=production" \
            "MONGODB_URI=secretref:cosmos-conn" \
            "MONGODB_DATABASE=$DATABASE_NAME" \
            "LOG_LEVEL=info" \
            "DAPR_HTTP_PORT=3500" \
            "DAPR_GRPC_PORT=50001" \
            "DAPR_PUBSUB_NAME=pubsub" \
        --output none
    print_success "Container app created"
fi

print_header "Deployment Complete!"
echo -e "${GREEN}Admin Service deployed! Dapr App ID: $APP_NAME${NC}"
