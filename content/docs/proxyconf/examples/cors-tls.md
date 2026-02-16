+++
title = "CORS and TLS"
description = "Examples for configuring CORS and downstream TLS"
weight = 3
+++

This page provides practical examples of configuring CORS policies and TLS for your APIs.

## Cross-Origin Resource Sharing (CORS)

Enable CORS for browser-based applications:

```yaml
openapi: 3.0.3
info:
  title: CORS-Enabled API
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
  url: http://localhost:8080/cors
  cors:
    access-control-allow-origins:
      - http://*.foo.com
    access-control-allow-methods:
      - GET
      - POST
    access-control-max-age: 600
  security:
    auth:
      downstream:
        type: header
        name: my-api-key
        clients:
          testUser:
            - 9a618248b64db62d15b300a07b00580b
```

### Testing CORS Preflight

CORS preflight requests (`OPTIONS`) are unauthenticated:

```bash
# Preflight request - returns 200 with CORS headers (no auth required)
curl -X OPTIONS http://localhost:8080/cors/test \
     -H "Origin: http://app.foo.com" \
     -H "Access-Control-Request-Method: GET"
# Response headers:
#   Access-Control-Allow-Origin: http://app.foo.com
#   Access-Control-Allow-Methods: GET,POST
#   Access-Control-Max-Age: 600
```

### Testing Actual Requests

The actual request still requires authentication:

```bash
# Without auth - returns 403
curl http://localhost:8080/cors/test
# Response: RBAC: access denied

# With auth - returns 200
curl http://localhost:8080/cors/test -H "my-api-key: supersecret"
```

## Downstream TLS

Downstream TLS is implicitly configured by using an `https` URL in `x-proxyconf.url`. The server certificate is automatically selected by matching the hostname with certificates available in ProxyConf.

```yaml
openapi: 3.0.3
info:
  title: TLS-Enabled API
paths:
  /test:
    get:
      responses:
        '200':
          content:
            application/json:
              schema:
                type: object
          description: OK
    post:
      requestBody:
        content:
          application/json: {}
        required: true
      responses:
        '200':
          content:
            application/json: {}
          description: OK
servers:
  - url: https://backend.example.com/api
x-proxyconf:
  cluster: demo
  url: https://localhost:8443/downstream-tls
  listener:
    address: 127.0.0.1
    port: 8443
  security:
    auth:
      downstream: disabled
```

### Certificate Selection

ProxyConf automatically selects the server certificate by matching the hostname in `x-proxyconf.url` with:
- TLS Common Name (CN)
- TLS Subject Alternative Names (SAN)

Certificates are loaded from the path specified in `PROXYCONF_SERVER_DOWNSTREAM_TLS_PATH`.

### Testing TLS

```bash
# GET request over TLS
curl https://localhost:8443/downstream-tls/test --cacert ca.crt

# POST with valid content type
curl https://localhost:8443/downstream-tls/test \
     --cacert ca.crt \
     -H "Content-Type: application/json" \
     -d '{"hello": "world"}'

# POST with invalid content type - returns 404 (no matching route)
curl https://localhost:8443/downstream-tls/test \
     --cacert ca.crt \
     -H "Content-Type: text/plain" \
     -d "hello world"
```

## Full Example: CORS + TLS + Authentication

Combining all security features:

```yaml
openapi: 3.0.3
info:
  title: Secure API
paths:
  /data:
    get:
      responses:
        '200':
          description: OK
    post:
      requestBody:
        content:
          application/json: {}
      responses:
        '201':
          description: Created
servers:
  - url: https://backend.example.com/api
x-proxyconf:
  cluster: production
  url: https://api.example.com:443/v1
  listener:
    address: 0.0.0.0
    port: 443
  cors:
    access-control-allow-origins:
      - https://app.example.com
      - https://admin.example.com
    access-control-allow-methods:
      - GET
      - POST
      - PUT
      - DELETE
    access-control-allow-headers:
      - Content-Type
      - Authorization
      - X-API-Key
    access-control-allow-credentials: true
    access-control-max-age: 3600
  security:
    allowed-source-ips:
      - 10.0.0.0/8
      - 192.168.0.0/16
    auth:
      downstream:
        type: jwt
        provider-config:
          issuer: https://auth.example.com
          audiences:
            - api.example.com
          remote_jwks:
            http_uri:
              uri: https://auth.example.com/.well-known/jwks.json
              timeout: 1s
            cache_duration:
              seconds: 600
```

This configuration provides:
- TLS encryption for all traffic
- CORS support for specific web applications
- JWT authentication with caching
- IP filtering for internal networks only
