+++
title = "Configuration"
description = "Configuration options for ExControlPlane"
weight = 1
+++

ExControlPlane is configured through Elixir application configuration. This page documents all available options.

## Runtime Configuration

These options are read at runtime using `Application.get_env/3`:

### Core Options

#### `adapter_mod`

The adapter module implementing the `ExControlPlane.Adapter` behaviour. This module is responsible for generating Envoy configuration resources from your data source.

| Property | Value |
|----------|-------|
| Type | Module |
| Default | `ExControlPlane.SampleEtsAdapter` |
| Required | Yes (for production) |

```elixir
config :ex_control_plane, :adapter_mod, MyApp.EnvoyAdapter
```

#### `grpc_endpoint_port`

The port on which the gRPC ADS server listens for Envoy connections.

| Property | Value |
|----------|-------|
| Type | Integer |
| Default | `18000` |
| Range | 1-65535 |

```elixir
config :ex_control_plane, :grpc_endpoint_port, 18000
```

#### `grpc_start_server`

Whether to automatically start the gRPC server when the application starts. Set to `false` for testing or when you want to control server startup manually.

| Property | Value |
|----------|-------|
| Type | Boolean |
| Default | `true` |

```elixir
config :ex_control_plane, :grpc_start_server, false
```

#### `grpc_server_opts`

Additional options passed to the GRPC server. Commonly used for TLS configuration.

| Property | Value |
|----------|-------|
| Type | Keyword list |
| Default | `[]` |

```elixir
config :ex_control_plane, :grpc_server_opts,
  cred: GRPC.Credential.new(
    ssl: [
      certfile: "/path/to/server.crt",
      keyfile: "/path/to/server.key",
      cacertfile: "/path/to/ca.crt",
      verify: :verify_peer,
      fail_if_no_peer_cert: true
    ]
  )
```

### Snapshot Options

See [Snapshots](@/docs/ex-control-plane/snapshots.md) for detailed configuration of the snapshot system.

#### `snapshot_backend_mod`

The snapshot backend module implementing `ExControlPlane.Snapshot.Backend` behaviour. If `nil`, snapshots are disabled.

| Property | Value |
|----------|-------|
| Type | Module or `nil` |
| Default | `nil` |
| Available backends | `ExControlPlane.Snapshot.FileBackend`, `ExControlPlane.Snapshot.S3` |

```elixir
config :ex_control_plane, :snapshot_backend_mod, ExControlPlane.Snapshot.FileBackend
```

#### `snapshot_backend_args`

Arguments passed to the snapshot backend module's `start_link/1` function.

| Property | Value |
|----------|-------|
| Type | Keyword list |
| Default | `[]` |

```elixir
# For FileBackend
config :ex_control_plane, :snapshot_backend_args, filename: "/var/lib/proxyconf/snapshot.bin"

# For S3 backend
config :ex_control_plane, :snapshot_backend_args, bucket: "my-bucket", key: "snapshots/envoy"
```

#### `snapshot_persist_interval`

Interval in milliseconds between automatic snapshot persistence checks.

| Property | Value |
|----------|-------|
| Type | Integer (milliseconds) |
| Default | `600000` (10 minutes) |

```elixir
config :ex_control_plane, :snapshot_persist_interval, 300_000  # 5 minutes
```

#### `aws_config_overrides`

AWS configuration overrides for the S3 snapshot backend (used with ExAws).

| Property | Value |
|----------|-------|
| Type | Map |
| Default | `%{}` |

```elixir
config :ex_control_plane, :aws_config_overrides, %{
  access_key_id: "AKIAIOSFODNN7EXAMPLE",
  secret_access_key: "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
  region: "us-west-2"
}
```

## Compile-time Configuration

These options are read at compile time using `Application.compile_env/3`. Changes require recompilation.

#### `transformed_methods`

HTTP methods to transform when processing OpenAPI specs.

| Property | Value |
|----------|-------|
| Type | List of strings |
| Default | `["get", "put", "post", "delete", "options", "head", "patch", "trace"]` |

```elixir
config :ex_control_plane, :transformed_methods, ~w/get post put delete/
```

#### `path_wildcard_variable`

The OpenAPI path variable name that triggers wildcard path matching. When this variable is found in a path (e.g., `{requestPath}`), it becomes a wildcard matcher (`{requestPath=**}`).

| Property | Value |
|----------|-------|
| Type | String |
| Default | `"requestPath"` |

```elixir
config :ex_control_plane, :path_wildcard_variable, "catchAll"
```

#### `oas3_extension_prefix`

The vendor extension prefix used in OpenAPI specs for ProxyConf-specific configurations.

| Property | Value |
|----------|-------|
| Type | String |
| Default | `"x-proxyconf"` |

```elixir
config :ex_control_plane, :oas3_extension_prefix, "x-myapp"
```

## Configuration Summary

| Option | Type | Default | Runtime/Compile |
|--------|------|---------|-----------------|
| `adapter_mod` | Module | `SampleEtsAdapter` | Runtime |
| `grpc_endpoint_port` | Integer | `18000` | Runtime |
| `grpc_start_server` | Boolean | `true` | Runtime |
| `grpc_server_opts` | Keyword | `[]` | Runtime |
| `snapshot_backend_mod` | Module | `nil` | Runtime |
| `snapshot_backend_args` | Keyword | `[]` | Runtime |
| `snapshot_persist_interval` | Integer | `600000` | Runtime |
| `aws_config_overrides` | Map | `%{}` | Runtime |
| `transformed_methods` | List | `~w/get put.../` | Compile |
| `path_wildcard_variable` | String | `"requestPath"` | Compile |
| `oas3_extension_prefix` | String | `"x-proxyconf"` | Compile |

## Complete Example

Here's a complete configuration example for a production deployment:

```elixir
# config/runtime.exs
import Config

config :ex_control_plane,
  # Use your custom adapter
  adapter_mod: MyApp.EnvoyAdapter,
  
  # gRPC server configuration
  grpc_endpoint_port: String.to_integer(System.get_env("GRPC_PORT", "18000")),
  grpc_start_server: true,
  grpc_server_opts: [
    cred: GRPC.Credential.new(
      ssl: [
        certfile: System.get_env("TLS_CERT_PATH"),
        keyfile: System.get_env("TLS_KEY_PATH"),
        cacertfile: System.get_env("TLS_CA_PATH"),
        verify: :verify_peer,
        fail_if_no_peer_cert: true
      ]
    )
  ],
  
  # Enable S3 snapshots for persistence
  snapshot_backend_mod: ExControlPlane.Snapshot.S3,
  snapshot_backend_args: [
    bucket: System.get_env("SNAPSHOT_S3_BUCKET"),
    key: System.get_env("SNAPSHOT_S3_KEY", "snapshots/envoy-config")
  ],
  snapshot_persist_interval: 300_000  # 5 minutes
```

## TLS Configuration

For secure communication between Envoy and the control plane, mutual TLS (mTLS) is strongly recommended.

### Server-side TLS (Control Plane)

Configure the gRPC server with TLS credentials:

```elixir
config :ex_control_plane, :grpc_server_opts,
  cred: GRPC.Credential.new(
    ssl: [
      # Server certificate and key
      certfile: "/certs/control-plane.crt",
      keyfile: "/certs/control-plane.key",
      
      # CA certificate for verifying Envoy client certificates
      cacertfile: "/certs/ca.crt",
      
      # Require client certificate (mTLS)
      verify: :verify_peer,
      fail_if_no_peer_cert: true,
      
      # Optional: limit TLS versions
      versions: [:"tlsv1.2", :"tlsv1.3"]
    ]
  )
```

### Client-side TLS (Envoy)

Configure Envoy to connect with mTLS:

```yaml
static_resources:
  clusters:
    - name: control-plane
      type: STRICT_DNS
      transport_socket:
        name: envoy.transport_sockets.tls
        typed_config:
          "@type": type.googleapis.com/envoy.extensions.transport_sockets.tls.v3.UpstreamTlsContext
          common_tls_context:
            tls_certificates:
              - certificate_chain:
                  filename: /certs/envoy-client.crt
                private_key:
                  filename: /certs/envoy-client.key
            validation_context:
              trusted_ca:
                filename: /certs/ca.crt
```

## Telemetry Events

ExControlPlane emits telemetry events for monitoring:

### Adapter Events

| Event | Description |
|-------|-------------|
| `[:ex_control_plane, :adapter, :generate, :start]` | Resource generation started |
| `[:ex_control_plane, :adapter, :generate, :stop]` | Resource generation completed |
| `[:ex_control_plane, :adapter, :generate, :exception]` | Resource generation failed |

### Snapshot Events

| Event | Description |
|-------|-------------|
| `[:ex_control_plane, :snapshot, :write, :start]` | Snapshot write started |
| `[:ex_control_plane, :snapshot, :write, :stop]` | Snapshot write completed |
| `[:ex_control_plane, :snapshot, :write, :exception]` | Snapshot write failed |
| `[:ex_control_plane, :snapshot, :read, :start]` | Snapshot read started |
| `[:ex_control_plane, :snapshot, :read, :stop]` | Snapshot read completed |
| `[:ex_control_plane, :snapshot, :read, :exception]` | Snapshot read failed |

### Attaching Telemetry Handlers

```elixir
:telemetry.attach_many(
  "ex-control-plane-logger",
  [
    [:ex_control_plane, :adapter, :generate, :stop],
    [:ex_control_plane, :snapshot, :write, :stop]
  ],
  fn event, measurements, metadata, _config ->
    Logger.info("#{inspect(event)}: #{inspect(measurements)}")
  end,
  nil
)
```

## What's Next?

- [Adapters](@/docs/ex-control-plane/adapters.md) - Learn how to implement custom adapters
- [Snapshots](@/docs/ex-control-plane/snapshots.md) - Configure snapshot persistence
