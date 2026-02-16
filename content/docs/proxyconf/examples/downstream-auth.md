+++
title = "Downstream Authentication"
description = "Examples for configuring downstream authentication"
weight = 1
+++

This page provides practical examples of configuring downstream authentication in ProxyConf.

## API Key in Query Parameter

Authenticate clients using an API key passed as a query parameter:

```yaml
openapi: 3.0.3
info:
  title: API Key in Query Parameter
paths:
  /test:
    get:
      parameters:
        - in: query
          name: my-api-key
          schema:
            type: string
      responses:
        '200':
          description: OK
servers:
  - url: https://backend.example.com/api
x-proxyconf:
  cluster: demo
  url: http://localhost:8080/api-key-in-query
  security:
    auth:
      downstream:
        type: query
        name: my-api-key
        clients:
          testUser:
            - 9a618248b64db62d15b300a07b00580b
```

**Testing:**

```bash
# Without API key - returns 403
curl http://localhost:8080/api-key-in-query/test
# Response: RBAC: access denied

# With correct API key - returns 200
curl "http://localhost:8080/api-key-in-query/test?my-api-key=supersecret"

# With wrong API key - returns 403
curl "http://localhost:8080/api-key-in-query/test?my-api-key=wrongsecret"
# Response: RBAC: access denied
```

## API Key in Request Header

Authenticate clients using an API key passed in a request header:

```yaml
openapi: 3.0.3
info:
  title: API Key in Request Header
paths:
  /test:
    get:
      parameters:
        - in: header
          name: my-api-key
          schema:
            type: string
      responses:
        '200':
          description: OK
servers:
  - url: https://backend.example.com/api
x-proxyconf:
  cluster: demo
  url: http://localhost:8080/api-key
  security:
    auth:
      downstream:
        type: header
        name: my-api-key
        clients:
          testUser:
            - 9a618248b64db62d15b300a07b00580b
```

**Testing:**

```bash
# Without API key - returns 403
curl http://localhost:8080/api-key/test

# With correct API key - returns 200
curl http://localhost:8080/api-key/test -H "my-api-key: supersecret"

# With wrong API key - returns 403
curl http://localhost:8080/api-key/test -H "my-api-key: wrongsecret"
```

## Basic Authentication

Authenticate clients using HTTP Basic Authentication:

```yaml
openapi: 3.0.3
info:
  title: Basic Authentication
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
  url: http://localhost:8080/basic-auth
  security:
    auth:
      downstream:
        type: basic
        clients:
          myUser:
            - 25be91d02dbbf17aff80e21323cd0dc5
```

Generate the MD5 hash for `myuser:mysecret`:

```bash
echo -n "myuser:mysecret" | md5sum
# Output: 25be91d02dbbf17aff80e21323cd0dc5
```

**Testing:**

```bash
# Without credentials - returns 403
curl http://localhost:8080/basic-auth/test

# With correct credentials - returns 200
curl http://localhost:8080/basic-auth/test -u myuser:mysecret

# With wrong credentials - returns 403
curl http://localhost:8080/basic-auth/test -u myuser:wrongsecret
```

## JSON Web Tokens (JWT)

Authenticate clients using JWT tokens:

```yaml
openapi: 3.0.3
info:
  title: JSON Web Tokens (JWT)
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
  url: http://localhost:8080/jwt
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
              uri: https://auth.example.com/.well-known/jwks.json
              timeout: 1s
            cache_duration:
              seconds: 300
```

**Testing:**

```bash
# Without JWT - returns 401
curl http://localhost:8080/jwt/test
# Response: Jwt is missing

# With invalid audience - returns 403
curl http://localhost:8080/jwt/test -H "Authorization: Bearer $INVALID_TOKEN"
# Response: Audiences in Jwt are not allowed

# With valid JWT - returns 200
curl http://localhost:8080/jwt/test -H "Authorization: Bearer $VALID_TOKEN"
```

## Mutual TLS (mTLS)

Authenticate clients using TLS client certificates:

```yaml
openapi: 3.0.3
info:
  title: Mutual TLS (mTLS)
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
  url: https://localhost:44444/mtls
  listener:
    address: 127.0.0.1
    port: 44444
  security:
    auth:
      downstream:
        type: mtls
        trusted-ca: /path/to/ca.crt
        clients:
          test_client:
            - CN=demo-client-a,OU=Client,O=MyOrg,L=City,ST=State,C=CH
```

**Testing:**

```bash
# With invalid client certificate - returns 403
curl https://localhost:44444/mtls/test \
     --cert invalid-client.crt \
     --key invalid-client.key \
     --cacert ca.crt
# Response: RBAC: access denied

# With valid client certificate - returns 200
curl https://localhost:44444/mtls/test \
     --cert valid-client.crt \
     --key valid-client.key \
     --cacert ca.crt
```

## Disabled Authentication

Explicitly disable authentication (use with caution):

```yaml
openapi: 3.0.3
info:
  title: Disabled Authentication
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
  url: http://localhost:8080/public
  security:
    allowed-source-ips:
      - 10.0.0.0/8  # Restrict to internal network
    auth:
      downstream: disabled
```

> **Warning:** When disabling authentication, always restrict `allowed-source-ips` to minimize exposure.
