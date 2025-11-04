# Topology Builder - Deployment Guide

The `./deployment/` directory contains deployment artifacts for the Topology Builder application.

## Architecture

The application uses a simplified single-process architecture:

- **FastAPI backend** (Uvicorn) serves both the API and static frontend files
- **No nginx or supervisor needed** - Uvicorn handles everything
- Frontend is built as static files and served by FastAPI's StaticFiles

## Docker Deployment

### Quick Start with Docker Compose

```bash
# Navigate to docker directory
cd deployment/docker

# Build and start the application
docker-compose up -d

# View logs
docker-compose logs -f

# Stop the application
docker-compose down
```

The application will be available at:

- **Frontend & API**: http://localhost:8000
- **API Health Check**: http://localhost:8000/api/health

### Build Docker Image Manually

```bash
# From project root
docker build -f deployment/docker/Dockerfile -t topology-builder:latest .

# Run the container
docker run -d \
  -p 8000:8000 \
  --name topology-builder \
  topology-builder:latest
```

### How It Works

The Dockerfile uses a multi-stage build:

1. **Stage 1 (frontend-builder)**:
   - Uses Node.js 18
   - Installs npm dependencies
   - Builds frontend with `npm run render && npm run build`
   - Outputs static files to `dist/`

2. **Stage 2 (final)**:
   - Uses Python 3.11
   - Installs FastAPI and Uvicorn
   - Copies backend code
   - Copies built frontend to `./static` directory
   - FastAPI serves frontend files and handles API requests

## Kubernetes Deployment with Helm

### Prerequisites

- Kubernetes cluster (1.19+)
- Helm 3.x
- kubectl configured

### Install the Helm Chart

```bash
# Navigate to helm directory
cd deployment/helm

# Install the chart
helm install topology-builder ./topology-builder

# Or with custom values
helm install topology-builder ./topology-builder \
  --set image.repository=your-registry/topology-builder \
  --set image.tag=1.0.0 \
  --set ingress.enabled=true \
  --set ingress.hosts[0].host=topology.example.com
```

### Configuration Options

Key values you can customize in `values.yaml`:

```yaml
# Number of replicas
replicaCount: 1

# Docker image
image:
  repository: topology-builder
  tag: "latest"

# Service configuration (single port for both frontend and API)
service:
  type: ClusterIP
  port: 8000
  targetPort: 8000

# Ingress configuration
ingress:
  enabled: true
  className: "nginx"
  hosts:
    - host: topology.example.com
      paths:
        - path: /
          pathType: Prefix

# Resources
resources:
  limits:
    cpu: 1000m
    memory: 1Gi
  requests:
    cpu: 250m
    memory: 512Mi

# Persistent storage
persistence:
  enabled: false
  size: 10Gi
```

### Helm Commands

```bash
# Upgrade deployment
helm upgrade topology-builder ./topology-builder

# Uninstall
helm uninstall topology-builder

# View values
helm get values topology-builder

# Dry run (test without installing)
helm install topology-builder ./topology-builder --dry-run --debug
```

### Accessing the Application

After deployment:

```bash
# Get service information
kubectl get svc topology-builder

# Port forward for local access
kubectl port-forward svc/topology-builder 8080:8000

# Access at http://localhost:8080
```

With Ingress enabled:

- Access via configured hostname (e.g., http://topology.example.com)

## Environment Variables

Configure these environment variables as needed:

| Variable | Description | Default |
|----------|-------------|---------|
| `PYTHONUNBUFFERED` | Python output buffering | `1` |
| `LOG_LEVEL` | Logging level | `info` |

## Health Checks

The application provides a health check endpoint:

- **Health Check**: `http://localhost:8000/api/health`

Returns:

```json
{
  "status": "healthy",
  "message": "API is running successfully!"
}
```

## API Endpoints

- `GET /` - Serves frontend HTML
- `GET /static/*` - Static frontend assets (JS, CSS, images)
- `GET /api/health` - Health check endpoint
- `GET /api/nodes` - Get topology nodes
- `POST /api/nodes` - Create topology node

## Persistent Storage

To enable persistent storage for user data:

### Docker Compose

```yaml
services:
  topology-builder:
    volumes:
      - topology-data:/app/data

volumes:
  topology-data:
    driver: local
```

### Helm

```yaml
persistence:
  enabled: true
  size: 10Gi
  storageClass: "standard"
  mountPath: /app/data
```

## Troubleshooting

### Docker

```bash
# Check container logs
docker-compose logs -f topology-builder

# Execute into container
docker-compose exec topology-builder /bin/bash

# Check if app is running
docker-compose exec topology-builder curl http://localhost:8000/api/health
```

### Kubernetes

```bash
# Check pod status
kubectl get pods -l app.kubernetes.io/name=topology-builder

# View logs
kubectl logs -f deployment/topology-builder

# Describe pod for events
kubectl describe pod <pod-name>

# Execute into pod
kubectl exec -it <pod-name> -- /bin/bash

# Test health endpoint from inside pod
kubectl exec <pod-name> -- curl http://localhost:8000/api/health
```

### Common Issues

1. **Frontend not loading**: Check that static files were copied correctly

   ```bash
   docker exec topology-builder ls -la /app/static
   ```

2. **API not responding**: Check uvicorn is running

   ```bash
   docker logs topology-builder
   ```

3. **Port conflicts**: Ensure port 8000 is not already in use

   ```bash
   lsof -i :8000
   ```

## Building for Production

### Automated CI/CD with GitHub Actions

The repository includes a GitHub Actions workflow (`.github/workflows/docker-build-publish.yml`) that automatically builds and publishes Docker images to GitHub Container Registry (ghcr.io).

**Triggers:**

- **Push to main/develop**: Builds and pushes images tagged with branch name and `latest` (for main)
- **Version tags** (`v*.*.*`): Builds and pushes images with semantic version tags
- **Pull requests**: Builds images but doesn't push (validation only)
- **Manual**: Can be triggered via workflow_dispatch

**Image Tags:**

- `latest` - Latest build from main branch
- `main`, `develop` - Latest build from respective branches
- `v1.0.0`, `v1.0`, `v1` - Semantic version tags
- `main-abc1234` - Branch name + short commit SHA

**Usage:**

```bash
# Pull the latest image
docker pull ghcr.io/your-username/topology-builder:latest

# Pull a specific version
docker pull ghcr.io/your-username/topology-builder:v1.0.0

# Run the image
docker run -d -p 8000:8000 ghcr.io/your-username/topology-builder:latest
```

**Deploy with Helm using GitHub Container Registry:**

```bash
helm upgrade topology-builder deployment/helm/topology-builder \
  --set image.repository=ghcr.io/your-username/topology-builder \
  --set image.tag=latest
```

### Manual Push to Registry

If you need to manually build and push:

```bash
# Build image
docker build -f deployment/docker/Dockerfile -t topology-builder:1.0.0 .

# Tag for registry
docker tag topology-builder:1.0.0 your-registry.com/topology-builder:1.0.0

# Push to registry
docker push your-registry.com/topology-builder:1.0.0

# Update Helm values
helm upgrade topology-builder deployment/helm/topology-builder \
  --set image.repository=your-registry.com/topology-builder \
  --set image.tag=1.0.0
```

### Enable HTTPS with Ingress

Update `values.yaml` for ingress with TLS:

```yaml
ingress:
  enabled: true
  className: "nginx"
  annotations:
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
  hosts:
    - host: topology.example.com
      paths:
        - path: /
          pathType: Prefix
  tls:
    - secretName: topology-builder-tls
      hosts:
        - topology.example.com
```

## Development vs Production

### Local Development

The backend (`backend/main.py`) automatically detects the environment:

- **Development**: Serves from `../frontend/dist` (relative path)
- **Docker/Production**: Serves from `./static` (Docker path)

This allows seamless development without rebuilding containers.

### Production Considerations

- Use a reverse proxy (like nginx) in front if you need:
  - SSL termination
  - Rate limiting
  - Advanced caching
  - Multiple instances/load balancing

- For Kubernetes, use Ingress with nginx-ingress-controller or similar

- Consider adding:
  - Prometheus metrics endpoint
  - Structured logging (JSON format)
  - APM tracing (Jaeger, Zipkin)
  - Authentication/authorization

## Security Considerations

- The application runs as root in the container (can be changed)
- For production, consider:
  - Running as non-root user
  - Using read-only filesystems where possible
  - Implementing network policies in Kubernetes
  - Adding authentication/authorization
  - Enabling HTTPS/TLS
  - Scanning images for vulnerabilities
  - Using security contexts in Kubernetes

## Performance Tuning

### Uvicorn Workers

For production, you may want to add multiple workers:

```dockerfile
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
```

Or use gunicorn with uvicorn workers:

```dockerfile
CMD ["gunicorn", "main:app", "-k", "uvicorn.workers.UvicornWorker", "-w", "4", "-b", "0.0.0.0:8000"]
```

### Horizontal Scaling

In Kubernetes, enable autoscaling:

```yaml
autoscaling:
  enabled: true
  minReplicas: 2
  maxReplicas: 10
  targetCPUUtilizationPercentage: 70
```

## Monitoring

Consider adding:

- **Prometheus**: Export metrics from FastAPI
- **Grafana**: Visualize metrics and logs
- **Loki**: Log aggregation
- **Jaeger**: Distributed tracing
- **Health checks**: Already included at `/api/health`

## Directory Structure

```
deployment/
├── docker/
│   ├── Dockerfile              # Multi-stage build
│   ├── docker-compose.yml      # Docker Compose config
│   └── .dockerignore          # Files to exclude from build
└── helm/
    └── topology-builder/       # Helm chart
        ├── Chart.yaml
        ├── values.yaml
        └── templates/
            ├── deployment.yaml
            ├── service.yaml
            ├── ingress.yaml
            ├── serviceaccount.yaml
            └── _helpers.tpl
```
