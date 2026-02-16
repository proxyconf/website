+++
title = "Adapters"
description = "Building custom adapters to generate Envoy configuration"
weight = 2
+++

Adapters are the core extension point in ExControlPlane. They define how Envoy configuration resources are generated from your data source (database, files, APIs, etc.).

## Adapter Behaviour

To create a custom adapter, implement the `ExControlPlane.Adapter` behaviour:

```elixir
defmodule MyApp.EnvoyAdapter do
  @behaviour ExControlPlane.Adapter

  @impl true
  def init do
    # Initialize your adapter state
    # This is called once when the application starts
  end

  @impl true
  def generate_resources(state, cluster_id, changes) do
    # Generate Envoy resources for the given cluster
    # Called when configuration needs to be pushed to Envoy
  end

  @impl true
  def map_reduce(state, mapper_fn, acc) do
    # Iterate over all API configurations
    # Used for building configuration snapshots
  end
end
```

## Callback Functions

### `init/0`

Initializes the adapter state. Called once when the application starts.

```elixir
@callback init() :: state :: any()
```

**Returns:** Any term that will be passed to other callbacks as `state`.

**Example:**

```elixir
@impl true
def init do
  # Connect to your data source
  {:ok, conn} = MyApp.Repo.start_link()
  
  %{
    repo: MyApp.Repo,
    cache: %{}
  }
end
```

### `generate_resources/3`

Generates Envoy configuration resources for a specific cluster.

```elixir
@callback generate_resources(
  state :: any(),
  cluster_id :: String.t(),
  changes :: [String.t()]
) :: cluster_config()
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `state` | any | The adapter state from `init/0` |
| `cluster_id` | String | The Envoy cluster identifier (from `node.cluster` in Envoy config) |
| `changes` | List of strings | List of changed API IDs that triggered this update |

**Returns:** A `%ExControlPlane.Adapter.ClusterConfig{}` struct containing all Envoy resources.

**Example:**

```elixir
@impl true
def generate_resources(state, cluster_id, _changes) do
  # Fetch APIs for this cluster from your data source
  apis = MyApp.Repo.get_apis_by_cluster(cluster_id)
  
  # Generate Envoy resources
  %ExControlPlane.Adapter.ClusterConfig{
    secrets: generate_secrets(apis),
    listeners: generate_listeners(apis),
    clusters: generate_clusters(apis),
    route_configurations: generate_routes(apis),
    scoped_route_configurations: []
  }
end
```

### `map_reduce/3`

Iterates over all API configurations. Used for building snapshots and bulk operations.

```elixir
@callback map_reduce(
  state :: any(),
  mapper_fn :: (config :: config(), acc :: any() -> {[any()], acc :: any()}),
  acc :: any()
) :: {[any()], acc :: any()}
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `state` | any | The adapter state |
| `mapper_fn` | function | Function to apply to each API config |
| `acc` | any | Initial accumulator value |

**Returns:** A tuple of `{results, final_accumulator}`.

**Example:**

```elixir
@impl true
def map_reduce(state, mapper_fn, acc) do
  apis = MyApp.Repo.all_apis()
  
  Enum.reduce(apis, {[], acc}, fn api, {results, acc} ->
    api_config = %ExControlPlane.Adapter.ApiConfig{
      api_id: api.id,
      cluster_id: api.cluster_id,
      hash: :erlang.phash2(api)
    }
    
    {new_results, new_acc} = mapper_fn.(api_config, acc)
    {results ++ new_results, new_acc}
  end)
end
```

## Data Structures

### ClusterConfig

The struct returned by `generate_resources/3`:

```elixir
%ExControlPlane.Adapter.ClusterConfig{
  secrets: [
    # TLS certificates - Envoy Secret resources
    %Envoy.Extensions.TransportSockets.Tls.V3.Secret{}
  ],
  listeners: [
    # Network listeners - Envoy Listener resources
    %Envoy.Config.Listener.V3.Listener{}
  ],
  clusters: [
    # Upstream services - Envoy Cluster resources
    %Envoy.Config.Cluster.V3.Cluster{}
  ],
  route_configurations: [
    # HTTP routing - Envoy RouteConfiguration resources
    %Envoy.Config.Route.V3.RouteConfiguration{}
  ],
  scoped_route_configurations: [
    # Scoped routing - Envoy ScopedRouteConfiguration resources
    %Envoy.Config.Route.V3.ScopedRouteConfiguration{}
  ]
}
```

### ApiConfig

Represents an individual API configuration:

```elixir
%ExControlPlane.Adapter.ApiConfig{
  api_id: "my-api",           # Unique API identifier
  cluster_id: "production",   # Envoy cluster this API belongs to
  hash: 12345678              # Hash for change detection
}
```

## Complete Example

Here's a complete adapter implementation that reads API configurations from a database:

```elixir
defmodule MyApp.EnvoyAdapter do
  @behaviour ExControlPlane.Adapter
  
  alias ExControlPlane.Adapter.{ApiConfig, ClusterConfig}
  alias MyApp.{Repo, Api}
  
  @impl true
  def init do
    %{initialized_at: DateTime.utc_now()}
  end
  
  @impl true
  def generate_resources(_state, cluster_id, _changes) do
    apis = Repo.all(from a in Api, where: a.cluster_id == ^cluster_id)
    
    %ClusterConfig{
      secrets: Enum.flat_map(apis, &build_secrets/1),
      listeners: build_listeners(apis),
      clusters: Enum.map(apis, &build_cluster/1),
      route_configurations: build_route_configs(apis),
      scoped_route_configurations: []
    }
  end
  
  @impl true
  def map_reduce(_state, mapper_fn, acc) do
    apis = Repo.all(Api)
    
    Enum.reduce(apis, {[], acc}, fn api, {results, acc} ->
      config = %ApiConfig{
        api_id: api.id,
        cluster_id: api.cluster_id,
        hash: :erlang.phash2(api.updated_at)
      }
      
      {new_results, new_acc} = mapper_fn.(config, acc)
      {results ++ new_results, new_acc}
    end)
  end
  
  # Private functions to build Envoy resources
  
  defp build_secrets(api) do
    if api.tls_enabled do
      [
        %Envoy.Extensions.TransportSockets.Tls.V3.Secret{
          name: "#{api.id}-cert",
          type: {:tls_certificate, %Envoy.Extensions.TransportSockets.Tls.V3.TlsCertificate{
            certificate_chain: %Envoy.Config.Core.V3.DataSource{
              specifier: {:inline_string, api.tls_certificate}
            },
            private_key: %Envoy.Config.Core.V3.DataSource{
              specifier: {:inline_string, api.tls_private_key}
            }
          }}
        }
      ]
    else
      []
    end
  end
  
  defp build_listeners(apis) do
    apis
    |> Enum.group_by(& &1.listener_port)
    |> Enum.map(fn {port, port_apis} ->
      %Envoy.Config.Listener.V3.Listener{
        name: "listener_#{port}",
        address: %Envoy.Config.Core.V3.Address{
          address: {:socket_address, %Envoy.Config.Core.V3.SocketAddress{
            address: "0.0.0.0",
            port_specifier: {:port_value, port}
          }}
        },
        filter_chains: Enum.map(port_apis, &build_filter_chain/1)
      }
    end)
  end
  
  defp build_filter_chain(api) do
    %Envoy.Config.Listener.V3.FilterChain{
      filters: [
        %Envoy.Config.Listener.V3.Filter{
          name: "envoy.filters.network.http_connection_manager",
          config_type: {:typed_config, build_hcm_config(api)}
        }
      ]
    }
  end
  
  defp build_hcm_config(api) do
    # Build HTTP connection manager configuration
    # This would include route configuration, access logs, etc.
    %Envoy.Extensions.Filters.Network.HttpConnectionManager.V3.HttpConnectionManager{
      stat_prefix: api.id,
      route_specifier: {:rds, %Envoy.Extensions.Filters.Network.HttpConnectionManager.V3.Rds{
        config_source: ads_config_source(),
        route_config_name: "route_#{api.id}"
      }},
      http_filters: [
        %Envoy.Extensions.Filters.Network.HttpConnectionManager.V3.HttpFilter{
          name: "envoy.filters.http.router"
        }
      ]
    }
  end
  
  defp build_cluster(api) do
    %Envoy.Config.Cluster.V3.Cluster{
      name: "cluster_#{api.id}",
      type: :STRICT_DNS,
      load_assignment: %Envoy.Config.Endpoint.V3.ClusterLoadAssignment{
        cluster_name: "cluster_#{api.id}",
        endpoints: [
          %Envoy.Config.Endpoint.V3.LocalityLbEndpoints{
            lb_endpoints: [
              %Envoy.Config.Endpoint.V3.LbEndpoint{
                host_identifier: {:endpoint, %Envoy.Config.Endpoint.V3.Endpoint{
                  address: %Envoy.Config.Core.V3.Address{
                    address: {:socket_address, %Envoy.Config.Core.V3.SocketAddress{
                      address: api.upstream_host,
                      port_specifier: {:port_value, api.upstream_port}
                    }}
                  }
                }}
              }
            ]
          }
        ]
      }
    }
  end
  
  defp build_route_configs(apis) do
    Enum.map(apis, fn api ->
      %Envoy.Config.Route.V3.RouteConfiguration{
        name: "route_#{api.id}",
        virtual_hosts: [
          %Envoy.Config.Route.V3.VirtualHost{
            name: api.id,
            domains: [api.domain],
            routes: [
              %Envoy.Config.Route.V3.Route{
                match: %Envoy.Config.Route.V3.RouteMatch{
                  path_specifier: {:prefix, api.path_prefix}
                },
                action: {:route, %Envoy.Config.Route.V3.RouteAction{
                  cluster_specifier: {:cluster, "cluster_#{api.id}"}
                }}
              }
            ]
          }
        ]
      }
    end)
  end
  
  defp ads_config_source do
    %Envoy.Config.Core.V3.ConfigSource{
      config_source_specifier: {:ads, %Envoy.Config.Core.V3.AggregatedConfigSource{}}
    }
  end
end
```

## Triggering Configuration Updates

When your data source changes, notify ExControlPlane to push updates to Envoy:

```elixir
# Notify that specific APIs changed
ExControlPlane.ConfigCache.notify_changes(["api-1", "api-2"])

# Or trigger a full refresh for a cluster
ExControlPlane.ConfigCache.refresh_cluster("production")
```

## Best Practices

### 1. Efficient Change Detection

Use hashing to detect actual changes and avoid unnecessary updates:

```elixir
def generate_resources(state, cluster_id, changes) do
  # Only regenerate resources if there are actual changes
  current_hash = compute_config_hash(cluster_id)
  
  if current_hash != state.last_hash[cluster_id] do
    # Generate new resources
    resources = do_generate_resources(cluster_id)
    {:changed, resources}
  else
    {:unchanged, state.cached_resources[cluster_id]}
  end
end
```

### 2. Resource Naming Conventions

Use consistent naming for Envoy resources:

| Resource Type | Naming Pattern | Example |
|---------------|----------------|---------|
| Listener | `listener_{port}` | `listener_8080` |
| Cluster | `cluster_{api_id}` | `cluster_user-service` |
| RouteConfiguration | `route_{api_id}` | `route_user-service` |
| Secret | `{api_id}-cert` | `user-service-cert` |

### 3. Error Handling

Handle errors gracefully to prevent crashing the control plane:

```elixir
def generate_resources(state, cluster_id, changes) do
  try do
    do_generate_resources(state, cluster_id)
  rescue
    e ->
      Logger.error("Failed to generate resources for #{cluster_id}: #{inspect(e)}")
      # Return empty config or cached version
      %ClusterConfig{}
  end
end
```

### 4. Testing

Test your adapter in isolation:

```elixir
# config/test.exs
config :ex_control_plane,
  grpc_start_server: false,
  adapter_mod: MyApp.TestAdapter
```

```elixir
defmodule MyApp.EnvoyAdapterTest do
  use ExUnit.Case
  
  alias MyApp.EnvoyAdapter
  
  test "generates valid cluster config" do
    state = EnvoyAdapter.init()
    config = EnvoyAdapter.generate_resources(state, "test-cluster", [])
    
    assert %ExControlPlane.Adapter.ClusterConfig{} = config
    assert is_list(config.clusters)
    assert is_list(config.listeners)
  end
end
```

## What's Next?

- [Configuration](@/docs/ex-control-plane/configuration.md) - Configure ExControlPlane options
- [Snapshots](@/docs/ex-control-plane/snapshots.md) - Persist configuration for recovery
