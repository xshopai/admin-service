# Azure Kubernetes Service (AKS) Deployment Guide

This guide provides step-by-step instructions for deploying the Admin Service to **Azure Kubernetes Service (AKS)** with Dapr integration.

---

## Prerequisites

- **Azure CLI** installed - [Install Azure CLI](https://docs.microsoft.com/en-us/cli/azure/install-azure-cli)
- **kubectl** installed - [Install kubectl](https://kubernetes.io/docs/tasks/tools/)
- **Helm 3+** installed - [Install Helm](https://helm.sh/docs/intro/install/)
- **Azure Subscription** with appropriate permissions
- **Docker** installed for building images

---

## Step-by-Step Deployment

### Step 1: Login to Azure and Set Subscription

```bash
# Login to Azure
az login

# Set subscription
az account set --subscription "<subscription-id>"

# Verify
az account show
```

### Step 2: Create Resource Group

```bash
# Set variables
RESOURCE_GROUP="rg-xshopai-aks"
LOCATION="swedencentral"

# Create resource group
az group create \
  --name $RESOURCE_GROUP \
  --location $LOCATION
```

### Step 3: Create Azure Container Registry

```bash
# Set ACR name (globally unique)
ACR_NAME="acrxshopaiaks"

# Create ACR
az acr create \
  --resource-group $RESOURCE_GROUP \
  --name $ACR_NAME \
  --sku Standard

# Login to ACR
az acr login --name $ACR_NAME

# Get ACR login server
ACR_LOGIN_SERVER=$(az acr show --name $ACR_NAME --query loginServer --output tsv)
```

### Step 4: Create AKS Cluster

```bash
# Set cluster name
CLUSTER_NAME="aks-xshopai-cluster"

# Create AKS cluster with Azure CNI
az aks create \
  --resource-group $RESOURCE_GROUP \
  --name $CLUSTER_NAME \
  --node-count 2 \
  --node-vm-size Standard_D2s_v3 \
  --enable-managed-identity \
  --attach-acr $ACR_NAME \
  --network-plugin azure \
  --enable-addons monitoring \
  --generate-ssh-keys

# Get cluster credentials
az aks get-credentials \
  --resource-group $RESOURCE_GROUP \
  --name $CLUSTER_NAME

# Verify connection
kubectl get nodes
```

### Step 5: Install Dapr on AKS

```bash
# Add Dapr Helm repository
helm repo add dapr https://dapr.github.io/helm-charts/
helm repo update

# Create namespace for Dapr
kubectl create namespace dapr-system

# Install Dapr
helm install dapr dapr/dapr \
  --namespace dapr-system \
  --set global.ha.enabled=true \
  --wait

# Verify Dapr installation
kubectl get pods -n dapr-system

# You should see:
# - dapr-operator
# - dapr-placement-server
# - dapr-sentry
# - dapr-sidecar-injector
```

### Step 6: Build and Push Docker Image

```bash
# Build image
docker build -t admin-service:latest .

# Tag for ACR
docker tag admin-service:latest $ACR_LOGIN_SERVER/admin-service:latest

# Push to ACR
docker push $ACR_LOGIN_SERVER/admin-service:latest
```

### Step 7: Create Kubernetes Namespace

```bash
# Create namespace for the application
kubectl create namespace xshopai

# Set as default namespace
kubectl config set-context --current --namespace=xshopai
```

### Step 8: Create Kubernetes Secrets

```bash
# JWT secret for token validation
kubectl create secret generic admin-jwt-secret \
  --from-literal=jwt-secret=<your-jwt-secret> \
  --from-literal=jwt-public-key="<your-jwt-public-key>" \
  -n xshopai

# Service URLs (for downstream services)
kubectl create configmap admin-service-config \
  --from-literal=user-service-url="http://user-service.xshopai.svc.cluster.local:80" \
  --from-literal=order-service-url="http://order-service.xshopai.svc.cluster.local:80" \
  --from-literal=product-service-url="http://product-service.xshopai.svc.cluster.local:80" \
  -n xshopai
```

### Step 9: Create Dapr Components

Create `k8s/dapr-components.yaml`:

```yaml
apiVersion: dapr.io/v1alpha1
kind: Component
metadata:
  name: admin-pubsub
  namespace: xshopai
spec:
  type: pubsub.azure.servicebus.topics
  version: v1
  metadata:
    - name: connectionString
      value: '<service-bus-connection-string>'
    - name: consumerID
      value: admin-service
```

Apply components:

```bash
kubectl apply -f k8s/dapr-components.yaml
```

### Step 10: Create Kubernetes Deployment

Create `k8s/deployment.yaml`:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: admin-service
  namespace: xshopai
spec:
  replicas: 2
  selector:
    matchLabels:
      app: admin-service
  template:
    metadata:
      labels:
        app: admin-service
      annotations:
        dapr.io/enabled: 'true'
        dapr.io/app-id: 'admin-service'
        dapr.io/app-port: '1003'
        dapr.io/log-level: 'info'
    spec:
      containers:
        - name: admin-service
          image: <acr-name>.azurecr.io/admin-service:latest
          ports:
            - containerPort: 1003
          env:
            - name: NODE_ENV
              value: 'production'
            - name: PORT
              value: '1003'
            - name: MESSAGING_PROVIDER
              value: 'dapr'
            - name: DAPR_PUBSUB_NAME
              value: 'admin-pubsub'
            - name: DAPR_HTTP_PORT
              value: '3500'
            - name: USER_SERVICE_URL
              valueFrom:
                configMapKeyRef:
                  name: admin-service-config
                  key: user-service-url
            - name: ORDER_SERVICE_URL
              valueFrom:
                configMapKeyRef:
                  name: admin-service-config
                  key: order-service-url
            - name: PRODUCT_SERVICE_URL
              valueFrom:
                configMapKeyRef:
                  name: admin-service-config
                  key: product-service-url
            - name: JWT_SECRET
              valueFrom:
                secretKeyRef:
                  name: admin-jwt-secret
                  key: jwt-secret
          resources:
            requests:
              memory: '256Mi'
              cpu: '250m'
            limits:
              memory: '512Mi'
              cpu: '500m'
          livenessProbe:
            httpGet:
              path: /health
              port: 1003
            initialDelaySeconds: 30
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /health/ready
              port: 1003
            initialDelaySeconds: 10
            periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: admin-service
  namespace: xshopai
spec:
  selector:
    app: admin-service
  ports:
    - port: 80
      targetPort: 1003
  type: LoadBalancer
```

Apply deployment:

```bash
kubectl apply -f k8s/deployment.yaml
```

### Step 11: Verify Deployment

```bash
# Check pods
kubectl get pods -n xshopai

# Check pod logs
kubectl logs -f deployment/admin-service -n xshopai

# Check Dapr sidecar logs
kubectl logs -f deployment/admin-service -c daprd -n xshopai

# Get service external IP
kubectl get service admin-service -n xshopai
```

### Step 12: Test the Deployed Service

```bash
# Get service IP
SERVICE_IP=$(kubectl get service admin-service -n xshopai -o jsonpath='{.status.loadBalancer.ingress[0].ip}')

# Test health endpoint
curl http://$SERVICE_IP/health

# Test ready endpoint
curl http://$SERVICE_IP/health/ready
```

---

## Configure Ingress (Optional)

### Using NGINX Ingress Controller

```bash
# Install NGINX ingress
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm repo update

helm install nginx-ingress ingress-nginx/ingress-nginx \
  --namespace ingress-nginx \
  --create-namespace

# Create ingress resource
kubectl apply -f - <<EOF
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: admin-ingress
  namespace: xshopai
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
spec:
  ingressClassName: nginx
  rules:
  - host: admin.xshopai.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: admin-service
            port:
              number: 80
EOF
```

---

## Scaling

### Horizontal Pod Autoscaler

```bash
kubectl autoscale deployment admin-service \
  --cpu-percent=70 \
  --min=2 \
  --max=10 \
  -n xshopai
```

### Manual Scaling

```bash
kubectl scale deployment admin-service --replicas=5 -n xshopai
```

---

## Rolling Updates

```bash
# Update image
kubectl set image deployment/admin-service \
  admin-service=$ACR_LOGIN_SERVER/admin-service:v2 \
  -n xshopai

# Check rollout status
kubectl rollout status deployment/admin-service -n xshopai

# Rollback if needed
kubectl rollout undo deployment/admin-service -n xshopai
```

---

## Service Dependencies

Admin Service is a **proxy service** that depends on:

| Service         | Purpose                          | Must Deploy First |
| --------------- | -------------------------------- | ----------------- |
| User Service    | User CRUD operations             | Yes               |
| Order Service   | Order CRUD operations            | Yes               |
| Product Service | Product CRUD operations          | Yes               |
| Auth Service    | JWT public key for validation    | Yes               |
| Audit Service   | Consumes admin events (optional) | No                |

Ensure User Service, Order Service, Product Service, and Auth Service are deployed before Admin Service.

---

## Cleanup Resources

```bash
# Delete deployment
kubectl delete -f k8s/deployment.yaml
kubectl delete -f k8s/dapr-components.yaml

# Delete secrets and configmaps
kubectl delete secret admin-jwt-secret -n xshopai
kubectl delete configmap admin-service-config -n xshopai

# Delete namespace (WARNING: removes all xshopai resources)
# kubectl delete namespace xshopai

# Delete AKS cluster (WARNING: destroys all resources)
# az aks delete --name $CLUSTER_NAME --resource-group $RESOURCE_GROUP --yes

# Delete resource group (WARNING: destroys everything)
# az group delete --name $RESOURCE_GROUP --yes
```
