+++
title = "Getting Started"
description = "Get up and running with API-Fence in minutes"
weight = 1
+++

API-Fence is a high-performance Envoy HTTP filter that validates requests and responses against your OpenAPI specification. This guide will help you get started quickly.

## Prerequisites

- Envoy Proxy 1.28+ with dynamic module support
- An OpenAPI 3.x specification file

## Installation

### Using Pre-built Binary

Download the latest release from [GitHub Releases](https://github.com/proxyconf/api-fence/releases):

```bash
# Download the latest release
curl -LO https://github.com/proxyconf/api-fence/releases/latest/download/api_fence.so

# Move to Envoy's module directory
mv api_fence.so /etc/envoy/modules/
```

### Building from Source

```bash
git clone https://github.com/proxyconf/api-fence.git
cd api-fence
cargo build --release
```

## Basic Configuration

Add API-Fence to your Envoy configuration:

```yaml
http_filters:
  - name: envoy.filters.http.dynamic_modules
    typed_config:
      "@type": type.googleapis.com/envoy.extensions.filters.http.dynamic_modules.v3.DynamicModuleFilter
      dynamic_module_config:
        name: api_fence
        do_not_close: true
      filter_name: api_fence
      filter_config: |
        {
          "api_name": "my_api",
          "openapi_spec_path": "/etc/envoy/openapi.yaml",
          "validation": {
            "validate_request": true,
            "validate_response": false
          }
        }
```

## What's Next?

- [Configuration Reference](/docs/api-fence/configuration/) - Full configuration options
- [ModSecurity WAF](/docs/api-fence/modsecurity/) - Enable WAF protection with bundled CRS
- [Examples](/docs/api-fence/examples/) - Real-world configuration examples
