+++
title = "Configuration Reference"
description = "Complete configuration reference for API-Fence filter"
weight = 2
+++

This page documents all configuration options for the API-Fence Envoy HTTP filter.

## Configuration Format

API-Fence configuration is provided as a JSON object in the Envoy filter configuration:

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
            "api_name": "my_api",
            "openapi_spec_path": "/etc/envoy/openapi.yaml",
            ...
          }
```

## Top-Level Options

| Option | Type | Required | Default | Description |
|--------|------|----------|---------|-------------|
| `api_name` | string | **Yes** | - | Unique API name for metrics scoping. Used as prefix for all metrics (e.g., `api_fence.my_api.cache.hits`) |
| `openapi_spec_path` | string | No* | - | Path to OpenAPI spec file (YAML or JSON) |
| `openapi_spec_inline` | string | No* | - | Inline OpenAPI spec as YAML/JSON string |
| `cache` | object | No | See below | Schema cache configuration |
| `validation` | object | No | See below | Validation behavior settings |
| `mocking` | object | No | See below | Mock response generation settings |
| `security` | object | No | See below | Security limits configuration |
| `modsecurity` | object | No | See below | ModSecurity WAF configuration |

\* Either `openapi_spec_path` or `openapi_spec_inline` must be provided, but not both.

## Cache Configuration

The `cache` section configures the JSON schema validator cache:

```json
{
  "cache": {
    "max_capacity": 1000,
    "ttl_seconds": 3600
  }
}
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `max_capacity` | integer | `1000` | Maximum number of cached compiled schemas |
| `ttl_seconds` | integer | `3600` | Time-to-live for cached schemas (1 hour) |

The cache stores compiled JSON Schema validators keyed by a hash of the schema content. This avoids re-compiling schemas for repeated requests to the same endpoint.

## Validation Configuration

The `validation` section controls request/response validation behavior:

```json
{
  "validation": {
    "validate_request": true,
    "validate_response": false,
    "fail_on_request_error": true,
    "fail_on_response_error": false,
    "pool": {
      "enabled": false,
      "thread_count": 2,
      "timeout_ms": 50,
      "queue_capacity": 1000,
      "timeout_action": "allow"
    }
  }
}
```

### Validation Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `validate_request` | boolean | `true` | Enable request body validation against OpenAPI schema |
| `validate_response` | boolean | `false` | Enable response body validation against OpenAPI schema |
| `fail_on_request_error` | boolean | `true` | Return 400 error on request validation failure. If `false`, errors are logged but request continues |
| `fail_on_response_error` | boolean | `false` | Return 500 error on response validation failure. If `false`, errors are logged but response continues |

### Validation Pool Options

The validation pool offloads JSON schema validation to a dedicated thread pool, preventing validation from blocking Envoy worker threads:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enabled` | boolean | `false` | Enable the validation thread pool |
| `thread_count` | integer | `2` | Number of worker threads |
| `timeout_ms` | integer | `50` | Maximum time to wait for validation (milliseconds) |
| `queue_capacity` | integer | `1000` | Maximum pending validation jobs |
| `timeout_action` | string | `"allow"` | Action on timeout: `"allow"` or `"block"` |

## Mocking Configuration

The `mocking` section enables mock response generation for API testing:

```json
{
  "mocking": {
    "enabled": true,
    "prefer_examples": true,
    "default_status_code": 200,
    "delay_ms": 100,
    "add_mock_header": true
  }
}
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enabled` | boolean | `false` | Enable mock response generation (bypasses upstream) |
| `prefer_examples` | boolean | `true` | Use examples from OpenAPI spec when available |
| `default_status_code` | integer | - | Status code to mock. If not set, uses first 2xx response |
| `delay_ms` | integer | - | Simulate network latency (milliseconds) |
| `add_mock_header` | boolean | `true` | Add `X-Mock-Response: true` header to mock responses |

When mocking is enabled, API-Fence generates responses from:
1. **Examples** in the OpenAPI response definition (if `prefer_examples: true`)
2. **Schema-based generation** using fake data matching the response schema

## Security Limits

The `security` section configures input validation limits to prevent resource exhaustion attacks:

```json
{
  "security": {
    "max_path_length": 2048,
    "max_header_value_length": 8192,
    "max_query_string_length": 8192,
    "max_body_size": 10485760,
    "max_json_depth": 32,
    "max_array_items": 1000,
    "max_object_properties": 100,
    "max_schema_depth": 32,
    "max_regex_pattern_length": 1024
  }
}
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `max_path_length` | integer | `2048` | Maximum URL path length (bytes). Returns 414 if exceeded |
| `max_header_value_length` | integer | `8192` | Maximum header value length (bytes) |
| `max_query_string_length` | integer | `8192` | Maximum query string length (bytes) |
| `max_body_size` | integer | `10485760` | Maximum request body size (10 MB). Returns 413 if exceeded |
| `max_json_depth` | integer | `32` | Maximum JSON nesting depth. Prevents stack overflow |
| `max_array_items` | integer | `1000` | Maximum array items to validate. Larger arrays are truncated |
| `max_object_properties` | integer | `100` | Maximum object properties to validate |
| `max_schema_depth` | integer | `32` | Maximum schema nesting depth during compilation |
| `max_regex_pattern_length` | integer | `1024` | Maximum regex pattern length in OpenAPI schemas |

### HTTP Status Codes

Security limit violations return appropriate HTTP status codes:

| Violation | Status Code |
|-----------|-------------|
| Path too long | 414 URI Too Long |
| Body too large | 413 Payload Too Large |
| Other limits | 400 Bad Request |

## ModSecurity Configuration

The `modsecurity` section enables WAF scanning. See [ModSecurity Guide](/docs/api-fence/modsecurity/) for detailed documentation.

```json
{
  "modsecurity": {
    "scan_request": true,
    "scan_response": false,
    "request_action": "block",
    "response_action": "alert",
    "primary_ruleset": {
      "name": "crs",
      "use_bundled_crs": true,
      "bundled_crs_profile": "full"
    }
  }
}
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `scan_request` | boolean | `false` | Enable WAF scanning of request bodies |
| `scan_response` | boolean | `false` | Enable WAF scanning of response bodies |
| `scan_response_as_request` | boolean | `false` | Use request scanning API for responses (more thorough) |
| `request_action` | string | `"block"` | Action on request match: `"block"` or `"alert"` |
| `response_action` | string | `"alert"` | Action on response match: `"block"` or `"alert"` |
| `pool` | object | See below | Scanner thread pool settings |
| `string_extraction` | object | See below | JSON string extraction optimization |
| `primary_ruleset` | object | - | Primary ruleset configuration (required if scanning enabled) |
| `secondary_ruleset` | object | - | Secondary ruleset for migration testing |

## Dynamic Metadata

API-Fence sets Envoy dynamic metadata that can be used in access logs and other filters:

| Metadata Key | Description |
|--------------|-------------|
| `api_fence:request.verdict` | Request validation result: `"valid"`, `"invalid"`, or `"error"` |
| `api_fence:request.errors` | Request validation error messages (JSON array) |
| `api_fence:request.error_count` | Number of request validation errors |
| `api_fence:response.verdict` | Response validation result |
| `api_fence:response.errors` | Response validation error messages |
| `api_fence:response.error_count` | Number of response validation errors |

### Access Log Example

```yaml
access_log:
  - name: envoy.access_loggers.file
    typed_config:
      "@type": type.googleapis.com/envoy.extensions.access_loggers.file.v3.FileAccessLog
      path: /dev/stdout
      log_format:
        text_format_source:
          inline_string: |
            [%START_TIME%] %REQ(:METHOD)% %REQ(:PATH)% %RESPONSE_CODE% verdict=%DYNAMIC_METADATA(api_fence:request.verdict)% errors=%DYNAMIC_METADATA(api_fence:request.errors)%
```

## Metrics

All metrics are scoped under the configured `api_name`:

| Metric | Type | Description |
|--------|------|-------------|
| `api_fence.<api_name>.cache.hits` | Counter | Schema cache hits |
| `api_fence.<api_name>.cache.misses` | Counter | Schema cache misses |
| `api_fence.<api_name>.schema.compile_time_ms` | Histogram | Schema compilation time |
| `api_fence.<api_name>.request.validation_errors` | Counter | Request validation failures |
| `api_fence.<api_name>.response.validation_errors` | Counter | Response validation failures |

Access metrics at: `http://localhost:9901/stats/prometheus`

## Complete Example

```json
{
  "api_name": "users_api",
  "openapi_spec_path": "/etc/envoy/users-api.yaml",
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
      "timeout_ms": 100
    }
  },
  "security": {
    "max_body_size": 5242880,
    "max_json_depth": 16
  },
  "modsecurity": {
    "scan_request": true,
    "primary_ruleset": {
      "name": "crs",
      "use_bundled_crs": true,
      "bundled_crs_profile": "minimal"
    }
  }
}
```
