+++
title = "Examples"
description = "Real-world configuration examples for API-Fence"
weight = 4
+++

This page provides complete, working examples for common API-Fence use cases.

## Basic Request Validation

Validate incoming requests against your OpenAPI specification:

```yaml
http_filters:
  - name: envoy.filters.http.dynamic_modules
    typed_config:
      "@type": type.googleapis.com/envoy.extensions.filters.http.dynamic_modules.v3.DynamicModuleFilter
      dynamic_module_config:
        name: api_fence
        do_not_close: true
      filter_name: api_fence
      filter_config:
        "@type": "type.googleapis.com/google.protobuf.StringValue"
        value: |
          {
            "api_name": "users_api",
            "openapi_spec_path": "/etc/envoy/users-api.yaml",
            "validation": {
              "validate_request": true,
              "validate_response": false,
              "fail_on_request_error": true
            }
          }
  - name: envoy.filters.http.router
    typed_config:
      "@type": type.googleapis.com/envoy.extensions.filters.http.router.v3.Router
```

**Behavior**: Invalid requests return `400 Bad Request` with validation error details.

## Pass-Through Mode (Log Only)

Validate requests but don't block invalid ones - useful for monitoring:

```yaml
filter_config:
  "@type": "type.googleapis.com/google.protobuf.StringValue"
  value: |
    {
      "api_name": "monitoring_api",
      "openapi_spec_path": "/etc/envoy/api.yaml",
      "validation": {
        "validate_request": true,
        "validate_response": true,
        "fail_on_request_error": false,
        "fail_on_response_error": false
      }
    }
```

**Behavior**: All requests pass through. Validation results are recorded in:
- Envoy dynamic metadata (accessible in access logs)
- Prometheus metrics

### Access Log with Validation Metadata

```yaml
access_log:
  - name: envoy.access_loggers.file
    typed_config:
      "@type": type.googleapis.com/envoy.extensions.access_loggers.file.v3.FileAccessLog
      path: /dev/stdout
      log_format:
        text_format_source:
          inline_string: |
            [%START_TIME%] "%REQ(:METHOD)% %REQ(:PATH)%" %RESPONSE_CODE% request_verdict=%DYNAMIC_METADATA(api_fence:request.verdict)% request_errors=%DYNAMIC_METADATA(api_fence:request.errors)% response_verdict=%DYNAMIC_METADATA(api_fence:response.verdict)%
```

## Full Request and Response Validation

Validate both requests and responses with thread pool:

```yaml
filter_config:
  "@type": "type.googleapis.com/google.protobuf.StringValue"
  value: |
    {
      "api_name": "strict_api",
      "openapi_spec_path": "/etc/envoy/strict-api.yaml",
      "cache": {
        "max_capacity": 500,
        "ttl_seconds": 7200
      },
      "validation": {
        "validate_request": true,
        "validate_response": true,
        "fail_on_request_error": true,
        "fail_on_response_error": false,
        "pool": {
          "enabled": true,
          "thread_count": 4,
          "timeout_ms": 100,
          "timeout_action": "allow"
        }
      }
    }
```

**Behavior**:
- Invalid requests are blocked with `400`
- Invalid responses are logged but not blocked
- Validation runs in a separate thread pool to avoid blocking Envoy workers

## WAF Protection with Bundled CRS

Enable ModSecurity WAF with OWASP CoreRuleSet:

```yaml
filter_config:
  "@type": "type.googleapis.com/google.protobuf.StringValue"
  value: |
    {
      "api_name": "secure_api",
      "openapi_spec_path": "/etc/envoy/api.yaml",
      "validation": {
        "validate_request": true,
        "fail_on_request_error": true
      },
      "modsecurity": {
        "scan_request": true,
        "request_action": "block",
        "primary_ruleset": {
          "name": "crs",
          "use_bundled_crs": true,
          "bundled_crs_profile": "full"
        }
      }
    }
```

**Behavior**: Requests containing SQL injection, XSS, or other attack patterns are blocked with `403 Forbidden`.

## WAF in Alert Mode (Monitoring)

Monitor WAF matches without blocking:

```yaml
filter_config:
  "@type": "type.googleapis.com/google.protobuf.StringValue"
  value: |
    {
      "api_name": "monitored_api",
      "openapi_spec_path": "/etc/envoy/api.yaml",
      "modsecurity": {
        "scan_request": true,
        "request_action": "alert",
        "primary_ruleset": {
          "name": "crs",
          "use_bundled_crs": true,
          "bundled_crs_profile": "minimal"
        }
      }
    }
```

**Behavior**: WAF matches are logged but requests continue. Use this to tune rules before enforcing.

## Minimal WAF (Low Latency)

Use minimal CRS profile for fastest scanning:

```yaml
filter_config:
  "@type": "type.googleapis.com/google.protobuf.StringValue"
  value: |
    {
      "api_name": "fast_api",
      "openapi_spec_path": "/etc/envoy/api.yaml",
      "modsecurity": {
        "scan_request": true,
        "request_action": "block",
        "pool": {
          "timeout_ms": 50,
          "timeout_action": "allow"
        },
        "primary_ruleset": {
          "name": "crs_minimal",
          "use_bundled_crs": true,
          "bundled_crs_profile": "minimal"
        }
      }
    }
```

**Behavior**: Only SQLi, XSS, and RCE rules are applied for minimal latency overhead.

## Mock Response Generation

Generate mock responses from OpenAPI examples for testing:

```yaml
filter_config:
  "@type": "type.googleapis.com/google.protobuf.StringValue"
  value: |
    {
      "api_name": "mock_api",
      "openapi_spec_path": "/etc/envoy/api-with-examples.yaml",
      "validation": {
        "validate_request": true,
        "fail_on_request_error": false
      },
      "mocking": {
        "enabled": true,
        "prefer_examples": true,
        "add_mock_header": true,
        "delay_ms": 50
      }
    }
```

**Behavior**:
- Requests are validated but not blocked
- Responses are generated from OpenAPI examples or schemas
- `X-Mock-Response: true` header is added
- 50ms simulated latency

## Inline OpenAPI Spec

Embed the OpenAPI spec directly in configuration:

```yaml
filter_config:
  "@type": "type.googleapis.com/google.protobuf.StringValue"
  value: |
    {
      "api_name": "inline_api",
      "openapi_spec_inline": "openapi: 3.0.0\ninfo:\n  title: Simple API\n  version: 1.0.0\npaths:\n  /health:\n    get:\n      responses:\n        '200':\n          description: OK",
      "validation": {
        "validate_request": true
      }
    }
```

**Use case**: Simple APIs or testing without external spec files.

## Custom Security Limits

Configure strict security limits for sensitive APIs:

```yaml
filter_config:
  "@type": "type.googleapis.com/google.protobuf.StringValue"
  value: |
    {
      "api_name": "sensitive_api",
      "openapi_spec_path": "/etc/envoy/api.yaml",
      "validation": {
        "validate_request": true,
        "fail_on_request_error": true
      },
      "security": {
        "max_path_length": 1024,
        "max_body_size": 1048576,
        "max_json_depth": 10,
        "max_array_items": 100,
        "max_object_properties": 50
      }
    }
```

**Behavior**:
- Maximum 1KB path length (returns 414 if exceeded)
- Maximum 1MB request body (returns 413 if exceeded)
- Maximum 10 levels of JSON nesting
- Arrays limited to 100 items for validation

## Complete Production Example

Full configuration with validation, WAF, and logging:

```yaml
admin:
  address:
    socket_address:
      address: 0.0.0.0
      port_value: 9901

static_resources:
  listeners:
    - name: api_listener
      address:
        socket_address:
          address: 0.0.0.0
          port_value: 8080
      filter_chains:
        - filters:
            - name: envoy.filters.network.http_connection_manager
              typed_config:
                "@type": type.googleapis.com/envoy.extensions.filters.network.http_connection_manager.v3.HttpConnectionManager
                stat_prefix: api_gateway
                codec_type: AUTO
                route_config:
                  name: api_routes
                  virtual_hosts:
                    - name: api_backend
                      domains: ["*"]
                      routes:
                        - match:
                            prefix: "/"
                          route:
                            cluster: api_cluster
                http_filters:
                  # API-Fence: Validation + WAF
                  - name: envoy.filters.http.dynamic_modules
                    typed_config:
                      "@type": type.googleapis.com/envoy.extensions.filters.http.dynamic_modules.v3.DynamicModuleFilter
                      dynamic_module_config:
                        name: api_fence
                        do_not_close: true
                      filter_name: api_fence
                      filter_config:
                        "@type": "type.googleapis.com/google.protobuf.StringValue"
                        value: |
                          {
                            "api_name": "production_api",
                            "openapi_spec_path": "/etc/envoy/api.yaml",
                            "cache": {
                              "max_capacity": 1000,
                              "ttl_seconds": 3600
                            },
                            "validation": {
                              "validate_request": true,
                              "validate_response": false,
                              "fail_on_request_error": true,
                              "pool": {
                                "enabled": true,
                                "thread_count": 4,
                                "timeout_ms": 100
                              }
                            },
                            "security": {
                              "max_body_size": 5242880,
                              "max_json_depth": 20
                            },
                            "modsecurity": {
                              "scan_request": true,
                              "request_action": "block",
                              "pool": {
                                "timeout_ms": 100,
                                "timeout_action": "allow"
                              },
                              "primary_ruleset": {
                                "name": "crs",
                                "use_bundled_crs": true,
                                "bundled_crs_profile": "request"
                              }
                            }
                          }
                  # Router
                  - name: envoy.filters.http.router
                    typed_config:
                      "@type": type.googleapis.com/envoy.extensions.filters.http.router.v3.Router
                # Access logging
                access_log:
                  - name: envoy.access_loggers.file
                    typed_config:
                      "@type": type.googleapis.com/envoy.extensions.access_loggers.file.v3.FileAccessLog
                      path: /dev/stdout
                      log_format:
                        text_format_source:
                          inline_string: |
                            [%START_TIME%] "%REQ(:METHOD)% %REQ(:PATH)% %PROTOCOL%" %RESPONSE_CODE% %BYTES_RECEIVED% %BYTES_SENT% %DURATION%ms verdict=%DYNAMIC_METADATA(api_fence:request.verdict)%

  clusters:
    - name: api_cluster
      connect_timeout: 5s
      type: STRICT_DNS
      lb_policy: ROUND_ROBIN
      load_assignment:
        cluster_name: api_cluster
        endpoints:
          - lb_endpoints:
              - endpoint:
                  address:
                    socket_address:
                      address: backend-service
                      port_value: 8080
```

## Testing Your Configuration

### Test Valid Request

```bash
curl -X POST http://localhost:8080/users \
  -H "Content-Type: application/json" \
  -d '{"name": "John Doe", "email": "john@example.com"}'
```

### Test Invalid Request (Validation)

```bash
# Missing required field
curl -X POST http://localhost:8080/users \
  -H "Content-Type: application/json" \
  -d '{"name": "John Doe"}'
# Returns 400 Bad Request
```

### Test WAF (SQL Injection)

```bash
curl -X POST http://localhost:8080/search \
  -H "Content-Type: application/json" \
  -d '{"query": "1; DROP TABLE users;--"}'
# Returns 403 Forbidden (if WAF enabled with block action)
```

### Check Metrics

```bash
curl http://localhost:9901/stats/prometheus | grep api_fence
```
