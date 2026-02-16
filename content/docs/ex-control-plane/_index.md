+++
title = "ExControlPlane"
description = "Elixir library for building Envoy xDS control planes"
sort_by = "weight"
template = "docs/section.html"
page_template = "docs/page.html"

[extra]
language = "Elixir"
repo = "https://github.com/proxyconf/proxyconf"
+++

ExControlPlane is an Elixir library that implements an Envoy xDS/ADS (Aggregated Discovery Service) control plane. It provides the core infrastructure for dynamically configuring Envoy proxy instances via gRPC.

## Overview

ExControlPlane serves as the foundation for ProxyConf's control plane functionality. It handles:

- **gRPC ADS Server** - Implements the Envoy Aggregated Discovery Service protocol
- **Resource Management** - Manages Envoy configuration resources (clusters, listeners, routes, secrets)
- **Change Propagation** - Efficiently pushes configuration updates to connected Envoy instances
- **Snapshot Persistence** - Persists configuration state for cold-start recovery

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         ExControlPlane                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────────────┐ │
│  │   Adapter   │───▶│ ConfigCache │───▶│   ADS gRPC Server       │ │
│  │ (generates  │    │ (manages    │    │   (streams to Envoy)    │ │
│  │  resources) │    │  versions)  │    │                         │ │
│  └─────────────┘    └─────────────┘    └─────────────────────────┘ │
│         │                  │                       │               │
│         │                  ▼                       │               │
│         │           ┌─────────────┐                │               │
│         │           │  Snapshot   │                │               │
│         │           │  Backend    │                │               │
│         │           │ (File/S3)   │                │               │
│         │           └─────────────┘                │               │
│         │                                          │               │
└─────────│──────────────────────────────────────────│───────────────┘
          │                                          │
          ▼                                          ▼
┌─────────────────────┐                  ┌─────────────────────┐
│   Data Source       │                  │   Envoy Proxy       │
│ (Database, Files,   │                  │   Instances         │
│  APIs, etc.)        │                  │                     │
└─────────────────────┘                  └─────────────────────┘
```

## Envoy Resource Types

ExControlPlane manages the following Envoy xDS resource types:

| Resource Type | Description |
|---------------|-------------|
| **Cluster** | Upstream service definitions (endpoints, health checks, load balancing) |
| **Listener** | Network listeners, filter chains, and TLS contexts |
| **RouteConfiguration** | HTTP routing rules and virtual hosts |
| **ScopedRouteConfiguration** | Scoped routing for large-scale configurations |
| **Secret** | TLS certificates and private keys |

## Key Features

| Feature | Description |
|---------|-------------|
| **Adapter System** | Pluggable adapter behaviour for custom configuration sources |
| **Incremental Updates** | Only changed resources are pushed to Envoy |
| **Version Tracking** | Automatic versioning of all configuration resources |
| **Snapshot Persistence** | File or S3-based persistence for disaster recovery |
| **Telemetry** | Built-in telemetry events for monitoring |
| **TLS Support** | Mutual TLS for secure Envoy-to-control-plane communication |

## Documentation Sections

| Section | Description |
|---------|-------------|
| [Configuration](@/docs/ex-control-plane/configuration.md) | Application configuration options and environment variables |
| [Adapters](@/docs/ex-control-plane/adapters.md) | Building custom adapters to generate Envoy configuration |
| [Snapshots](@/docs/ex-control-plane/snapshots.md) | Persisting configuration state with file or S3 backends |

## Quick Start

Add ExControlPlane to your dependencies:

```elixir
# mix.exs
defp deps do
  [
    {:ex_control_plane, git: "https://github.com/proxyconf/proxyconf.git", sparse: "ex_control_plane"}
  ]
end
```

Configure the control plane:

```elixir
# config/config.exs
config :ex_control_plane,
  adapter_mod: MyApp.EnvoyAdapter,
  grpc_endpoint_port: 18000
```

Implement the adapter behaviour:

```elixir
defmodule MyApp.EnvoyAdapter do
  @behaviour ExControlPlane.Adapter

  @impl true
  def init do
    # Initialize your data source
    %{}
  end

  @impl true
  def generate_resources(state, cluster_id, changes) do
    # Generate Envoy resources from your data source
    %ExControlPlane.Adapter.ClusterConfig{
      secrets: [],
      listeners: [],
      clusters: [],
      route_configurations: [],
      scoped_route_configurations: []
    }
  end

  @impl true
  def map_reduce(state, mapper_fn, acc) do
    # Iterate over your configurations
    {[], acc}
  end
end
```

See the [Adapters](@/docs/ex-control-plane/adapters.md) documentation for complete implementation details.
