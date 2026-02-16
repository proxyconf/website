+++
title = "ModSecurity WAF"
description = "Web Application Firewall integration with bundled CoreRuleSet"
weight = 3
+++

API-Fence includes integrated ModSecurity WAF support with bundled OWASP CoreRuleSet (CRS) v4.0.0 rules, providing zero-configuration protection against common web attacks.

## Overview

ModSecurity integration provides:

- **SQL Injection (SQLi)** detection (CRS rule 942)
- **Cross-Site Scripting (XSS)** detection (CRS rule 941)
- **Remote Code Execution (RCE)** detection (CRS rule 932)
- **Local/Remote File Inclusion (LFI/RFI)** detection (CRS rules 930, 931)
- **Protocol Enforcement** (CRS rules 920, 921)
- **JSON-aware scanning** with optimized string extraction
- **Dual ruleset support** for seamless CRS version migration

## Quick Start

Enable WAF scanning with bundled CRS rules:

```json
{
  "api_name": "my_api",
  "openapi_spec_path": "/etc/envoy/openapi.yaml",
  "modsecurity": {
    "scan_request": true,
    "primary_ruleset": {
      "name": "crs",
      "use_bundled_crs": true
    }
  }
}
```

This enables request body scanning with all bundled CRS rules using default settings.

## Configuration

### Basic Options

```json
{
  "modsecurity": {
    "scan_request": true,
    "scan_response": false,
    "scan_response_as_request": false,
    "request_action": "block",
    "response_action": "alert"
  }
}
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `scan_request` | boolean | `false` | Enable WAF scanning of request bodies |
| `scan_response` | boolean | `false` | Enable WAF scanning of response bodies |
| `scan_response_as_request` | boolean | `false` | Use request-oriented rules for response scanning (more thorough) |
| `request_action` | string | `"block"` | Action when request matches: `"block"` or `"alert"` |
| `response_action` | string | `"alert"` | Action when response matches: `"block"` or `"alert"` |

### Actions

- **`block`**: Reject the request/response with an error (403 Forbidden)
- **`alert`**: Log the match and set metadata, but allow through

Use `alert` mode initially to assess rule matches before enforcing with `block`.

## Ruleset Configuration

### Bundled CRS

API-Fence bundles OWASP CoreRuleSet v4.0.0 rules. Enable with:

```json
{
  "primary_ruleset": {
    "name": "crs",
    "use_bundled_crs": true,
    "bundled_crs_profile": "full"
  }
}
```

### CRS Profiles

Choose a profile based on your performance and security requirements:

| Profile | Rules Included | Use Case |
|---------|----------------|----------|
| `full` | All bundled CRS rules (request + response) | Maximum protection, higher latency |
| `request` | Request rules only (SQLi, XSS, RCE, LFI) | Balanced protection, no response scanning overhead |
| `minimal` | SQLi (942), XSS (941), RCE (932) only | Fastest, protects against most critical attacks |

```json
{
  "primary_ruleset": {
    "name": "crs_minimal",
    "use_bundled_crs": true,
    "bundled_crs_profile": "minimal"
  }
}
```

### Custom Rules

#### File-based Rules

Load rules from files (supports glob patterns):

```json
{
  "primary_ruleset": {
    "name": "custom",
    "rules_path": [
      "/etc/modsecurity/crs/*.conf",
      "/etc/modsecurity/custom-rules.conf"
    ]
  }
}
```

#### Inline Rules

Define rules directly in configuration:

```json
{
  "primary_ruleset": {
    "name": "inline",
    "rules_inline": "SecRule REQUEST_URI \"@contains /admin\" \"id:1000,phase:1,deny,status:403,msg:'Admin access blocked'\""
  }
}
```

#### Remote Rules

Fetch rules from a URL:

```json
{
  "primary_ruleset": {
    "name": "remote",
    "rules_remote": {
      "url": "https://rules.example.com/modsec-rules.conf",
      "key": "api-key-for-auth"
    }
  }
}
```

### Combining Rule Sources

You can combine bundled CRS with custom rules:

```json
{
  "primary_ruleset": {
    "name": "combined",
    "use_bundled_crs": true,
    "bundled_crs_profile": "minimal",
    "rules_inline": "SecRule REQUEST_HEADERS:X-Custom-Header \"@rx dangerous\" \"id:10001,phase:1,deny\""
  }
}
```

## Dual Ruleset Migration

When upgrading CRS versions, use dual rulesets to test new rules alongside existing ones:

```json
{
  "modsecurity": {
    "scan_request": true,
    "primary_ruleset": {
      "name": "crs_3.3",
      "rules_path": ["/etc/modsecurity/crs-3.3/*.conf"]
    },
    "secondary_ruleset": {
      "name": "crs_4.0",
      "use_bundled_crs": true,
      "bundled_crs_profile": "full"
    }
  }
}
```

**Behavior**:
- Both rulesets are evaluated for every request
- If both match, the **secondary (new)** result is used for enforcement
- Metrics track matches for both rulesets separately
- Allows gradual migration with full visibility

## Scanner Pool Configuration

Configure the scanner thread pool:

```json
{
  "modsecurity": {
    "scan_request": true,
    "pool": {
      "timeout_ms": 100,
      "timeout_action": "allow",
      "queue_capacity": 1000
    },
    "primary_ruleset": {
      "name": "crs",
      "use_bundled_crs": true
    }
  }
}
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `timeout_ms` | integer | `100` | Maximum scan time (milliseconds) |
| `timeout_action` | string | `"allow"` | Action on timeout: `"allow"` (fail open) or `"block"` (fail closed) |
| `queue_capacity` | integer | `1000` | Maximum pending scan jobs |

**Note**: The global thread count is controlled by the `API_FENCE_MODSEC_THREADS` environment variable (defaults to number of CPUs).

## String Extraction Configuration

For JSON request bodies, API-Fence extracts string values for efficient scanning:

```json
{
  "modsecurity": {
    "string_extraction": {
      "max_unique_strings": 1000,
      "min_string_length": 1,
      "max_string_length": 10000,
      "skip_base64": true
    }
  }
}
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `max_unique_strings` | integer | `1000` | Maximum unique strings to extract |
| `min_string_length` | integer | `1` | Minimum string length to include |
| `max_string_length` | integer | `10000` | Maximum string length to include |
| `skip_base64` | boolean | `true` | Skip base64-encoded strings (reduces false positives) |

## Complete Example

```json
{
  "api_name": "secure_api",
  "openapi_spec_path": "/etc/envoy/openapi.yaml",
  "validation": {
    "validate_request": true,
    "fail_on_request_error": true
  },
  "modsecurity": {
    "scan_request": true,
    "scan_response": false,
    "request_action": "block",
    "pool": {
      "timeout_ms": 150,
      "timeout_action": "allow",
      "queue_capacity": 2000
    },
    "string_extraction": {
      "max_unique_strings": 500,
      "skip_base64": true
    },
    "primary_ruleset": {
      "name": "crs",
      "use_bundled_crs": true,
      "bundled_crs_profile": "request"
    }
  }
}
```

## Deployment Recommendations

### Start with Alert Mode

Begin with `request_action: "alert"` to monitor rule matches without blocking:

```json
{
  "modsecurity": {
    "scan_request": true,
    "request_action": "alert",
    "primary_ruleset": {
      "name": "crs",
      "use_bundled_crs": true
    }
  }
}
```

Review logs and tune rules before switching to `block`.

### Profile Selection

| Scenario | Recommended Profile |
|----------|---------------------|
| High-security API | `full` |
| Public-facing API | `request` |
| Internal microservice | `minimal` |
| Latency-sensitive | `minimal` |

### Timeout Configuration

- **Low latency APIs**: Use `timeout_ms: 50` with `timeout_action: "allow"`
- **High security APIs**: Use `timeout_ms: 200` with `timeout_action: "block"`

## Troubleshooting

### High Latency

If ModSecurity scanning adds too much latency:

1. Switch to `minimal` profile
2. Reduce `max_unique_strings` in string extraction
3. Ensure adequate thread pool size via `API_FENCE_MODSEC_THREADS`

### False Positives

If legitimate requests are blocked:

1. Start with `alert` mode to identify patterns
2. Add rule exclusions via inline rules
3. Consider `minimal` profile which has fewer false positives

### Memory Usage

The scanner thread pool and rule compilation use memory. Monitor:

- Reduce `queue_capacity` if memory is constrained
- Use `minimal` profile to reduce rule memory footprint
