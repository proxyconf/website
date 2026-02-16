+++
title = "HTTP Connection Manager"
description = "Configure Envoy's HTTP Connection Manager settings"
weight = 6
+++

The `http-connection-manager` property configures the Envoy HttpConnectionManager used to serve your API. ProxyConf automatically configures a filter chain per VHost/Listener, enabling specific HTTP connection manager configurations per filter chain.

## Configuration

```yaml
x-proxyconf:
  http-connection-manager:
    server-name: my-api-server
    server-header-transformation: OVERWRITE
    common-http-protocol-options:
      idle-timeout:
        seconds: 300
      max-headers-count: 100
      max-requests-per-connection: 1000
```

## Properties

### `server-name`

The server name to use in responses.

| Property | Value |
|----------|-------|
| Type | `string` |
| Required | No |

### `server-header-transformation`

Controls how the `Server` header is handled in responses.

| Property | Value |
|----------|-------|
| Type | `enum` |
| Required | No |
| Options | `PASS_THROUGH`, `APPEND_IF_ABSENT`, `OVERWRITE` |

- **`PASS_THROUGH`** - Pass through the upstream's Server header unchanged
- **`APPEND_IF_ABSENT`** - Add server name only if not present
- **`OVERWRITE`** - Always replace with configured server name

### `common-http-protocol-options`

Additional settings for HTTP requests handled by the connection manager. These apply to both HTTP/1.1 and HTTP/2 requests.

#### `idle-timeout`

The idle timeout for connections. Connections will be closed if there are no active requests for this duration.

```yaml
idle-timeout:
  seconds: 300
```

#### `max-connection-duration`

Maximum duration of a connection. After this time, the connection will be closed.

```yaml
max-connection-duration:
  seconds: 3600
```

#### `max-stream-duration`

Maximum duration of a single stream (request/response).

```yaml
max-stream-duration:
  seconds: 60
```

#### `max-headers-count`

Maximum number of headers allowed in a request.

| Property | Value |
|----------|-------|
| Type | `integer` |
| Minimum | 0 |

#### `max-requests-per-connection`

Maximum number of requests per connection before it's closed.

| Property | Value |
|----------|-------|
| Type | `integer` |
| Minimum | 0 |

#### `max-response-headers-kb`

Maximum size of response headers in kilobytes.

| Property | Value |
|----------|-------|
| Type | `integer` |
| Minimum | 0 |

#### `headers-with-underscores-action`

Action to take when headers contain underscores.

| Property | Value |
|----------|-------|
| Type | `enum` |
| Options | `ALLOW`, `DROP_HEADER`, `REJECT_REQUEST` |

- **`ALLOW`** - Allow headers with underscores
- **`DROP_HEADER`** - Silently drop headers containing underscores
- **`REJECT_REQUEST`** - Reject the entire request

## Example

```yaml
openapi: 3.0.3
info:
  title: High-Performance API
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
  url: http://localhost:8080/api
  http-connection-manager:
    server-name: MyAPI/1.0
    server-header-transformation: OVERWRITE
    common-http-protocol-options:
      idle-timeout:
        seconds: 120
      max-headers-count: 50
      max-requests-per-connection: 500
      headers-with-underscores-action: DROP_HEADER
  security:
    auth:
      downstream: disabled
```
