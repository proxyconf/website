+++
title = "Examples"
description = "Real-world configuration examples for ProxyConf"
sort_by = "weight"
template = "docs/section.html"
page_template = "docs/page.html"
+++

Learn how to configure ProxyConf through practical examples covering authentication, CORS, TLS, and more.

## Available Examples

| Example | Description |
|---------|-------------|
| [Downstream Authentication](@/docs/proxyconf/examples/downstream-auth.md) | Protect APIs with API keys, JWT tokens, Basic auth, and mTLS |
| [Upstream Authentication](@/docs/proxyconf/examples/upstream-auth.md) | Inject credentials when calling backend services |
| [CORS and TLS](@/docs/proxyconf/examples/cors-tls.md) | Configure cross-origin policies and TLS termination |

## Quick Examples

### Public API (No Authentication)

```yaml
x-proxyconf:
  cluster: my-cluster
  url: https://api.example.com/public
  security:
    auth:
      downstream:
        disabled: {}
```

### API Key Authentication

```yaml
x-proxyconf:
  cluster: my-cluster
  url: https://api.example.com/secure
  security:
    auth:
      downstream:
        type: header
        name: x-api-key
        clients:
          my-client:
            - 5e884898da28047151d0e56f8dc62927  # MD5 hash
```

### JWT Authentication

```yaml
x-proxyconf:
  cluster: my-cluster
  url: https://api.example.com/jwt-secured
  security:
    auth:
      downstream:
        jwt:
          provider_config:
            issuer: https://auth.example.com
            audiences:
              - my-api
            remote_jwks:
              http_uri:
                uri: https://auth.example.com/.well-known/jwks.json
```

### IP Allowlisting + Authentication

```yaml
x-proxyconf:
  cluster: my-cluster
  url: https://api.example.com/internal
  security:
    allowed-source-ips:
      - 10.0.0.0/8
      - 192.168.0.0/16
    auth:
      downstream:
        type: header
        name: x-api-key
        clients:
          internal-service:
            - 098f6bcd4621d373cade4e832627b4f6
```

## See Also

- [OpenAPI Extension Reference](@/docs/proxyconf/configuration/openapi-extension.md) - Complete configuration reference
- [Downstream Authentication](@/docs/proxyconf/configuration/downstream-auth.md) - Detailed auth configuration guide
- [Upstream Authentication](@/docs/proxyconf/configuration/upstream-auth.md) - Backend credential injection
