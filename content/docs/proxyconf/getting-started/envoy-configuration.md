+++
title = "Envoy Configuration"
description = "Configure Envoy to connect to the ProxyConf control plane"
weight = 2
+++

This guide explains how to configure Envoy to connect to ProxyConf as its control plane.

## Node Configuration

The `node` section in an Envoy configuration file identifies the instance of Envoy within a larger system. It includes details like the node's ID, cluster, and metadata that the control plane uses to manage and configure that particular Envoy instance.

```yaml
node:
  cluster: demo
  id: proxyconf
```

> **Note:** A single ProxyConf setup can work with multiple Envoy clusters. It's recommended to use distinct node IDs for logging purposes, but ProxyConf can distinguish Envoy nodes even if they use the same node ID. The `proxyconf-cluster` is the default cluster name used by ProxyConf.

## Dynamic Resources Configuration

The `dynamic_resources` section defines how Envoy dynamically fetches configuration data, such as clusters (upstream services) and listeners (network endpoints):

- **`ads_config`** - Specifies the Aggregated Discovery Service (ADS), allowing Envoy to receive configuration updates for multiple resources from ProxyConf
- **`cds_config`** - Configuration for fetching cluster definitions dynamically via the Cluster Discovery Service (CDS)
- **`lds_config`** - Configuration for fetching listener definitions dynamically via the Listener Discovery Service (LDS)

```yaml
dynamic_resources:
  ads_config:
    api_type: GRPC
    transport_api_version: V3
    grpc_services:
      - envoy_grpc:
          cluster_name: proxyconf-xds-cluster
  cds_config:
    resource_api_version: V3
    ads: {}
  lds_config:
    resource_api_version: V3
    ads: {}
```

> **Note:** This configuration section doesn't need any adjustments and can be used as-is.

## Static Resources Configuration

The `static_resources` section defines resources that are hardcoded and do not change dynamically. When connecting Envoy to a control plane, a single static cluster is typically defined to allow Envoy to communicate with ProxyConf.

To ensure a secure connection between Envoy and the control plane, mutual TLS (mTLS) is required. mTLS guarantees that both Envoy and the control plane authenticate each other, protecting the transmission and integrity of sensitive data such as TLS certificates and secrets.

```yaml
static_resources:
  clusters:
    - type: STRICT_DNS
      typed_extension_protocol_options:
        envoy.extensions.upstreams.http.v3.HttpProtocolOptions:
          "@type": type.googleapis.com/envoy.extensions.upstreams.http.v3.HttpProtocolOptions
          explicit_http_config:
            http2_protocol_options: {}
      name: proxyconf-xds-cluster
      transport_socket:
        name: envoy.transport_sockets.tls
        typed_config:
          "@type": type.googleapis.com/envoy.extensions.transport_sockets.tls.v3.UpstreamTlsContext
          common_tls_context:
            tls_certificates:
            - certificate_chain:
                filename: /etc/data/client.crt
              private_key:
                filename: /etc/data/client.key
            validation_context:
              trusted_ca:
                filename: /etc/data/ca.crt
      load_assignment:
        cluster_name: proxyconf
        endpoints:
        - lb_endpoints:
          - endpoint:
              address:
                socket_address:
                  address: proxyconf
                  port_value: 18000
```

> **Note:** The cluster config above configures Envoy to communicate with ProxyConf over TCP port `18000` at the hostname `proxyconf`. This resolves to the ProxyConf container in the demo docker-compose setup, but needs adjustment if the control plane is deployed elsewhere.

## Complete Bootstrap Example

Here's a complete Envoy bootstrap configuration for connecting to ProxyConf:

```yaml
node:
  cluster: demo
  id: proxyconf

admin:
  address:
    socket_address:
      address: 127.0.0.1
      port_value: 9901

dynamic_resources:
  ads_config:
    api_type: GRPC
    transport_api_version: V3
    grpc_services:
      - envoy_grpc:
          cluster_name: proxyconf-xds-cluster
  cds_config:
    resource_api_version: V3
    ads: {}
  lds_config:
    resource_api_version: V3
    ads: {}

static_resources:
  clusters:
    - type: STRICT_DNS
      typed_extension_protocol_options:
        envoy.extensions.upstreams.http.v3.HttpProtocolOptions:
          "@type": type.googleapis.com/envoy.extensions.upstreams.http.v3.HttpProtocolOptions
          explicit_http_config:
            http2_protocol_options: {}
      name: proxyconf-xds-cluster
      transport_socket:
        name: envoy.transport_sockets.tls
        typed_config:
          "@type": type.googleapis.com/envoy.extensions.transport_sockets.tls.v3.UpstreamTlsContext
          common_tls_context:
            tls_certificates:
            - certificate_chain:
                filename: /etc/data/client.crt
              private_key:
                filename: /etc/data/client.key
            validation_context:
              trusted_ca:
                filename: /etc/data/ca.crt
      load_assignment:
        cluster_name: proxyconf
        endpoints:
        - lb_endpoints:
          - endpoint:
              address:
                socket_address:
                  address: proxyconf
                  port_value: 18000
```

## Troubleshooting

### Envoy Won't Connect to ProxyConf

**Symptom:** Envoy logs show connection refused or timeout errors.

**Common causes:**
1. ProxyConf is not running - verify with `docker-compose ps`
2. Wrong hostname/port - ensure `address` and `port_value` match your ProxyConf deployment
3. Network isolation - ensure Envoy can reach ProxyConf (same Docker network, etc.)

### Certificate Errors

**Symptom:** TLS handshake failures in Envoy logs.

```
TLS error: 268435581:SSL routines:OPENSSL_internal:CERTIFICATE_VERIFY_FAILED
```

**Solutions:**
1. Verify certificate paths exist and are readable by Envoy
2. Ensure the CA certificate matches the one that signed ProxyConf's server certificate
3. Check certificate expiration: `openssl x509 -in /etc/data/client.crt -noout -dates`

### No Configuration Updates

**Symptom:** Envoy connects but doesn't receive listener/cluster updates.

**Check:**
1. Verify the `node.cluster` matches a cluster configured in ProxyConf
2. Check ProxyConf logs for errors processing your OpenAPI specs
3. Ensure you've uploaded at least one OpenAPI spec to ProxyConf

## What's Next?

- [Environment Variables](@/docs/proxyconf/configuration/environment.md) - Configure ProxyConf server settings
- [OpenAPI Extension Reference](@/docs/proxyconf/configuration/openapi-extension.md) - Learn the `x-proxyconf` extension format
- [Downstream Authentication](@/docs/proxyconf/configuration/downstream-auth.md) - Secure your APIs with authentication
