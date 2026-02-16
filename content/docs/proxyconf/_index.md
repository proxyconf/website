+++
title = "ProxyConf"
description = "Full-featured Envoy control plane for enterprise API management"
sort_by = "weight"
template = "docs/section.html"
page_template = "docs/page.html"

[extra]
language = "Elixir"
repo = "https://github.com/proxyconf/proxyconf"
+++

ProxyConf is a control plane for [Envoy Proxy](https://www.envoyproxy.io/) that simplifies and secures API management in enterprise environments. It leverages the OpenAPI specification to streamline the configuration of Envoy, providing a powerful yet user-friendly platform for managing and securing API traffic at scale.

## Quick Start

Get ProxyConf running in minutes with Docker:

```bash
# Clone and start the demo environment
git clone https://github.com/proxyconf/proxyconf.git
cd proxyconf/demo
docker-compose up --pull always
```

Once running, you can upload OpenAPI specs and start managing your APIs. See the [Getting Started guide](@/docs/proxyconf/getting-started/_index.md) for the complete walkthrough.

## Key Features

| Feature | Description |
|---------|-------------|
| **OpenAPI-Driven Configuration** | Define your entire API gateway configuration using standard OpenAPI specs with `x-proxyconf` extensions |
| **Centralized Policy Management** | Manage API security, routing, and traffic policies across multiple Envoy instances from a single control plane |
| **Built-in Security** | JWT authentication, TLS termination, mTLS, API keys, Basic auth, and rate limiting out of the box |
| **High Performance** | Leverages Envoy's battle-tested routing, load balancing, and connection pooling |
| **Scalability** | Seamless scaling in distributed, high-availability environments with PostgreSQL persistence |
| **Observability** | Built-in metrics, logging, and tracing support via Envoy's native capabilities |

## How It Works

ProxyConf acts as an xDS control plane for Envoy. You upload OpenAPI specifications with `x-proxyconf` extensions, and ProxyConf translates them into Envoy configuration:

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   OpenAPI Spec  │────▶│    ProxyConf    │────▶│   Envoy Proxy   │
│  (with x-proxy  │     │  (Control Plane)│     │   (Data Plane)  │
│   conf ext.)    │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                               │
                               ▼
                        ┌─────────────────┐
                        │   PostgreSQL    │
                        │  (Persistence)  │
                        └─────────────────┘
```

## Documentation Sections

| Section | Description |
|---------|-------------|
| [Getting Started](@/docs/proxyconf/getting-started/_index.md) | Quick setup guide and Envoy bootstrap configuration |
| [Configuration](@/docs/proxyconf/configuration/_index.md) | Environment variables, OpenAPI extensions, authentication, CORS, and more |
| [Examples](@/docs/proxyconf/examples/_index.md) | Real-world configuration examples for common use cases |
