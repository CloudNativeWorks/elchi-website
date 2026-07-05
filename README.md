# Elchi - Enterprise Proxy Management Platform

**Elchi** is an enterprise-grade Envoy proxy management platform with a 3-process distributed architecture, comprehensive xDS protocol support, intelligent automation, and modern React TypeScript UI.

## 🚀 Key Features

### Core Capabilities
- **3-Process Architecture**: Distributed Controller, Control-Plane (gRPC xDS), and Registry services
- **Full xDS Protocol Support**: ADS, CDS, EDS, LDS, RDS, VHDS with go-control-plane
- **Multi-Version Envoy Support**: Run multiple Envoy versions side by side (resolved dynamically from the release archive) with seamless version upgrade
- **Proto-to-UI Auto-Generation**: Automatically generated UI from Envoy protobuf definitions
- **Intelligent Configuration Analysis**: Automated analysis and troubleshooting with OpenRouter AI integration (BYOK)
- **Interactive Dependency Graphs**: React Flow visual diagrams for resource relationships

### Edge Security & API Discovery
- **Shield — Edge API Security**: A per-edge Envoy `ext_proc` sidecar that enforces API security in the request path — WAF (OWASP CRS), JWT/JWKS/mTLS/API-key auth, rate limiting, bot defense, IP reputation, GraphQL/OpenAPI guards, and DLP across 12 engines, with safe `detect → shadow → block` rollout
- **API Discovery & Inventory**: Turns live Envoy access logs into a continuously risk-scored inventory of every API you expose — shadow endpoints, missing auth, PII leaks — mapped to the OWASP API Top 10, exportable as OpenAPI

### Enterprise Features
- **Enterprise Multi-Tenancy**: Project-based isolation with 4-tier RBAC (Owner, Admin, Editor, Viewer)
- **LDAP Authentication**: Integration with LDAP/Active Directory for enterprise SSO
- **Web Application Firewall (WAF)**: Integrated OWASP CRS with customizable rules
- **Kubernetes Auto-Discovery**: Automatic endpoint discovery from K8s clusters
- **Version Upgrade**: Migrate resources from version X to Y with compatibility checks
- **Audit Logging**: Complete audit trail for compliance and security

### Monitoring & Operations
- **Advanced Metrics**: ECharts visualization with Grafana integration
- **Log Export**: Syslog and Elastic Logstash integration via elchi-agent
- **Health Monitoring**: Auto-recovery and real-time status tracking
- **Job Management**: Background operations with retry and status tracking
- **Scenario Workflows**: Pre-built templates for quick configuration deployment
- **Service Discovery**: Auto registration and cluster management

### Technical Stack

**Frontend:**
- React 18 + TypeScript
- Ant Design UI Library
- Monaco Code Editor
- React Flow (@xyflow/react) for graphs
- ECharts for metrics
- Vite build tool

**Backend (3-Process Architecture):**
- Go 1.26+ for all processes
- gRPC for inter-process communication
- MongoDB for configuration storage
- VictoriaMetrics for time-series data
- OpenRouter for AI features (BYOK)

**Infrastructure:**
- Docker containerization
- Kubernetes native
- Envoy Proxy (multi-version)
- go-control-plane for xDS

## 📦 Quick Start

### Try Demo
Visit [demo.elchi.io](https://demo.elchi.io) for 24-hour access to the platform.

### Deploy with Helm

```bash
helm repo add elchi https://charts.elchi.io
helm repo update
helm install elchi-stack elchi/elchi-stack --set global.mainAddress=<your-host>
```

Not on Kubernetes? Elchi installs the same control plane on **Docker Swarm**, a
single VM (**kind**), or **bare-metal systemd**. For all install methods and
detailed instructions, see the documentation: **[www.elchi.io/docs](https://www.elchi.io/docs/installation/helm-platform/overview)**.

## 🏗️ Architecture

Elchi uses a **3-process distributed architecture**:

1. **Controller** (REST API)
   - Client management and authentication
   - xDS resource CRUD operations
   - User and project management
   - JWT-based authorization

2. **Control-Plane** (gRPC xDS - Port 18000)
   - ADS (Aggregated Discovery Service)
   - VHDS (Virtual Host Discovery Service)
   - Snapshot cache management
   - Delta xDS support

3. **Registry** (Service Discovery - Port 9090)
   - Client registration
   - Service discovery
   - Version-based routing
   - Health check aggregation

All processes communicate via gRPC and share MongoDB for state management.

## 🎯 Use Cases

- **API Gateway Management**: Configure and manage Envoy as API gateway
- **Service Mesh Control Plane**: Alternative to Istio/Linkerd for Envoy-based service mesh
- **Multi-Cluster Proxy Management**: Manage Envoy across multiple Kubernetes clusters
- **WAF Deployment**: Enterprise-grade web application firewall with OWASP CRS
- **Edge API Security**: Enforce authentication, rate limiting, bot defense, and DLP at each edge with the Shield `ext_proc` sidecar
- **API Discovery & Governance**: Build a risk-scored inventory of your real API surface from live traffic
- **Traffic Management**: Advanced routing, load balancing, and traffic shaping
- **Kubernetes Ingress**: Dynamic ingress configuration with K8s discovery

## 🔒 Security Features

- **4-Tier RBAC**: Owner, Admin, Editor, Viewer roles per project
- **JWT Authentication**: Secure token-based authentication
- **LDAP/AD Integration**: Enterprise directory services support
- **Audit Logging**: Complete action tracking for compliance
- **WAF Protection**: OWASP Core Rule Set integration
- **Multi-Tenancy**: Complete project isolation

## 📊 Monitoring & Observability

- **Built-in Metrics**: ECharts-powered dashboards
- **Grafana Integration**: Export metrics to Grafana
- **Log Export**: Syslog and ELK integration via elchi-agent
- **Health Monitoring**: Real-time proxy and service health
- **VictoriaMetrics**: Time-series metrics storage
- **Dependency Visualization**: Interactive graph views

## 🤖 Intelligent Features

- **AI-Powered Analysis**: Configuration optimization via OpenRouter (BYOK)
- **Log Troubleshooting**: Intelligent log pattern detection
- **Auto-Generated UI**: UI components generated from protobuf definitions
- **Real-time Validation**: Frontend TypeScript + backend protoc-gen-validate
- **Smart Scenarios**: Pre-built templates for common configurations

## 📞 Resources

- **Website**: [elchi.io](https://www.elchi.io)
- **Documentation**: [www.elchi.io/docs](https://www.elchi.io/docs)
- **Demo Platform**: [demo.elchi.io](https://demo.elchi.io)
- **Helm Charts**: [charts.elchi.io](https://charts.elchi.io)
- **GitHub**: [CloudNativeWorks](https://github.com/orgs/CloudNativeWorks/repositories)
- **Email**: info@elchi.io

## 📄 License

MIT License - See [LICENSE](LICENSE) file for details.

## ⚠️ Status

**Experimental Project**: Currently in active development. Suitable for testing and evaluation. Use with caution in production environments.

---

Built with ❤️ for the Cloud Native community
