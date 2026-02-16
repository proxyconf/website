+++
title = "Downstream Authentication"
description = "Configure authentication for incoming API requests"
weight = 3
+++

The `downstream` authentication configuration applies to incoming HTTP requests. ProxyConf supports multiple authentication mechanisms that can be configured per API.

> **Note:** Defining an authentication mechanism is required, but can be opted-out by explicitly configuring `disabled`.

## Authentication Methods

### Header or Query Parameter

Authenticate clients using an API key passed in a header or query string parameter. The value is matched against MD5 hashes provided in the `clients` property.

```yaml
security:
  auth:
    downstream:
      type: header  # or "query"
      name: x-api-key
      clients:
        testUser:
          - 9a618248b64db62d15b300a07b00580b
```

| Property | Description |
|----------|-------------|
| `type` | `header` or `query` |
| `name` | The parameter name where credentials are provided |
| `clients` | Map of client names to arrays of MD5 hashes |
| `matcher` | (Optional) Regex to extract values from the parameter |

**Example with query parameter:**

```yaml
security:
  auth:
    downstream:
      type: query
      name: api_key
      clients:
        myClient:
          - 9a618248b64db62d15b300a07b00580b
```

### Basic Authentication

Authenticate using HTTP Basic Authentication. The username and password in the `Authorization` header are matched against MD5 hashes.

```yaml
security:
  auth:
    downstream:
      type: basic
      clients:
        myUser:
          - 25be91d02dbbf17aff80e21323cd0dc5
```

| Property | Description |
|----------|-------------|
| `type` | Must be `basic` |
| `clients` | Map of client names to arrays of MD5 hashes (of `username:password`) |

### JSON Web Tokens (JWT)

Authenticate using JWT tokens. The signature, audiences, and issuer claims are verified, along with time restrictions (expiration, nbf).

```yaml
security:
  auth:
    downstream:
      type: jwt
      provider-config:
        issuer: proxyconf
        audiences:
          - demo
        remote_jwks:
          http_uri:
            uri: https://127.0.0.1/api/jwks.json
            timeout: 1s
          cache_duration:
            seconds: 300
```

| Property | Description |
|----------|-------------|
| `type` | Must be `jwt` |
| `provider-config` | JWT provider configuration (see below) |

**Provider Configuration Options:**

| Option | Description |
|--------|-------------|
| `issuer` | The principal that issued the JWT (URL or email) |
| `audiences` | List of allowed JWT audiences |
| `local_jwks` | Fetch JWKS from local file or inline string |
| `remote_jwks` | Fetch JWKS from a remote HTTP server with cache duration |
| `forward` | If true, JWT will be forwarded to the upstream |
| `from_headers` | Extract JWT from HTTP headers |
| `from_params` | Extract JWT from query parameters |
| `from_cookies` | Extract JWT from HTTP cookies |
| `forward_payload_header` | Forward JWT payload in specified header |
| `claim_to_headers` | Copy JWT claims to HTTP headers |
| `jwt_cache_config` | Enable JWT caching |

See the [Envoy JWT documentation](https://www.envoyproxy.io/docs/envoy/latest/api-v3/extensions/filters/http/jwt_authn/v3/config.proto) for full configuration details.

### Mutual TLS (mTLS)

Authenticate clients using TLS client certificates. The `subject` or `SAN` in the client certificate is matched against the `clients` list.

```yaml
security:
  auth:
    downstream:
      type: mtls
      trusted-ca: /path/to/ca.crt
      clients:
        test_client:
          - CN=demo-client,OU=Client,O=MyOrg,L=City,ST=State,C=US
```

| Property | Description |
|----------|-------------|
| `type` | Must be `mtls` |
| `trusted-ca` | Path to PEM file containing trusted CAs |
| `clients` | Map of client names to arrays of certificate subjects/SANs |

### Disabled

Explicitly disable authentication. This allows untrusted traffic - use with caution.

```yaml
security:
  auth:
    downstream: disabled
```

> **Warning:** When disabling authentication, it's recommended to limit exposure by narrowing `allowed-source-ips` as much as possible.

## Generating MD5 Hashes

For header/query and basic authentication, client credentials are stored as MD5 hashes:

```bash
# For API key
echo -n "supersecret" | md5sum
# Output: 9a618248b64db62d15b300a07b00580b

# For basic auth (username:password)
echo -n "myuser:mysecret" | md5sum
# Output: 25be91d02dbbf17aff80e21323cd0dc5
```
