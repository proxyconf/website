+++
title = "Configuration"
description = "Configuration reference for ProxyConf"
sort_by = "weight"
template = "docs/section.html"
page_template = "docs/page.html"
+++

ProxyConf is configured through two mechanisms:

1. **Environment Variables** - Configure the ProxyConf server itself (ports, database, TLS, etc.)
2. **OpenAPI Extensions** - Configure how each API is exposed through Envoy using `x-proxyconf`

## Configuration Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    ProxyConf Configuration                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Environment Variables          OpenAPI x-proxyconf Extension   │
│  ─────────────────────          ───────────────────────────────│
│  • Server ports                 • API routing (url, listener)   │
│  • Database connection          • Authentication (downstream)   │
│  • TLS certificates             • Credential injection (up.)    │
│  • Cluster defaults             • CORS policies                 │
│  • Logging                      • Request validation            │
│                                 • HTTP connection settings      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## In This Section

| Page | Description |
|------|-------------|
| [Environment Variables](@/docs/proxyconf/configuration/environment.md) | Configure ProxyConf server settings via environment variables |
| [OpenAPI Extension](@/docs/proxyconf/configuration/openapi-extension.md) | Reference for the `x-proxyconf` OpenAPI extension |
| [Downstream Authentication](@/docs/proxyconf/configuration/downstream-auth.md) | Configure client authentication (API keys, JWT, mTLS, Basic) |
| [Upstream Authentication](@/docs/proxyconf/configuration/upstream-auth.md) | Inject credentials when calling upstream services |
| [CORS](@/docs/proxyconf/configuration/cors.md) | Configure Cross-Origin Resource Sharing policies |
| [HTTP Connection Manager](@/docs/proxyconf/configuration/http-connection-manager.md) | Fine-tune Envoy's HTTP connection handling |

## Quick Reference

### Minimal OpenAPI Configuration

```yaml
openapi: 3.0.3
info:
  title: My API
  version: 1.0.0
x-proxyconf:
  cluster: my-cluster
  url: https://api.example.com/my-api
  security:
    auth:
      downstream:
        disabled: {}
paths:
  /health:
    get:
      summary: Health check
      responses:
        '200':
          description: OK
```

### Common Configuration Patterns

| Use Case | Key Configuration |
|----------|-------------------|
| Public API (no auth) | `security.auth.downstream.disabled: {}` |
| API Key authentication | `security.auth.downstream.type: header` |
| JWT authentication | `security.auth.downstream.jwt: {...}` |
| mTLS authentication | `security.auth.downstream.mtls: {...}` |
| IP allowlisting | `security.allowed-source-ips: [...]` |
| Custom upstream auth | `security.auth.upstream: {...}` |
