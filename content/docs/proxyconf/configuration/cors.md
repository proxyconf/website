+++
title = "CORS Configuration"
description = "Configure Cross-Origin Resource Sharing for your APIs"
weight = 5
+++

Cross-Origin Resource Sharing (CORS) controls how browsers handle requests from different origins. ProxyConf allows you to configure CORS policies per API.

## Configuration

Add the `cors` property to your `x-proxyconf` configuration:

```yaml
x-proxyconf:
  cors:
    access-control-allow-origins:
      - http://*.example.com
      - https://app.mysite.com
    access-control-allow-methods:
      - GET
      - POST
      - PUT
      - DELETE
    access-control-allow-headers:
      - Content-Type
      - Authorization
    access-control-expose-headers:
      - X-Request-Id
    access-control-max-age: 600
    access-control-allow-credentials: true
```

## Properties

### `access-control-allow-origins`

Controls the `Access-Control-Allow-Origin` response header. Specifies which origins can access the resource.

| Property | Value |
|----------|-------|
| Type | `array` of strings |
| Required | Yes (if using CORS) |

Supports wildcard patterns:
- `http://*.foo.com` matches `http://bar.foo.com`, `http://baz.foo.com`, etc.

### `access-control-allow-methods`

Controls the `Access-Control-Allow-Methods` response header. Specifies which HTTP methods are allowed.

| Property | Value |
|----------|-------|
| Type | `array` of strings |
| Required | No |

```yaml
access-control-allow-methods:
  - GET
  - POST
  - PUT
  - DELETE
  - PATCH
```

### `access-control-allow-headers`

Controls the `Access-Control-Allow-Headers` response header. Specifies which headers can be used in the actual request.

| Property | Value |
|----------|-------|
| Type | `array` of strings |
| Required | No |

```yaml
access-control-allow-headers:
  - Content-Type
  - Authorization
  - X-Requested-With
```

### `access-control-expose-headers`

Controls the `Access-Control-Expose-Headers` response header. Specifies which response headers should be accessible to browser JavaScript.

| Property | Value |
|----------|-------|
| Type | `array` of strings |
| Required | No |

```yaml
access-control-expose-headers:
  - X-Request-Id
  - X-RateLimit-Remaining
```

### `access-control-max-age`

Controls the `Access-Control-Max-Age` response header. Specifies how long (in seconds) preflight request results can be cached.

| Property | Value |
|----------|-------|
| Type | `integer` |
| Required | No |
| Minimum | 0 |

Browser limits:
- Firefox: max 24 hours (86400 seconds)
- Chromium v76+: max 2 hours (7200 seconds)
- Chromium pre-v76: max 10 minutes (600 seconds)
- Default: 5 seconds

### `access-control-allow-credentials`

Controls the `Access-Control-Allow-Credentials` response header. Indicates whether credentials (cookies, authorization headers, TLS client certificates) can be included in cross-origin requests.

| Property | Value |
|----------|-------|
| Type | `boolean` |
| Required | No |

## Complete Example

```yaml
openapi: 3.0.3
info:
  title: CORS-Enabled API
paths:
  /data:
    get:
      responses:
        '200':
          description: OK
servers:
  - url: https://api.example.com
x-proxyconf:
  cluster: demo
  url: http://localhost:8080/cors-api
  cors:
    access-control-allow-origins:
      - http://*.myapp.com
      - https://dashboard.myapp.com
    access-control-allow-methods:
      - GET
      - POST
    access-control-allow-headers:
      - Content-Type
      - Authorization
    access-control-max-age: 600
  security:
    auth:
      downstream:
        type: header
        name: x-api-key
        clients:
          webApp:
            - 9a618248b64db62d15b300a07b00580b
```

## Preflight Requests

CORS preflight requests (`OPTIONS`) are handled automatically by Envoy and are **unauthenticated**. This allows browsers to check CORS policies before sending the actual request.

The actual request (`GET`, `POST`, etc.) still requires authentication as configured.
