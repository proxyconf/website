+++
title = "OpenAPI Extension"
description = "The x-proxyconf OpenAPI extension reference"
weight = 2
+++

ProxyConf extends the OpenAPI specification with the `x-proxyconf` property to configure how APIs are exposed through Envoy. This page documents all available configuration options.

## Overview

The `x-proxyconf` property is added at the root level of your OpenAPI specification:

```yaml
openapi: 3.0.3
info:
  title: My API
x-proxyconf:
  api-id: my-api
  cluster: proxyconf-envoy-cluster
  url: https://api.example.com:8080/my-api
  listener:
    address: 127.0.0.1
    port: 8080
  security:
    allowed-source-ips:
      - 192.168.0.0/16
    auth:
      downstream:
        type: header
        name: x-api-key
        clients:
          testUser:
            - 9a618248b64db62d15b300a07b00580b
```

## Properties

### `api-id`

A unique identifier for the API, used for API-specific logging, monitoring, and identification in ProxyConf and Envoy.

| Property | Value |
|----------|-------|
| Type | `string` |
| Required | No |
| Min Length | 1 |

### `cluster`

The cluster identifier groups APIs for Envoy. This cluster name should also be reflected in the static bootstrap configuration of Envoy.

| Property | Value |
|----------|-------|
| Type | `string` |
| Required | No |
| Min Length | 1 |

### `url`

The API URL serves multiple functions:

- **Scheme:** Determines if TLS or non-TLS listeners are used (`http` or `https`)
- **Domain:** Used for virtual host matching in Envoy
- **Path:** Configures prefix matching in Envoy's filter chain
- **Port:** If specified, overrides the default listener port

| Property | Value |
|----------|-------|
| Type | `string` |
| Required | No |
| Format | URI |

### `listener`

Configures the Envoy listener used to serve this API. Depending on the specified `url` property, a TLS context is configured.

| Property | Value |
|----------|-------|
| Type | `object` |
| Required | No |

#### `listener.address`

The IP address Envoy listens for new TCP connections.

| Property | Value |
|----------|-------|
| Type | `string` (IPv4 or IPv6) |
| Default | `127.0.0.1` |

#### `listener.port`

The port is extracted from the specified `url` property if explicitly provided. Implicit ports 80/443 for http/https are replaced by the default.

| Property | Value |
|----------|-------|
| Type | `integer` |
| Default | `8080` |
| Range | 1-65535 |

### `security`

Configures API-specific security features, such as IP filtering and authentication mechanisms.

| Property | Value |
|----------|-------|
| Type | `object` |
| Required | Yes |

#### `security.allowed-source-ips`

An array of allowed source IP ranges (in CIDR notation) that are permitted to access the API.

| Property | Value |
|----------|-------|
| Type | `array` of CIDR strings |
| Required | No |

**Example:**
```yaml
security:
  allowed-source-ips:
    - 192.168.0.0/16
    - 10.0.0.0/8
```

#### `security.auth`

Handles authentication for both downstream and upstream requests.

##### `security.auth.downstream`

Configures the authentication mechanism applied to downstream HTTP requests. See [Downstream Authentication](/docs/proxyconf/configuration/downstream-auth/) for details.

##### `security.auth.upstream`

Configures credential injection for upstream requests. See [Upstream Authentication](/docs/proxyconf/configuration/upstream-auth/) for details.

### `cors`

Defines the Cross-Origin Resource Sharing (CORS) policy. See [CORS Configuration](/docs/proxyconf/configuration/cors/) for details.

### `routing`

Configures request validation behavior.

#### `routing.fail-fast-on-missing-query-parameter`

Reject requests missing required query parameters.

| Property | Value |
|----------|-------|
| Type | `boolean` |
| Default | `true` |

#### `routing.fail-fast-on-missing-header-parameter`

Reject requests missing required headers as defined in the OpenAPI spec.

| Property | Value |
|----------|-------|
| Type | `boolean` |
| Default | `true` |

#### `routing.fail-fast-on-wrong-media-type`

Reject requests where the `content-type` header doesn't match the media types specified in the OpenAPI request body spec.

| Property | Value |
|----------|-------|
| Type | `boolean` |
| Default | `true` |

### `http-connection-manager`

Configures the Envoy HttpConnectionManager used to serve this API. See [HTTP Connection Manager](/docs/proxyconf/configuration/http-connection-manager/) for details.

### `oauth`

OAuth configuration options. Currently a placeholder for future OAuth integration features.

## Complete Working Example

Here's a complete OpenAPI specification with all common `x-proxyconf` options configured:

```yaml
openapi: 3.0.3
info:
  title: User Service API
  description: API for managing users
  version: 1.0.0

x-proxyconf:
  # Unique identifier for this API
  api-id: user-service
  
  # Cluster name (must match Envoy node.cluster)
  cluster: production-cluster
  
  # Public URL - determines TLS, domain matching, and path prefix
  url: https://api.example.com:8443/users
  
  # Listener configuration
  listener:
    address: 0.0.0.0
    port: 8443
  
  # Security settings
  security:
    # IP allowlist (optional)
    allowed-source-ips:
      - 10.0.0.0/8
      - 192.168.0.0/16
    
    auth:
      # Downstream (client) authentication
      downstream:
        type: header
        name: x-api-key
        clients:
          web-app:
            - 5e884898da28047151d0e56f8dc62927  # MD5 hash of API key
          mobile-app:
            - 098f6bcd4621d373cade4e832627b4f6
      
      # Upstream credential injection
      upstream:
        type: header
        name: Authorization
        value_ref: user-service-token
  
  # CORS configuration
  cors:
    allow_origins:
      - exact: https://app.example.com
      - prefix: https://staging.
    allow_methods:
      - GET
      - POST
      - PUT
      - DELETE
    allow_headers:
      - Content-Type
      - Authorization
      - X-Api-Key
    expose_headers:
      - X-Request-Id
    max_age: 86400
    allow_credentials: true
  
  # Request validation
  routing:
    fail-fast-on-missing-query-parameter: true
    fail-fast-on-missing-header-parameter: true
    fail-fast-on-wrong-media-type: true
  
  # HTTP connection manager settings
  http-connection-manager:
    stream_idle_timeout: 300s
    request_timeout: 60s

# Standard OpenAPI paths
paths:
  /health:
    get:
      summary: Health check endpoint
      operationId: healthCheck
      responses:
        '200':
          description: Service is healthy
          content:
            application/json:
              schema:
                type: object
                properties:
                  status:
                    type: string
                    example: ok

  /{user_id}:
    get:
      summary: Get user by ID
      operationId: getUser
      parameters:
        - name: user_id
          in: path
          required: true
          schema:
            type: string
            format: uuid
      responses:
        '200':
          description: User found
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/User'
        '404':
          description: User not found

    put:
      summary: Update user
      operationId: updateUser
      parameters:
        - name: user_id
          in: path
          required: true
          schema:
            type: string
            format: uuid
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/UserUpdate'
      responses:
        '200':
          description: User updated
        '400':
          description: Invalid request

components:
  schemas:
    User:
      type: object
      properties:
        id:
          type: string
          format: uuid
        email:
          type: string
          format: email
        name:
          type: string
        created_at:
          type: string
          format: date-time

    UserUpdate:
      type: object
      properties:
        email:
          type: string
          format: email
        name:
          type: string
```

## What's Next?

- [Downstream Authentication](@/docs/proxyconf/configuration/downstream-auth.md) - Detailed guide on client authentication options
- [Upstream Authentication](@/docs/proxyconf/configuration/upstream-auth.md) - Configure credential injection for backend services
- [CORS Configuration](@/docs/proxyconf/configuration/cors.md) - Set up cross-origin resource sharing
- [Examples](@/docs/proxyconf/examples/_index.md) - See more real-world configuration examples
