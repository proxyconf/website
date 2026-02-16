+++
title = "Upstream Authentication"
description = "Configure credential injection for upstream API requests"
weight = 4
+++

Upstream authentication allows ProxyConf to inject credentials into requests sent to upstream services. This is useful when APIs require authentication that clients don't have access to, such as internal API keys or service tokens.

## Header Injection

Inject a header with credentials into upstream requests:

```yaml
security:
  auth:
    downstream: disabled
    upstream:
      type: header
      name: upstream-api-key
      value: '%SECRET:upstream-api-key%'
      overwrite: false
```

| Property | Description |
|----------|-------------|
| `type` | Must be `header` |
| `name` | The header name where credentials are injected |
| `value` | The header value to inject |
| `overwrite` | If `true`, overwrites existing header (default: `true`) |

## Using Secrets

To avoid storing sensitive credentials in your OpenAPI specification, use the secret reference syntax:

```yaml
value: '%SECRET:secret-name%'
```

Secrets are stored in ProxyConf and referenced by name. To set a secret:

```bash
curl -X POST https://localhost:4000/api/secret/upstream-api-key \
     -H "Authorization: Bearer <ACCESS-TOKEN>" \
     --data "MY-UPSTREAM-SECRET" \
     --cacert ca.crt
```

## Example: Static API Key Injection

When your upstream API requires an API key that clients shouldn't know:

```yaml
openapi: 3.0.3
info:
  title: My API
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
  url: http://localhost:8080/my-api
  security:
    auth:
      downstream: disabled
      upstream:
        type: header
        name: X-Internal-API-Key
        value: '%SECRET:internal-api-key%'
```

## Overwrite Behavior

The `overwrite` property controls what happens when the client already provides the header:

- **`overwrite: true`** (default) - Always replace the header with the configured value
- **`overwrite: false`** - Only inject if the client didn't provide the header

```yaml
upstream:
  type: header
  name: authorization
  value: 'Bearer %SECRET:service-token%'
  overwrite: false  # Preserve client's token if provided
```
