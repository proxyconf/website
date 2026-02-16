+++
title = "Snapshots"
description = "Persisting configuration state with file or S3 backends"
weight = 3
+++

ExControlPlane supports persisting configuration state to enable fast recovery after restarts. Snapshots capture the current state of all Envoy configurations, allowing the control plane to immediately serve configurations without regenerating them from the data source.

## Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    Snapshot System                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────────┐ │
│  │ ConfigCache │───▶│  Snapshot   │───▶│  Backend            │ │
│  │             │    │  Supervisor │    │  (File or S3)       │ │
│  └─────────────┘    └─────────────┘    └─────────────────────┘ │
│         ▲                  │                                    │
│         │                  │  Periodic persist                  │
│         │                  │  (configurable interval)           │
│         │                  ▼                                    │
│         │           ┌─────────────┐                            │
│         └───────────│  Storage    │                            │
│         On startup  │  (File/S3)  │                            │
│                     └─────────────┘                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Benefits

| Benefit | Description |
|---------|-------------|
| **Fast Startup** | Restore configuration instantly without querying the data source |
| **Disaster Recovery** | Recover from data source failures using the last known good configuration |
| **Reduced Load** | Minimize queries to your database or API on startup |
| **Consistency** | Ensure all Envoy instances receive the same configuration |

## Available Backends

### File Backend

Stores snapshots to a local file. Best for single-node deployments or development.

```elixir
config :ex_control_plane,
  snapshot_backend_mod: ExControlPlane.Snapshot.FileBackend,
  snapshot_backend_args: [
    filename: "/var/lib/proxyconf/snapshot.bin"
  ]
```

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `filename` | String | Yes | Path to the snapshot file |

**Considerations:**
- Ensure the directory exists and is writable
- Not suitable for multi-node deployments (use S3 instead)
- Fast read/write performance

### S3 Backend

Stores snapshots to Amazon S3 or S3-compatible storage. Best for production and multi-node deployments.

```elixir
config :ex_control_plane,
  snapshot_backend_mod: ExControlPlane.Snapshot.S3,
  snapshot_backend_args: [
    bucket: "my-proxyconf-bucket",
    key: "snapshots/envoy-config.bin"
  ]
```

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `bucket` | String | Yes | S3 bucket name |
| `key` | String | Yes | S3 object key (path) |

**AWS Configuration:**

Configure AWS credentials via environment variables or the `aws_config_overrides` option:

```elixir
# Option 1: Environment variables (recommended)
# AWS_ACCESS_KEY_ID=...
# AWS_SECRET_ACCESS_KEY=...
# AWS_REGION=...

# Option 2: Application configuration
config :ex_control_plane, :aws_config_overrides, %{
  access_key_id: "AKIAIOSFODNN7EXAMPLE",
  secret_access_key: "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
  region: "us-west-2"
}
```

**S3-Compatible Storage:**

For MinIO, DigitalOcean Spaces, or other S3-compatible services:

```elixir
config :ex_aws,
  s3: [
    scheme: "https://",
    host: "minio.example.com",
    port: 9000
  ]

config :ex_control_plane,
  snapshot_backend_mod: ExControlPlane.Snapshot.S3,
  snapshot_backend_args: [
    bucket: "proxyconf",
    key: "snapshots/config.bin"
  ]
```

## Configuration Options

### `snapshot_persist_interval`

How often to check for changes and persist snapshots (in milliseconds).

| Property | Value |
|----------|-------|
| Type | Integer (milliseconds) |
| Default | `600000` (10 minutes) |

```elixir
config :ex_control_plane, :snapshot_persist_interval, 300_000  # 5 minutes
```

**Considerations:**
- Lower intervals = more frequent writes, better recovery point
- Higher intervals = less I/O overhead
- Snapshots are only written if configuration has changed

## Backend Behaviour

To implement a custom snapshot backend, implement the `ExControlPlane.Snapshot.Backend` behaviour:

```elixir
defmodule MyApp.CustomSnapshotBackend do
  @behaviour ExControlPlane.Snapshot.Backend

  @impl true
  def start_link(args) do
    # Start any required processes
    {:ok, pid}
  end

  @impl true
  def write(data) do
    # Write snapshot data (binary)
    :ok
  end

  @impl true
  def read() do
    # Read snapshot data
    {:ok, binary_data}
    # or
    {:error, :not_found}
  end
end
```

### Callback Functions

#### `start_link/1`

Starts the backend process.

```elixir
@callback start_link(args :: keyword()) :: GenServer.on_start()
```

#### `write/1`

Writes snapshot data to storage.

```elixir
@callback write(data :: binary()) :: :ok | {:error, term()}
```

#### `read/0`

Reads snapshot data from storage.

```elixir
@callback read() :: {:ok, binary()} | {:error, term()}
```

## Complete Example

### Production Configuration with S3

```elixir
# config/runtime.exs
import Config

config :ex_control_plane,
  adapter_mod: MyApp.EnvoyAdapter,
  grpc_endpoint_port: 18000,
  
  # Enable S3 snapshots
  snapshot_backend_mod: ExControlPlane.Snapshot.S3,
  snapshot_backend_args: [
    bucket: System.fetch_env!("SNAPSHOT_S3_BUCKET"),
    key: System.get_env("SNAPSHOT_S3_KEY", "snapshots/envoy-config.bin")
  ],
  snapshot_persist_interval: 300_000  # 5 minutes

# AWS configuration
config :ex_aws,
  access_key_id: [{:system, "AWS_ACCESS_KEY_ID"}, :instance_role],
  secret_access_key: [{:system, "AWS_SECRET_ACCESS_KEY"}, :instance_role],
  region: System.get_env("AWS_REGION", "us-east-1")
```

### Development Configuration with File Backend

```elixir
# config/dev.exs
import Config

config :ex_control_plane,
  adapter_mod: MyApp.EnvoyAdapter,
  grpc_endpoint_port: 18000,
  
  # Use file backend for development
  snapshot_backend_mod: ExControlPlane.Snapshot.FileBackend,
  snapshot_backend_args: [
    filename: "priv/snapshots/dev-config.bin"
  ],
  snapshot_persist_interval: 60_000  # 1 minute for faster iteration
```

### Disabling Snapshots

To disable snapshots entirely:

```elixir
config :ex_control_plane,
  snapshot_backend_mod: nil
```

## Telemetry Events

The snapshot system emits telemetry events for monitoring:

| Event | Description | Measurements |
|-------|-------------|--------------|
| `[:ex_control_plane, :snapshot, :write, :start]` | Write operation started | - |
| `[:ex_control_plane, :snapshot, :write, :stop]` | Write operation completed | `duration` |
| `[:ex_control_plane, :snapshot, :write, :exception]` | Write operation failed | `duration` |
| `[:ex_control_plane, :snapshot, :read, :start]` | Read operation started | - |
| `[:ex_control_plane, :snapshot, :read, :stop]` | Read operation completed | `duration` |
| `[:ex_control_plane, :snapshot, :read, :exception]` | Read operation failed | `duration` |

### Monitoring Example

```elixir
:telemetry.attach_many(
  "snapshot-monitor",
  [
    [:ex_control_plane, :snapshot, :write, :stop],
    [:ex_control_plane, :snapshot, :write, :exception],
    [:ex_control_plane, :snapshot, :read, :stop],
    [:ex_control_plane, :snapshot, :read, :exception]
  ],
  fn
    [:ex_control_plane, :snapshot, operation, :stop], %{duration: duration}, _meta, _config ->
      duration_ms = System.convert_time_unit(duration, :native, :millisecond)
      Logger.info("Snapshot #{operation} completed in #{duration_ms}ms")

    [:ex_control_plane, :snapshot, operation, :exception], _measurements, %{reason: reason}, _config ->
      Logger.error("Snapshot #{operation} failed: #{inspect(reason)}")
  end,
  nil
)
```

## Troubleshooting

### Snapshot Not Being Written

**Symptoms:** No snapshot file created or S3 object not updated.

**Solutions:**
1. Verify `snapshot_backend_mod` is configured correctly
2. Check that the backend arguments are valid
3. Ensure the destination is writable (file permissions or S3 bucket policy)
4. Check for errors in telemetry events

### Slow Startup After Snapshot Restore

**Symptoms:** Application takes longer to start when snapshots are enabled.

**Solutions:**
1. Verify network connectivity to S3 (if using S3 backend)
2. Check snapshot file size - very large snapshots may need optimization
3. Consider using a local cache for frequently accessed snapshots

### S3 Access Denied

**Symptoms:** `{:error, {:http_error, 403, ...}}` errors.

**Solutions:**
1. Verify AWS credentials are correct
2. Check S3 bucket policy allows read/write access
3. Ensure IAM role has `s3:GetObject` and `s3:PutObject` permissions

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject"
      ],
      "Resource": "arn:aws:s3:::my-bucket/snapshots/*"
    }
  ]
}
```

## What's Next?

- [Configuration](@/docs/ex-control-plane/configuration.md) - All configuration options
- [Adapters](@/docs/ex-control-plane/adapters.md) - Build custom adapters
