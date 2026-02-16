+++
title = "Quickstart"
description = "Get up and running with ProxyConf in minutes using Docker"
weight = 1
+++

This guide walks you through setting up ProxyConf with the demo environment. You'll have a fully functional API gateway managing the Swagger Petstore API in just a few minutes.

## Prerequisites

Before you begin, ensure you have the following installed:

| Requirement | Minimum Version | Check Command |
|-------------|-----------------|---------------|
| Docker | 20.10+ | `docker --version` |
| Docker Compose | 2.0+ | `docker compose version` |
| curl | Any | `curl --version` |
| Git | Any | `git --version` |

**System Requirements:**
- 2GB+ available RAM
- 1GB+ available disk space
- Ports 4000 and 8080 available

## Demo Setup

To quickly explore the capabilities of ProxyConf, we provide a demo environment that can be easily launched using Docker Compose. The demo setup includes all the necessary components to run a local instance of Envoy with ProxyConf, configured to proxy traffic to a local instance of the **Swagger Petstore** API.

### Steps to Run the Demo

**1. Clone the repository and start the demo environment:**

```bash
git clone https://github.com/proxyconf/proxyconf.git
cd proxyconf/demo
docker-compose up --pull always
```

**2. Create OAuth Client Configuration**

Use the following command to create an OAuth client configuration, which is required to retrieve an access token for managing the cluster:

```bash
curl -X POST https://localhost:4000/api/create-config/demo \
     --cacert test/support/certs/snakeoil-ca.crt
```

Example response:

```json
{
    "client_id": "demo",
    "client_secret": "1Q1ea-txiDn8AQ39Vs69CLn3k9yFBy-eQOcTyw6pE5gQmZvr5wOMD0RpkZCKUunk"
}
```

**3. Retrieve OAuth Access Token**

Use the generated OAuth client configuration to retrieve an access token:

```bash
curl -X POST "https://localhost:4000/api/access-token?client_id=demo&client_secret=<YOUR_CLIENT_SECRET>&grant_type=client_credentials" \
     --cacert test/support/certs/snakeoil-ca.crt
```

Example response:

```json
{
    "access_token": "ACCESS-TOKEN",
    "created_at": "2024-12-10T21:08:33",
    "expires_in": 7200,
    "refresh_token": null,
    "scope": "cluster-admin",
    "token_type": "bearer"
}
```

**4. Upload the Petstore Specification**

Upload the OpenAPI specification of the Swagger Petstore to ProxyConf:

```bash
curl -X POST https://localhost:4000/api/upload/petstore \
     -H "Authorization: Bearer <ACCESS-TOKEN>" \
     -H "Content-Type: application/yaml" \
     --data-binary "@demo/proxyconf/oas3specs/petstore.yaml" \
     --cacert test/support/certs/snakeoil-ca.crt
```

Response:

```text
OK
```

**5. Test the Setup**

The demo environment configures ProxyConf to manage and secure the Swagger Petstore API. The Petstore API is reachable at `https://localhost:8080/petstore`.

Test the setup with an example API key configured in the `petstore.yaml` OpenAPI specification:

```bash
curl -X GET "https://localhost:8080/petstore/pet/findByStatus?status=pending" \
     -H "my-api-key: supersecret" \
     --cacert test/support/certs/snakeoil-ca.crt
```

Example response:

```json
[
    {
        "id": 3,
        "category": { "id": 2, "name": "Cats" },
        "name": "Cat 3",
        "photoUrls": ["url1", "url2"],
        "tags": [
            { "id": 1, "name": "tag3" },
            { "id": 2, "name": "tag4" }
        ],
        "status": "pending"
    }
]
```

## Demo Components

| Component | Description |
|-----------|-------------|
| **Envoy Proxy** | Handles traffic routing and load balancing |
| **ProxyConf** | Configures Envoy using OpenAPI specs, providing centralized policy management |
| **Swagger Petstore** | Demo API that Envoy proxies traffic to |
| **PostgreSQL** | Persistence layer for ProxyConf |

This demo provides a hands-on way to see how ProxyConf simplifies the configuration and management of Envoy.

## Troubleshooting

### Port Already in Use

```
Error: Bind for 0.0.0.0:4000 failed: port is already allocated
```

**Solution:** Stop any services using ports 4000 or 8080, or modify the `docker-compose.yml` to use different ports.

```bash
# Find what's using the port
lsof -i :4000
# or on Linux
ss -tlnp | grep 4000
```

### Certificate Errors

```
curl: (60) SSL certificate problem: unable to get local issuer certificate
```

**Solution:** Ensure you're using the `--cacert` flag with the provided snakeoil certificate:

```bash
curl --cacert test/support/certs/snakeoil-ca.crt ...
```

For development/testing only, you can skip certificate verification (not recommended for production):

```bash
curl -k ...
```

### Container Fails to Start

```
ERROR: Service 'proxyconf' failed to build
```

**Solution:** Try pulling fresh images:

```bash
docker-compose down -v
docker-compose pull
docker-compose up
```

### OAuth Token Expired

```json
{"error": "invalid_token", "error_description": "Token has expired"}
```

**Solution:** Access tokens expire after 2 hours (7200 seconds). Request a new token using Step 3.

### No Response from API

If `curl` hangs or times out when accessing `https://localhost:8080/petstore`:

1. Check that all containers are running:
   ```bash
   docker-compose ps
   ```

2. Check Envoy logs for errors:
   ```bash
   docker-compose logs envoy
   ```

3. Verify the OpenAPI spec was uploaded successfully (Step 4).

## What's Next?

- [Envoy Configuration](@/docs/proxyconf/getting-started/envoy-configuration.md) - Learn how to configure Envoy's bootstrap for ProxyConf
- [Environment Variables](@/docs/proxyconf/configuration/environment.md) - Configure ProxyConf for your environment
- [OpenAPI Extension Reference](@/docs/proxyconf/configuration/openapi-extension.md) - Learn about `x-proxyconf` extensions
- [Examples](@/docs/proxyconf/examples/_index.md) - See real-world configuration examples
