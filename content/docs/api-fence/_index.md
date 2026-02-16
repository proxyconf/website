+++
title = "API-Fence"
description = "High-performance Envoy HTTP filter for OpenAPI validation"
sort_by = "weight"
template = "docs/section.html"
page_template = "docs/page.html"

[extra]
language = "Rust"
repo = "https://github.com/proxyconf/api-fence"
+++

API-Fence is a high-performance Envoy HTTP filter written in Rust that validates HTTP requests and responses against OpenAPI 3.x specifications.

## Key Features

- **OpenAPI 3.x Validation** - Validate request and response bodies against JSON Schema
- **ModSecurity WAF** - Integrated WAF with bundled OWASP CoreRuleSet v4.0.0
- **Mock Response Generation** - Generate mock responses from OpenAPI examples for testing
- **High Performance** - Written in Rust with async validation thread pool
- **Security Hardening** - Configurable limits for path length, body size, JSON depth
- **Schema Caching** - LRU cache for compiled JSON Schema validators
- **Prometheus Metrics** - Built-in metrics for monitoring validation and cache performance
- **Envoy Dynamic Metadata** - Validation results accessible in access logs and other filters

## Quick Start

```json
{
  "api_name": "my_api",
  "openapi_spec_path": "/etc/envoy/openapi.yaml",
  "validation": {
    "validate_request": true,
    "fail_on_request_error": true
  }
}
```

See [Getting Started](/docs/api-fence/getting-started/) for installation and basic setup.
