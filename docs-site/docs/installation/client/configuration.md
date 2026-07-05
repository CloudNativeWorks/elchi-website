---
title: Configuration
description: Point the Elchi Client at your Elchi server by editing its YAML config and restarting the service.
sidebar_position: 4
---

After installation, edit the client config to point at your Elchi server.

## 1. Open the config file

```bash
sudo nano /etc/elchi/config.yaml
```

## 2. Fill in server & client

```yaml
server:
  host: ""                    # Main server address
  port: 80                    # Main server port
  tls: false                  # Set true if main server uses TLS
  token: "xxxx-xxxx-xxxx-xxxx" # From Elchi UI → Settings

client:
  name: "web-server-01"      # Hostname / display name
  bgp: false                  # Enable BGP routing
  cloud: "aws"                # aws | azure | gcp | openstack | other
```

## Examples

AWS deployment:

```yaml
client:
  name: "aws-instance-01"
  bgp: false
  cloud: "aws"
```

OpenStack with BGP:

```yaml
client:
  name: "openstack-router"
  bgp: true
  cloud: "my-openstack"
```

## 3. Restart the service

```bash
systemctl restart elchi-client.service
```

:::info[Configuration tips]
- Make sure the controller address is reachable from the host.
- Enable TLS when the controller is behind HTTPS.
- Generate the token from **Elchi UI → Settings → Tokens**.
:::
