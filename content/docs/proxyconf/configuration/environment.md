+++
title = "Environment Variables"
description = "Environment variables for configuring ProxyConf"
weight = 1
+++

This section outlines the environment variables used to configure ProxyConf. These variables control various aspects such as database setup, ports, and certificates for the control plane.

## Required Variables

### `SECRET_KEY_BASE`

Defines a base secret that is used to sign/encrypt cookies and other secrets.

```bash
# Generate with:
openssl rand 32 | base32
```

### `DB_ENCRYPTION_KEY`

Defines a secret key that is used to encrypt sensitive values stored in the database.

```bash
# Generate with:
openssl rand 32 | base32
```

### `PROXYCONF_DATABASE_URL`

Defines a database URL used to connect to the database.

**Format:** `ecto://USER:PASS@HOST/DATABASE`

### `PROXYCONF_CA_CERTIFICATE`

Defines the path to the PEM encoded CA certificate.

### `PROXYCONF_CONTROL_PLANE_CERTIFICATE`

Defines the path to the PEM encoded certificate used by the gRPC endpoint accessed by the Envoy data plane.

### `PROXYCONF_CONTROL_PLANE_PRIVATE_KEY`

Defines the path to the PEM encoded private key used by the gRPC endpoint accessed by the Envoy data plane.

### `PROXYCONF_CERTIFICATE_ISSUER_CERT`

Defines the path to the PEM encoded certificate used to automatically issue server certificates if no matching cert is available.

### `PROXYCONF_CERTIFICATE_ISSUER_KEY`

Defines the path to the PEM encoded private key used to automatically issue server certificates if no matching cert is available.

## Optional Variables

### `PROXYCONF_HOSTNAME`

Defines the hostname used to serve the management endpoint / UI.

**Default:** `localhost`

### `RELEASE_COOKIE`

Defines the distributed Erlang cookie, required to cluster multiple ProxyConf nodes.

**Default:** Generated during build. Ensure to replace it for production usage.

### `PROXYCONF_MGMT_API_CA_CERTIFICATE`

Defines the path to the PEM encoded CA certificate used by the HTTPS management API.

**Default:** The certificate defined in `PROXYCONF_CA_CERTIFICATE`

### `PROXYCONF_MGMT_API_CERTIFICATE`

Defines the path to the PEM encoded certificate used by the HTTPS management API.

**Default:** The certificate defined in `PROXYCONF_CONTROL_PLANE_CERTIFICATE`

### `PROXYCONF_MGMT_API_PRIVATE_KEY`

Defines the path to the PEM encoded private key used by the HTTPS management API.

**Default:** The private key defined in `PROXYCONF_CONTROL_PLANE_PRIVATE_KEY`

### `PROXYCONF_MGMT_API_JWT_SIGNER_KEY`

Defines the path to the PEM encoded private key used by the JWT signer.

**Default:** The private key defined in `PROXYCONF_MGMT_API_PRIVATE_KEY`

### `PROXYCONF_UPSTREAM_CA_BUNDLE`

The path to the TLS CA bundle that the Envoy proxies will use for validating upstream connections to API servers.

**Default:** `/etc/ssl/certs/ca-certificates.crt`

### `PROXYCONF_GRPC_ENDPOINT_PORT`

Specifies the TCP port on which the gRPC listener will accept connections from the Envoy proxies.

**Default:** `18000`

### `PROXYCONF_CRONTAB`

Specifies the path to a crontab file used by ProxyConf to schedule and execute periodic tasks. These tasks could include fetching OpenAPI specifications from remote locations or syncing certificates from systems like Certbot.

**Example:** `/path/to/crontab`

## Summary Table

| Variable | Required | Default |
|----------|----------|---------|
| `SECRET_KEY_BASE` | Yes | - |
| `DB_ENCRYPTION_KEY` | Yes | - |
| `PROXYCONF_DATABASE_URL` | Yes | - |
| `PROXYCONF_CA_CERTIFICATE` | Yes | - |
| `PROXYCONF_CONTROL_PLANE_CERTIFICATE` | Yes | - |
| `PROXYCONF_CONTROL_PLANE_PRIVATE_KEY` | Yes | - |
| `PROXYCONF_CERTIFICATE_ISSUER_CERT` | Yes | - |
| `PROXYCONF_CERTIFICATE_ISSUER_KEY` | Yes | - |
| `PROXYCONF_HOSTNAME` | No | `localhost` |
| `RELEASE_COOKIE` | No | Generated |
| `PROXYCONF_GRPC_ENDPOINT_PORT` | No | `18000` |
| `PROXYCONF_UPSTREAM_CA_BUNDLE` | No | `/etc/ssl/certs/ca-certificates.crt` |

## Docker Compose Example

Here's a complete `docker-compose.yml` snippet showing all required environment variables:

```yaml
services:
  proxyconf:
    image: ghcr.io/proxyconf/proxyconf:latest
    ports:
      - "4000:4000"   # Management API
      - "18000:18000" # gRPC xDS endpoint
    environment:
      # Required secrets (generate with: openssl rand 32 | base32)
      SECRET_KEY_BASE: "YOUR_SECRET_KEY_BASE_HERE"
      DB_ENCRYPTION_KEY: "YOUR_DB_ENCRYPTION_KEY_HERE"
      
      # Database connection
      PROXYCONF_DATABASE_URL: "ecto://proxyconf:proxyconf@postgres/proxyconf"
      
      # TLS certificates for control plane
      PROXYCONF_CA_CERTIFICATE: "/certs/ca.crt"
      PROXYCONF_CONTROL_PLANE_CERTIFICATE: "/certs/server.crt"
      PROXYCONF_CONTROL_PLANE_PRIVATE_KEY: "/certs/server.key"
      
      # Certificate issuer for auto-generated certs
      PROXYCONF_CERTIFICATE_ISSUER_CERT: "/certs/issuer.crt"
      PROXYCONF_CERTIFICATE_ISSUER_KEY: "/certs/issuer.key"
      
      # Optional: hostname for management UI
      PROXYCONF_HOSTNAME: "proxyconf.example.com"
    volumes:
      - ./certs:/certs:ro
    depends_on:
      - postgres

  postgres:
    image: postgres:15
    environment:
      POSTGRES_USER: proxyconf
      POSTGRES_PASSWORD: proxyconf
      POSTGRES_DB: proxyconf
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

## Generating Secrets

Generate the required secret values:

```bash
# Generate SECRET_KEY_BASE
echo "SECRET_KEY_BASE=$(openssl rand 32 | base32)"

# Generate DB_ENCRYPTION_KEY
echo "DB_ENCRYPTION_KEY=$(openssl rand 32 | base32)"

# Generate RELEASE_COOKIE (for clustering)
echo "RELEASE_COOKIE=$(openssl rand 32 | base32)"
```

## What's Next?

- [OpenAPI Extension Reference](@/docs/proxyconf/configuration/openapi-extension.md) - Configure APIs via `x-proxyconf`
- [Envoy Configuration](@/docs/proxyconf/getting-started/envoy-configuration.md) - Set up Envoy to connect to ProxyConf
