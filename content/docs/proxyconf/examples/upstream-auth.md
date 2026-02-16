+++
title = "Upstream Authentication"
description = "Examples for injecting credentials into upstream requests"
weight = 2
+++

This page provides practical examples of configuring upstream authentication in ProxyConf.

## Inject Upstream Header

Inject an API key header into upstream requests. This is useful when the upstream API requires a static API key that clients shouldn't have access to.

```yaml
openapi: 3.0.3
info:
  title: Inject Upstream Header
paths:
  /test:
    get:
      responses:
        '200':
          description: OK
servers:
  - url: https://backend.example.com/api
x-proxyconf:
  cluster: demo
  url: http://localhost:8080/inject-upstream-header
  security:
    auth:
      downstream: disabled
      upstream:
        type: header
        name: upstream-api-key
        value: '%SECRET:upstream-api-key%'
        overwrite: false
```

### Setting up the Secret

First, store the secret in ProxyConf:

```bash
curl -X POST https://localhost:4000/api/secret/upstream-api-key \
     -H "Authorization: Bearer $ACCESS_TOKEN" \
     --data "MY-UPSTREAM-SECRET" \
     --cacert ca.crt
```

### Testing

```bash
# Client doesn't provide the header - ProxyConf injects it
curl http://localhost:8080/inject-upstream-header/test
# Upstream receives: upstream-api-key: MY-UPSTREAM-SECRET

# Client provides the header - it's passed through (overwrite: false)
curl http://localhost:8080/inject-upstream-header/test \
     -H "upstream-api-key: client-provided-value"
# Upstream receives: upstream-api-key: client-provided-value
```

## Overwrite Client Header

Always replace a header with the configured value, regardless of what the client sends:

```yaml
x-proxyconf:
  security:
    auth:
      downstream: disabled
      upstream:
        type: header
        name: Authorization
        value: 'Bearer %SECRET:service-token%'
        overwrite: true  # Always replace
```

### Testing

```bash
# Client provides a different token - ProxyConf overwrites it
curl http://localhost:8080/api/resource \
     -H "Authorization: Bearer client-token"
# Upstream receives: Authorization: Bearer <service-token from secret>
```

## Combine with Downstream Auth

You can combine upstream credential injection with downstream authentication:

```yaml
openapi: 3.0.3
info:
  title: Combined Authentication
paths:
  /data:
    get:
      responses:
        '200':
          description: OK
servers:
  - url: https://internal-api.example.com
x-proxyconf:
  cluster: demo
  url: http://localhost:8080/combined-auth
  security:
    auth:
      downstream:
        type: header
        name: x-client-api-key
        clients:
          mobileApp:
            - 9a618248b64db62d15b300a07b00580b
          webApp:
            - abc123def456abc123def456abc123de
      upstream:
        type: header
        name: X-Internal-Service-Key
        value: '%SECRET:internal-service-key%'
```

This configuration:
1. Requires clients to authenticate with their own API key
2. Strips the client API key and injects an internal service key for the upstream

### Testing

```bash
# Without client auth - returns 403
curl http://localhost:8080/combined-auth/data

# With valid client auth - returns 200, upstream gets service key
curl http://localhost:8080/combined-auth/data \
     -H "x-client-api-key: supersecret"
# Upstream receives: X-Internal-Service-Key: <internal-service-key from secret>
```

## Bearer Token Injection

Inject a Bearer token for upstream OAuth2/OIDC protected APIs:

```yaml
x-proxyconf:
  security:
    auth:
      downstream:
        type: jwt
        provider-config:
          issuer: my-identity-provider
          audiences:
            - my-api
          remote_jwks:
            http_uri:
              uri: https://idp.example.com/.well-known/jwks.json
              timeout: 1s
      upstream:
        type: header
        name: Authorization
        value: 'Bearer %SECRET:upstream-service-account-token%'
        overwrite: true
```

This configuration:
1. Validates the client's JWT from your identity provider
2. Replaces it with a service account token for the upstream API
