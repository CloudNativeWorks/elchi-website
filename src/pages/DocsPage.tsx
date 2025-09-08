import { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Download, CheckCircle, Monitor, Settings, AlertTriangle, Package, Database, Shield } from 'lucide-react'
import { Link } from 'react-router-dom'

const DocsPage = () => {
    const [activeSection, setActiveSection] = useState('installation')

    const sections = [
        {
            id: 'installation',
            title: 'Elchi',
            subsections: [
                { id: 'elchi-overview', title: 'Overview' },
                { id: 'elchi-prerequisites', title: 'Prerequisites' },
                { id: 'elchi-quickstart', title: 'Quick Start' },
                { id: 'elchi-configuration', title: 'Configuration' },
                { id: 'elchi-storage', title: 'Storage Options' },
                { id: 'elchi-production', title: 'Production Setup' },
                { id: 'elchi-security', title: 'Security' }
            ]
        },
        {
            id: 'client',
            title: 'Elchi Client',
            subsections: [
                { id: 'getting-started', title: 'Getting Started' },
                { id: 'download', title: 'Download' },
                { id: 'installation', title: 'Installation' },
                { id: 'configuration', title: 'Configuration' },
                { id: 'supported-os', title: 'Supported OS' }
            ]
        },
        {
            id: 'discovery',
            title: 'Elchi Discovery',
            subsections: [
                { id: 'discovery-overview', title: 'Overview' },
                { id: 'discovery-prerequisites', title: 'Prerequisites' },
                { id: 'discovery-installation', title: 'Installation' },
                { id: 'discovery-configuration', title: 'Configuration' }
            ]
        }
    ]

    const renderContent = () => {
        switch (activeSection) {
            case 'installation':
                return (
                    <div className="space-y-8">
                        <div id="elchi-overview">
                            <h1 className="text-4xl font-bold text-white mb-4">Elchi Proxy Management Platform</h1>
                            <p className="text-xl text-gray-300 leading-relaxed mb-4">
                                Comprehensive proxy management platform that provides UI-based configuration management for Envoy proxies.
                            </p>
                            <div className="glass-effect p-6 rounded-xl">
                                <h3 className="text-lg font-medium text-white mb-4">Components</h3>
                                <ul className="space-y-2 text-gray-300">
                                    <li className="flex items-start">
                                        <span className="text-blue-400 mr-2">🎨</span>
                                        <span><strong>Elchi UI:</strong> Web interface for creating and managing proxy configurations</span>
                                    </li>
                                    <li className="flex items-start">
                                        <span className="text-green-400 mr-2">🎯</span>
                                        <span><strong>Controller:</strong> REST API service for resource management and client command dispatching</span>
                                    </li>
                                    <li className="flex items-start">
                                        <span className="text-purple-400 mr-2">🕹️</span>
                                        <span><strong>Control Plane:</strong> Envoy xDS management service with snapshot cache system</span>
                                    </li>
                                    <li className="flex items-start">
                                        <span className="text-yellow-400 mr-2">📡</span>
                                        <span><strong>Registry:</strong> Service discovery and process routing with automatic registration</span>
                                    </li>
                                    <li className="flex items-start">
                                        <span className="text-orange-400 mr-2">🌐</span>
                                        <span><strong>Envoy Proxy:</strong> Central gateway for intelligent traffic routing between components</span>
                                    </li>
                                    <li className="flex items-start">
                                        <span className="text-teal-400 mr-2">🗄️</span>
                                        <span><strong>MongoDB:</strong> Database for storing configurations and user data</span>
                                    </li>
                                    <li className="flex items-start">
                                        <span className="text-pink-400 mr-2">📊</span>
                                        <span><strong>VictoriaMetrics:</strong> Time-series database for metrics storage and monitoring</span>
                                    </li>
                                </ul>
                            </div>
                        </div>

                        <div id="elchi-prerequisites" className="space-y-6">
                            <h2 className="text-2xl font-semibold text-white flex items-center">
                                <CheckCircle className="w-6 h-6 mr-2 text-green-400" />
                                Prerequisites
                            </h2>
                            
                            <div className="glass-effect p-6 rounded-xl">
                                <ul className="space-y-3 text-gray-300">
                                    <li className="flex items-start">
                                        <span className="text-green-400 mr-2">✓</span>
                                        <span>Kubernetes cluster (v1.19+)</span>
                                    </li>
                                    <li className="flex items-start">
                                        <span className="text-green-400 mr-2">✓</span>
                                        <span>Helm 3.2.0+ installed</span>
                                    </li>
                                    <li className="flex items-start">
                                        <span className="text-green-400 mr-2">✓</span>
                                        <span>kubectl configured with cluster access</span>
                                    </li>
                                    <li className="flex items-start">
                                        <span className="text-green-400 mr-2">✓</span>
                                        <span>Minimum 4GB RAM and 2 CPU cores available</span>
                                    </li>
                                    <li className="flex items-start">
                                        <span className="text-blue-400 mr-2">○</span>
                                        <span>Storage class for persistent volumes (optional - only required for built-in MongoDB/VictoriaMetrics)</span>
                                    </li>
                                </ul>
                            </div>
                        </div>

                        <div id="elchi-quickstart" className="space-y-6">
                            <h2 className="text-2xl font-semibold text-white flex items-center">
                                <Package className="w-6 h-6 mr-2 text-blue-400" />
                                Quick Start
                            </h2>
                            
                            <div className="glass-effect p-6 rounded-xl">
                                <h3 className="text-lg font-medium text-white mb-4">1. Add Helm Repository</h3>
                                <div className="bg-gray-900/50 rounded-lg p-4 font-mono text-sm">
                                    <div className="text-gray-400 mb-1"># Add Elchi Helm repository</div>
                                    <div className="text-green-400">helm repo add elchi https://charts.elchi.io</div>
                                    <div className="text-green-400">helm repo update</div>
                                </div>
                            </div>

                            <div className="glass-effect p-6 rounded-xl">
                                <h3 className="text-lg font-medium text-white mb-4">2. Basic Installation</h3>
                                <div className="bg-gray-900/50 rounded-lg p-4 font-mono text-sm">
                                    <div className="text-gray-400 mb-1"># Install with default configuration</div>
                                    <div className="text-green-400">helm install my-elchi elchi/elchi-stack \\</div>
                                    <div className="text-green-400 ml-4">--set-string global.mainAddress="your-domain.com" \\</div>
                                    <div className="text-green-400 ml-4">--namespace elchi-stack \\</div>
                                    <div className="text-green-400 ml-4">--create-namespace</div>
                                </div>
                                <p className="text-sm text-gray-400 mt-3">
                                    This installs Elchi with built-in MongoDB and VictoriaMetrics for a complete setup.
                                </p>
                            </div>

                            <div className="glass-effect p-6 rounded-xl">
                                <h3 className="text-lg font-medium text-white mb-4">3. Verify Installation</h3>
                                <div className="bg-gray-900/50 rounded-lg p-4 font-mono text-sm">
                                    <div className="text-gray-400 mb-1"># Check pod status</div>
                                    <div className="text-green-400">kubectl get pods -n elchi-stack</div>
                                    <div className="text-gray-400 mt-2 mb-1"># Get service endpoints</div>
                                    <div className="text-green-400">kubectl get svc -n elchi-stack</div>
                                </div>
                            </div>

                            <div className="glass-effect p-6 rounded-xl">
                                <h3 className="text-lg font-medium text-white mb-4">4. Access the Web Interface</h3>
                                <p className="text-gray-300 mb-3">After successful installation, access the Elchi web interface using the default credentials:</p>
                                
                                <div className="bg-gray-900/50 rounded-lg p-4 font-mono text-sm">
                                    <div className="text-gray-400 mb-1"># Default login credentials</div>
                                    <div className="text-green-400">Username: <span className="text-yellow-400">admin</span></div>
                                    <div className="text-green-400">Password: <span className="text-yellow-400">admin</span></div>
                                </div>

                                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mt-4">
                                    <div className="flex items-start space-x-3">
                                        <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center mt-0.5">
                                            <span className="text-white text-xs font-bold">!</span>
                                        </div>
                                        <div>
                                            <h4 className="text-red-400 font-medium mb-1">Security Warning</h4>
                                            <p className="text-red-200 text-sm">
                                                <strong>IMPORTANT:</strong> Change the default admin password immediately after first login for security reasons.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div id="elchi-configuration" className="space-y-6">
                            <h2 className="text-2xl font-semibold text-white flex items-center">
                                <Settings className="w-6 h-6 mr-2 text-purple-400" />
                                Configuration
                            </h2>
                            
                            <div className="glass-effect p-6 rounded-xl">
                                <h3 className="text-lg font-medium text-white mb-4">Configuration Parameters</h3>
                                
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead className="border-b border-white/20">
                                            <tr>
                                                <th className="text-left py-3 px-2 text-blue-400 font-medium">Parameter</th>
                                                <th className="text-left py-3 px-2 text-green-400 font-medium">Description</th>
                                                <th className="text-left py-3 px-2 text-yellow-400 font-medium">Default</th>
                                            </tr>
                                        </thead>
                                        <tbody className="text-gray-300">
                                            <tr className="border-b border-white/10">
                                                <td className="py-2 px-2 font-mono text-xs">global.namespace</td>
                                                <td className="py-2 px-2">Namespace where all components will be deployed</td>
                                                <td className="py-2 px-2 text-green-400">"elchi-stack"</td>
                                            </tr>
                                            <tr className="border-b border-white/10">
                                                <td className="py-2 px-2 font-mono text-xs">global.mainAddress</td>
                                                <td className="py-2 px-2">Base URL for all components <span className="text-red-400">(Required)</span></td>
                                                <td className="py-2 px-2 text-gray-500">""</td>
                                            </tr>
                                            <tr className="border-b border-white/10">
                                                <td className="py-2 px-2 font-mono text-xs">global.port</td>
                                                <td className="py-2 px-2">Port for Elchi controller API (uses 80/443 based on TLS if empty)</td>
                                                <td className="py-2 px-2 text-gray-500">""</td>
                                            </tr>
                                            <tr className="border-b border-white/10">
                                                <td className="py-2 px-2 font-mono text-xs">global.tlsEnabled</td>
                                                <td className="py-2 px-2">Whether to use HTTPS</td>
                                                <td className="py-2 px-2 text-orange-400">false</td>
                                            </tr>
                                            <tr className="border-b border-white/10">
                                                <td className="py-2 px-2 font-mono text-xs">global.installMongo</td>
                                                <td className="py-2 px-2">Whether to use self-hosted MongoDB</td>
                                                <td className="py-2 px-2 text-orange-400">true</td>
                                            </tr>
                                            <tr className="border-b border-white/10">
                                                <td className="py-2 px-2 font-mono text-xs">global.installVictoriaMetrics</td>
                                                <td className="py-2 px-2">Whether to use self-hosted Victoria Metrics</td>
                                                <td className="py-2 px-2 text-orange-400">true</td>
                                            </tr>
                                            <tr className="border-b border-white/10">
                                                <td className="py-2 px-2 font-mono text-xs">global.internalCommunication</td>
                                                <td className="py-2 px-2">Enable internal communication between services</td>
                                                <td className="py-2 px-2 text-orange-400">false</td>
                                            </tr>
                                            <tr className="border-b border-white/10">
                                                <td className="py-2 px-2 font-mono text-xs">global.versions</td>
                                                <td className="py-2 px-2">List of Elchi backend versions to deploy</td>
                                                <td className="py-2 px-2 text-green-400">[v0.1.0-v0.13.4-envoy1.33.5, v0.1.0-v0.13.4-envoy1.34.2]</td>
                                            </tr>
                                            <tr className="border-b border-white/10">
                                                <td className="py-2 px-2 font-mono text-xs">global.jwt.secret</td>
                                                <td className="py-2 px-2">JWT secret key for authentication (minimum 32 characters)</td>
                                                <td className="py-2 px-2 text-red-400">default (CHANGE!)</td>
                                            </tr>
                                            <tr className="border-b border-white/10">
                                                <td className="py-2 px-2 font-mono text-xs">global.jwt.accessTokenDuration</td>
                                                <td className="py-2 px-2">Access token expiration duration</td>
                                                <td className="py-2 px-2 text-green-400">"1h"</td>
                                            </tr>
                                            <tr className="border-b border-white/10">
                                                <td className="py-2 px-2 font-mono text-xs">global.jwt.refreshTokenDuration</td>
                                                <td className="py-2 px-2">Refresh token expiration duration</td>
                                                <td className="py-2 px-2 text-green-400">"5h"</td>
                                            </tr>
                                            <tr className="border-b border-white/10">
                                                <td className="py-2 px-2 font-mono text-xs">global.elchiBackend.controlPlaneDefaultReplicas</td>
                                                <td className="py-2 px-2">Default replicas for Control Plane services</td>
                                                <td className="py-2 px-2 text-yellow-400">2</td>
                                            </tr>
                                            <tr className="border-b border-white/10">
                                                <td className="py-2 px-2 font-mono text-xs">global.elchiBackend.controllerDefaultReplicas</td>
                                                <td className="py-2 px-2">Default replicas for Controller services</td>
                                                <td className="py-2 px-2 text-yellow-400">2</td>
                                            </tr>
                                            <tr className="border-b border-white/10">
                                                <td className="py-2 px-2 font-mono text-xs">global.cors.allowedOrigins</td>
                                                <td className="py-2 px-2">CORS allowed origins (use "*" for all, or comma-separated domains)</td>
                                                <td className="py-2 px-2 text-green-400">"*"</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>

                                <div className="mt-6">
                                    <h4 className="text-white font-medium mb-3">MongoDB Parameters (when installMongo: false)</h4>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <tbody className="text-gray-300">
                                                <tr className="border-b border-white/10">
                                                    <td className="py-2 px-2 font-mono text-xs">global.mongodb.hosts</td>
                                                    <td className="py-2 px-2">MongoDB connection hosts (comma-separated for replica set)</td>
                                                </tr>
                                                <tr className="border-b border-white/10">
                                                    <td className="py-2 px-2 font-mono text-xs">global.mongodb.username</td>
                                                    <td className="py-2 px-2">MongoDB username (default: "elchi")</td>
                                                </tr>
                                                <tr className="border-b border-white/10">
                                                    <td className="py-2 px-2 font-mono text-xs">global.mongodb.password</td>
                                                    <td className="py-2 px-2">MongoDB password (default: "elchi")</td>
                                                </tr>
                                                <tr className="border-b border-white/10">
                                                    <td className="py-2 px-2 font-mono text-xs">global.mongodb.database</td>
                                                    <td className="py-2 px-2">MongoDB database name (default: "elchi")</td>
                                                </tr>
                                                <tr className="border-b border-white/10">
                                                    <td className="py-2 px-2 font-mono text-xs">global.mongodb.scheme</td>
                                                    <td className="py-2 px-2">Connection scheme (mongodb or mongodb+srv)</td>
                                                </tr>
                                                <tr className="border-b border-white/10">
                                                    <td className="py-2 px-2 font-mono text-xs">global.mongodb.replicaset</td>
                                                    <td className="py-2 px-2">Replica set name (if using replica set)</td>
                                                </tr>
                                                <tr className="border-b border-white/10">
                                                    <td className="py-2 px-2 font-mono text-xs">global.mongodb.tlsEnabled</td>
                                                    <td className="py-2 px-2">Enable TLS connection to MongoDB</td>
                                                </tr>
                                                <tr className="border-b border-white/10">
                                                    <td className="py-2 px-2 font-mono text-xs">global.mongodb.authSource</td>
                                                    <td className="py-2 px-2">Authentication source database (e.g., admin)</td>
                                                </tr>
                                                <tr className="border-b border-white/10">
                                                    <td className="py-2 px-2 font-mono text-xs">global.mongodb.authMechanism</td>
                                                    <td className="py-2 px-2">Authentication mechanism</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                <div className="mt-6">
                                    <h4 className="text-white font-medium mb-3">VictoriaMetrics Parameters (when installVictoriaMetrics: false)</h4>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <tbody className="text-gray-300">
                                                <tr>
                                                    <td className="py-2 px-2 font-mono text-xs">global.victoriametrics.endpoint</td>
                                                    <td className="py-2 px-2">External Victoria Metrics endpoint (supports http://host:port and host:port formats)</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>

                            <div className="glass-effect p-6 rounded-xl">
                                <h3 className="text-lg font-medium text-white mb-4">Using Values File</h3>
                                <p className="text-gray-300 mb-3">Create a <code className="text-yellow-400">values.yaml</code> file:</p>
                                <div className="bg-gray-900/50 rounded-lg p-4 font-mono text-sm">
                                    <div className="text-blue-400">global:</div>
                                    <div className="text-gray-300 ml-2">namespace: <span className="text-green-400">"elchi-stack"</span></div>
                                    <div className="text-gray-300 ml-2">mainAddress: <span className="text-green-400">"elchi.example.com"</span></div>
                                    <div className="text-gray-300 ml-2">tlsEnabled: <span className="text-orange-400">true</span></div>
                                    <div className="text-gray-300 ml-2">jwt:</div>
                                    <div className="text-gray-300 ml-4">secret: <span className="text-green-400">"your-secure-32-character-minimum-secret-key-here"</span></div>
                                    <div className="text-gray-300 ml-2">versions:</div>
                                    <div className="text-gray-300 ml-4">- tag: <span className="text-green-400">v0.1.0-v0.13.4-envoy1.34.2</span></div>
                                    <div className="text-gray-300 ml-4">- tag: <span className="text-green-400">v0.1.0-v0.13.4-envoy1.35.0</span></div>
                                </div>
                                <div className="bg-gray-900/50 rounded-lg p-4 font-mono text-sm mt-3">
                                    <div className="text-gray-400 mb-1"># Install with values file</div>
                                    <div className="text-green-400">helm install my-elchi elchi/elchi-stack -f values.yaml</div>
                                </div>
                            </div>
                        </div>

                        <div id="elchi-storage" className="space-y-6">
                            <h2 className="text-2xl font-semibold text-white flex items-center">
                                <Database className="w-6 h-6 mr-2 text-orange-400" />
                                Storage Options
                            </h2>
                            
                            <div className="glass-effect p-6 rounded-xl">
                                <h3 className="text-lg font-medium text-white mb-4">MongoDB Configuration</h3>
                                
                                <div className="space-y-4">
                                    <div>
                                        <h4 className="text-white font-medium mb-2">Built-in MongoDB (Default)</h4>
                                        <div className="bg-gray-900/50 rounded-lg p-4 font-mono text-sm">
                                            <div className="text-blue-400">global:</div>
                                            <div className="text-gray-300 ml-2">installMongo: <span className="text-orange-400">true</span></div>
                                            <div className="text-blue-400 mt-2">mongodb:</div>
                                            <div className="text-gray-300 ml-2">persistence:</div>
                                            <div className="text-gray-300 ml-4">enabled: <span className="text-orange-400">true</span></div>
                                            <div className="text-gray-300 ml-4">size: <span className="text-green-400">"10Gi"</span> <span className="text-gray-500"># Adjust based on needs</span></div>
                                            <div className="text-gray-300 ml-4">storageClass: <span className="text-green-400">"fast-ssd"</span> <span className="text-gray-500"># Use your storage class</span></div>
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="text-white font-medium mb-2">External MongoDB</h4>
                                        <div className="bg-gray-900/50 rounded-lg p-4 font-mono text-sm">
                                            <div className="text-blue-400">global:</div>
                                            <div className="text-gray-300 ml-2">installMongo: <span className="text-orange-400">false</span></div>
                                            <div className="text-gray-300 ml-2">mongodb:</div>
                                            <div className="text-gray-300 ml-4">hosts: <span className="text-green-400">"mongo1.example.com:27017,mongo2.example.com:27017"</span></div>
                                            <div className="text-gray-300 ml-4">username: <span className="text-green-400">"elchi"</span></div>
                                            <div className="text-gray-300 ml-4">password: <span className="text-green-400">"secure-password"</span></div>
                                            <div className="text-gray-300 ml-4">database: <span className="text-green-400">"elchi"</span></div>
                                            <div className="text-gray-300 ml-4">replicaset: <span className="text-green-400">"rs0"</span></div>
                                            <div className="text-gray-300 ml-4">tlsEnabled: <span className="text-green-400">"true"</span></div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="glass-effect p-6 rounded-xl">
                                <h3 className="text-lg font-medium text-white mb-4">VictoriaMetrics Configuration</h3>
                                
                                <div className="space-y-4">
                                    <div>
                                        <h4 className="text-white font-medium mb-2">Built-in VictoriaMetrics (Default)</h4>
                                        <div className="bg-gray-900/50 rounded-lg p-4 font-mono text-sm">
                                            <div className="text-blue-400">global:</div>
                                            <div className="text-gray-300 ml-2">installVictoriaMetrics: <span className="text-orange-400">true</span></div>
                                            <div className="text-blue-400 mt-2">victoriametrics:</div>
                                            <div className="text-gray-300 ml-2">storage:</div>
                                            <div className="text-gray-300 ml-4">size: <span className="text-green-400">"20Gi"</span> <span className="text-gray-500"># For metrics storage</span></div>
                                            <div className="text-gray-300 ml-4">storageClass: <span className="text-green-400">"standard"</span></div>
                                            <div className="text-gray-300 ml-2">retentionPeriod: <span className="text-green-400">"30d"</span> <span className="text-gray-500"># Data retention</span></div>
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="text-white font-medium mb-2">External VictoriaMetrics</h4>
                                        <div className="bg-gray-900/50 rounded-lg p-4 font-mono text-sm">
                                            <div className="text-blue-400">global:</div>
                                            <div className="text-gray-300 ml-2">installVictoriaMetrics: <span className="text-orange-400">false</span></div>
                                            <div className="text-gray-300 ml-2">victoriametrics:</div>
                                            <div className="text-gray-300 ml-4">endpoint: <span className="text-green-400">"http://victoria-metrics.monitoring:8428"</span></div>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mt-4">
                                    <div className="flex items-start space-x-3">
                                        <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center mt-0.5">
                                            <span className="text-white text-xs font-bold">i</span>
                                        </div>
                                        <div>
                                            <h4 className="text-blue-400 font-medium mb-1">Storage Sizing Guide</h4>
                                            <ul className="text-blue-200 text-sm space-y-1">
                                                <li>• MongoDB: 10GB for small deployments, 50GB+ for production</li>
                                                <li>• VictoriaMetrics: 20GB for 30 days retention, scale based on metrics volume</li>
                                                <li>• Use SSD storage classes for better performance</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div id="elchi-production" className="space-y-6">
                            <h2 className="text-2xl font-semibold text-white flex items-center">
                                <Settings className="w-6 h-6 mr-2 text-green-400" />
                                Production Setup
                            </h2>
                            
                            <div className="glass-effect p-6 rounded-xl">
                                <h3 className="text-lg font-medium text-white mb-4">Complete Production Configuration</h3>
                                <div className="bg-gray-900/50 rounded-lg p-4 font-mono text-sm overflow-x-auto">
                                    <div className="text-blue-400">global:</div>
                                    <div className="text-gray-300 ml-2">namespace: <span className="text-green-400">"elchi-production"</span></div>
                                    <div className="text-gray-300 ml-2">mainAddress: <span className="text-green-400">"elchi.company.com"</span></div>
                                    <div className="text-gray-300 ml-2">tlsEnabled: <span className="text-orange-400">true</span></div>
                                    <div className="text-gray-300 ml-2">jwt:</div>
                                    <div className="text-gray-300 ml-4">secret: <span className="text-green-400">"$(openssl rand -base64 32)"</span> <span className="text-gray-500"># Generate secure secret</span></div>
                                    <div className="text-gray-300 ml-4">accessTokenDuration: <span className="text-green-400">"1h"</span></div>
                                    <div className="text-gray-300 ml-4">refreshTokenDuration: <span className="text-green-400">"24h"</span></div>
                                    <div className="text-gray-300 ml-2">elchiBackend:</div>
                                    <div className="text-gray-300 ml-4">controlPlaneDefaultReplicas: <span className="text-yellow-400">3</span></div>
                                    <div className="text-gray-300 ml-4">controllerDefaultReplicas: <span className="text-yellow-400">3</span></div>
                                    <div className="text-gray-300 ml-2">versions:</div>
                                    <div className="text-gray-300 ml-4">- tag: <span className="text-green-400">v0.1.0-v0.13.4-envoy1.35.0</span></div>
                                    <div className="text-gray-400 mt-2"># Resource limits for production</div>
                                    <div className="text-blue-400">elchi:</div>
                                    <div className="text-gray-300 ml-2">replicas: <span className="text-yellow-400">3</span></div>
                                    <div className="text-gray-300 ml-2">resources:</div>
                                    <div className="text-gray-300 ml-4">requests:</div>
                                    <div className="text-gray-300 ml-6">memory: <span className="text-green-400">"512Mi"</span></div>
                                    <div className="text-gray-300 ml-6">cpu: <span className="text-green-400">"500m"</span></div>
                                    <div className="text-gray-300 ml-4">limits:</div>
                                    <div className="text-gray-300 ml-6">memory: <span className="text-green-400">"1Gi"</span></div>
                                    <div className="text-gray-300 ml-6">cpu: <span className="text-green-400">"1000m"</span></div>
                                </div>
                            </div>

                            <div className="glass-effect p-6 rounded-xl">
                                <h3 className="text-lg font-medium text-white mb-4">High Availability Setup</h3>
                                <ul className="space-y-2 text-gray-300">
                                    <li className="flex items-start">
                                        <span className="text-green-400 mr-2">✓</span>
                                        <span>Use at least 3 replicas for all critical components</span>
                                    </li>
                                    <li className="flex items-start">
                                        <span className="text-green-400 mr-2">✓</span>
                                        <span>Configure pod anti-affinity rules for distribution across nodes</span>
                                    </li>
                                    <li className="flex items-start">
                                        <span className="text-green-400 mr-2">✓</span>
                                        <span>Use external MongoDB replica set for data persistence</span>
                                    </li>
                                    <li className="flex items-start">
                                        <span className="text-green-400 mr-2">✓</span>
                                        <span>Enable monitoring with external VictoriaMetrics cluster</span>
                                    </li>
                                    <li className="flex items-start">
                                        <span className="text-green-400 mr-2">✓</span>
                                        <span>Configure proper resource limits and requests</span>
                                    </li>
                                </ul>
                            </div>
                        </div>

                        <div id="elchi-security" className="space-y-6">
                            <h2 className="text-2xl font-semibold text-white flex items-center">
                                <Shield className="w-6 h-6 mr-2 text-red-400" />
                                Security Considerations
                            </h2>
                            
                            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6">
                                <div className="flex items-start space-x-3">
                                    <AlertTriangle className="w-6 h-6 text-red-400 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <h3 className="text-red-400 font-semibold mb-2">Critical Security Requirements</h3>
                                        <ul className="space-y-2 text-red-200">
                                            <li className="flex items-start">
                                                <span className="mr-2">⚠️</span>
                                                <span><strong>JWT Secret:</strong> MUST change the default JWT secret to a secure, randomly generated value (minimum 32 characters)</span>
                                            </li>
                                            <li className="flex items-start">
                                                <span className="mr-2">⚠️</span>
                                                <span><strong>TLS:</strong> Always enable TLS for production deployments</span>
                                            </li>
                                            <li className="flex items-start">
                                                <span className="mr-2">⚠️</span>
                                                <span><strong>MongoDB:</strong> Use strong passwords and enable authentication</span>
                                            </li>
                                            <li className="flex items-start">
                                                <span className="mr-2">⚠️</span>
                                                <span><strong>Network Policies:</strong> Implement Kubernetes network policies to restrict pod communication</span>
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            <div className="glass-effect p-6 rounded-xl">
                                <h3 className="text-lg font-medium text-white mb-4">Generate Secure JWT Secret</h3>
                                <div className="bg-gray-900/50 rounded-lg p-4 font-mono text-sm">
                                    <div className="text-gray-400 mb-1"># Generate a secure 32-character secret</div>
                                    <div className="text-green-400">openssl rand -base64 32</div>
                                    <div className="text-gray-400 mt-3 mb-1"># Or using /dev/urandom</div>
                                    <div className="text-green-400">cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 32 | head -n 1</div>
                                </div>
                            </div>

                        </div>
                    </div>
                )
            case 'client':
                return (
                    <div className="space-y-8">
                        <div>
                            <h1 className="text-4xl font-bold text-white mb-4">Elchi Client</h1>
                            <p className="text-xl text-gray-300 leading-relaxed">
                                You can download and run the client to start managing your Envoy Proxy configurations with ease.
                            </p>
                        </div>

                        <div id="download" className="space-y-6">
                            <h2 className="text-2xl font-semibold text-white flex items-center">
                                <Download className="w-6 h-6 mr-2 text-blue-400" />
                                Download
                            </h2>
                            
                            <div className="glass-effect p-6 rounded-xl">
                                <h3 className="text-lg font-medium text-white mb-4">Linux AMD64</h3>
                                <div className="space-y-2">
                                    <div className="flex items-center space-x-3">
                                        <span className="text-gray-300">•</span>
                                        <a href="https://github.com/CloudNativeWorks/elchi-client/releases/download/v1.0.0/elchi-client-linux-amd64" className="text-blue-400 hover:text-blue-300 underline">elchi-client-linux-amd64</a>
                                    </div>
                                    <div className="flex items-center space-x-3">
                                        <span className="text-gray-300">•</span>
                                        <a href="https://github.com/CloudNativeWorks/elchi-client/releases/download/v1.0.0/elchi-client-linux-amd64.sha256" className="text-blue-400 hover:text-blue-300 underline">elchi-client-linux-amd64.sha256</a>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="glass-effect p-6 rounded-xl">
                                <h3 className="text-lg font-medium text-white mb-4">Linux ARM64</h3>
                                <div className="space-y-2">
                                    <div className="flex items-center space-x-3">
                                        <span className="text-gray-300">•</span>
                                        <a href="https://github.com/CloudNativeWorks/elchi-client/releases/download/v1.0.0/elchi-client-linux-arm64" className="text-blue-400 hover:text-blue-300 underline">elchi-client-linux-arm64</a>
                                    </div>
                                    <div className="flex items-center space-x-3">
                                        <span className="text-gray-300">•</span>
                                        <a href="https://github.com/CloudNativeWorks/elchi-client/releases/download/v1.0.0/elchi-client-linux-arm64.sha256" className="text-blue-400 hover:text-blue-300 underline">elchi-client-linux-arm64.sha256</a>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div id="installation" className="space-y-6">
                            <h2 className="text-2xl font-semibold text-white flex items-center">
                                <Settings className="w-6 h-6 mr-2 text-green-400" />
                                Installation
                            </h2>
                            
                            <div className="glass-effect p-6 rounded-xl">
                                <h3 className="text-lg font-medium text-white mb-4">Quick Installation</h3>
                                <div className="bg-gray-900/50 rounded-lg p-4 font-mono text-sm">
                                    <div className="text-gray-400 mb-2"># Download installer</div>
                                    <div className="text-green-400">wget https://github.com/CloudNativeWorks/elchi-client/releases/download/v1.0.0/elchi-install.sh</div>
                                </div>
                            </div>

                            <div className="glass-effect p-6 rounded-xl">
                                <h3 className="text-lg font-medium text-white mb-4">Installation Examples</h3>
                                
                                <div className="space-y-4">
                                    <div>
                                        <h4 className="text-white font-medium mb-2">Production Setup</h4>
                                        <div className="bg-gray-900/50 rounded-lg p-4 font-mono text-sm overflow-x-auto">
                                            <div className="text-gray-400 mb-1"># Production setup (cloud defaults to 'other')</div>
                                            <div className="text-green-400">sudo bash elchi-install.sh \</div>
                                            <div className="text-green-400 ml-4">--name=web-server-01 \</div>
                                            <div className="text-green-400 ml-4">--host=backend.elchi.io \</div>
                                            <div className="text-green-400 ml-4">--port=443 \</div>
                                            <div className="text-green-400 ml-4">--tls=true \</div>
                                            <div className="text-green-400 ml-4">--token=your-auth-token</div>
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="text-white font-medium mb-2">OpenStack Deployment</h4>
                                        <div className="bg-gray-900/50 rounded-lg p-4 font-mono text-sm overflow-x-auto">
                                            <div className="text-gray-400 mb-1"># OpenStack deployment (use your cloud name from UI)</div>
                                            <div className="text-green-400">sudo bash elchi-install.sh \</div>
                                            <div className="text-green-400 ml-4">--name=openstack-vm \</div>
                                            <div className="text-green-400 ml-4">--host=controller.elchi.io \</div>
                                            <div className="text-green-400 ml-4">--port=443 \</div>
                                            <div className="text-green-400 ml-4">--tls=true \</div>
                                            <div className="text-green-400 ml-4">--token=prod-token \</div>
                                            <div className="text-green-400 ml-4">--cloud=my-openstack</div>
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="text-white font-medium mb-2">With BGP Routing</h4>
                                        <div className="bg-gray-900/50 rounded-lg p-4 font-mono text-sm overflow-x-auto">
                                            <div className="text-gray-400 mb-1"># With BGP routing</div>
                                            <div className="text-green-400">sudo bash elchi-install.sh \</div>
                                            <div className="text-green-400 ml-4">--enable-bgp \</div>
                                            <div className="text-green-400 ml-4">--name=edge-router \</div>
                                            <div className="text-green-400 ml-4">--host=controller.elchi.io \</div>
                                            <div className="text-green-400 ml-4">--port=443 \</div>
                                            <div className="text-green-400 ml-4">--tls=true \</div>
                                            <div className="text-green-400 ml-4">--token=prod-token \</div>
                                            <div className="text-green-400 ml-4">--cloud=production</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="glass-effect p-6 rounded-xl">
                                <h3 className="text-lg font-medium text-white mb-4">Configuration Options</h3>
                                
                                <div className="space-y-4">
                                    <div>
                                        <h4 className="text-white font-medium mb-2">Required Parameters</h4>
                                        <ul className="space-y-2 text-gray-300">
                                            <li className="flex items-start">
                                                <span className="text-blue-400 font-mono mr-2">--name=NAME:</span>
                                                <span>Client name</span>
                                            </li>
                                            <li className="flex items-start">
                                                <span className="text-blue-400 font-mono mr-2">--host=HOST:</span>
                                                <span>Server address</span>
                                            </li>
                                            <li className="flex items-start">
                                                <span className="text-blue-400 font-mono mr-2">--port=PORT:</span>
                                                <span>Server port (1-65535)</span>
                                            </li>
                                            <li className="flex items-start">
                                                <span className="text-blue-400 font-mono mr-2">--tls=true|false:</span>
                                                <span>Enable TLS</span>
                                            </li>
                                            <li className="flex items-start">
                                                <span className="text-blue-400 font-mono mr-2">--token=TOKEN:</span>
                                                <span>Authentication token (min 8 chars)</span>
                                            </li>
                                        </ul>
                                    </div>

                                    <div>
                                        <h4 className="text-white font-medium mb-2">Optional Parameters</h4>
                                        <ul className="space-y-2 text-gray-300">
                                            <li className="flex items-start">
                                                <span className="text-purple-400 font-mono mr-2">--cloud=CLOUD:</span>
                                                <span>Cloud/infrastructure provider (defaults to 'other')</span>
                                            </li>
                                            <li className="flex items-start">
                                                <span className="text-purple-400 font-mono mr-2">--enable-bgp:</span>
                                                <span>Install FRR routing</span>
                                            </li>
                                        </ul>
                                    </div>
                                </div>

                                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 mt-4">
                                    <div className="flex items-start space-x-3">
                                        <div className="w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center mt-0.5">
                                            <span className="text-black text-xs font-bold">!</span>
                                        </div>
                                        <div>
                                            <h4 className="text-yellow-400 font-medium mb-1">Important Note</h4>
                                            <p className="text-yellow-200 text-sm">
                                                If you are deploying on OpenStack, specify <span className="font-mono">--cloud=YOUR_CLOUD_NAME</span> (use the cloud name from your UI)
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="glass-effect p-6 rounded-xl">
                                <h3 className="text-lg font-medium text-white mb-4">Manual Installation</h3>
                                
                                <div className="space-y-4">
                                    <div>
                                        <h4 className="text-white font-medium mb-2">For AMD64</h4>
                                        <div className="bg-gray-900/50 rounded-lg p-4 font-mono text-sm">
                                            <div className="text-green-400">wget https://github.com/CloudNativeWorks/elchi-client/releases/download/v1.0.0/elchi-client-linux-amd64</div>
                                            <div className="text-green-400">sudo mv elchi-client-linux-amd64 /usr/local/bin/elchi-client</div>
                                            <div className="text-green-400">sudo chmod +x /usr/local/bin/elchi-client</div>
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="text-white font-medium mb-2">For ARM64</h4>
                                        <div className="bg-gray-900/50 rounded-lg p-4 font-mono text-sm">
                                            <div className="text-green-400">wget https://github.com/CloudNativeWorks/elchi-client/releases/download/v1.0.0/elchi-client-linux-arm64</div>
                                            <div className="text-green-400">sudo mv elchi-client-linux-arm64 /usr/local/bin/elchi-client</div>
                                            <div className="text-green-400">sudo chmod +x /usr/local/bin/elchi-client</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div id="configuration" className="space-y-6">
                            <h2 className="text-2xl font-semibold text-white flex items-center">
                                <Settings className="w-6 h-6 mr-2 text-purple-400" />
                                Configuration
                            </h2>
                            
                            <div className="glass-effect p-6 rounded-xl">
                                <h3 className="text-lg font-medium text-white mb-4">Post-Installation Setup</h3>
                                <p className="text-gray-300 mb-4">
                                    After installation, you need to configure the client to connect to your Elchi server.
                                </p>
                                
                                <div className="space-y-4">
                                    <div>
                                        <h4 className="text-white font-medium mb-2">1. Edit Configuration File</h4>
                                        <p className="text-gray-400 text-sm mb-2">Open the configuration file located at:</p>
                                        <div className="bg-gray-900/50 rounded-lg p-3 font-mono text-sm">
                                            <div className="text-yellow-400">/etc/elchi/config.yaml</div>
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="text-white font-medium mb-2">2. Update Server & Client Configuration</h4>
                                        <p className="text-gray-400 text-sm mb-2">Fill in the following server and client details:</p>
                                        <div className="bg-gray-900/50 rounded-lg p-4 font-mono text-sm">
                                            <div className="text-blue-400">server:</div>
                                            <div className="text-gray-300 ml-2">host: <span className="text-green-400">""</span> <span className="text-gray-500"># Main server address</span></div>
                                            <div className="text-gray-300 ml-2">port: <span className="text-yellow-400">80</span> <span className="text-gray-500"># Main server port</span></div>
                                            <div className="text-gray-300 ml-2">tls: <span className="text-orange-400">false</span> <span className="text-gray-500"># Set to true if you are using TLS on main server</span></div>
                                            <div className="text-gray-300 ml-2">token: <span className="text-green-400">"xxxx-xxxx-xxxx-xxxx"</span> <span className="text-gray-500"># Get from Elchi</span></div>
                                            <div className="text-blue-400 mt-2">client:</div>
                                            <div className="text-gray-300 ml-2">name: <span className="text-green-400">"web-server-01"</span> <span className="text-gray-500"># Set to the name of the machine</span></div>
                                            <div className="text-gray-300 ml-2">bgp: <span className="text-orange-400">false</span> <span className="text-gray-500"># Enable BGP routing (true/false)</span></div>
                                            <div className="text-gray-300 ml-2">cloud: <span className="text-green-400">"aws"</span> <span className="text-gray-500"># Cloud provider (aws, azure, gcp, openstack, other)</span></div>
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="text-white font-medium mb-2">Configuration Examples</h4>
                                        <div className="space-y-3">
                                            <div>
                                                <p className="text-gray-400 text-sm mb-2">Example for AWS deployment:</p>
                                                <div className="bg-gray-900/50 rounded-lg p-3 font-mono text-sm">
                                                    <div className="text-blue-400">client:</div>
                                                    <div className="text-gray-300 ml-2">name: <span className="text-green-400">"aws-instance-01"</span></div>
                                                    <div className="text-gray-300 ml-2">bgp: <span className="text-orange-400">false</span></div>
                                                    <div className="text-gray-300 ml-2">cloud: <span className="text-green-400">"aws"</span></div>
                                                </div>
                                            </div>
                                            
                                            <div>
                                                <p className="text-gray-400 text-sm mb-2">Example for OpenStack with BGP:</p>
                                                <div className="bg-gray-900/50 rounded-lg p-3 font-mono text-sm">
                                                    <div className="text-blue-400">client:</div>
                                                    <div className="text-gray-300 ml-2">name: <span className="text-green-400">"openstack-router"</span></div>
                                                    <div className="text-gray-300 ml-2">bgp: <span className="text-orange-400">true</span></div>
                                                    <div className="text-gray-300 ml-2">cloud: <span className="text-green-400">"my-openstack"</span></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="text-white font-medium mb-2">3. Restart the Service</h4>
                                        <p className="text-gray-400 text-sm mb-2">After updating the configuration, restart the client service:</p>
                                        <div className="bg-gray-900/50 rounded-lg p-3 font-mono text-sm">
                                            <div className="text-green-400">systemctl restart elchi-client.service</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                                <div className="flex items-start space-x-3">
                                    <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center mt-0.5">
                                        <span className="text-white text-xs font-bold">i</span>
                                    </div>
                                    <div>
                                        <h4 className="text-blue-400 font-medium mb-1">Configuration Tips</h4>
                                        <ul className="text-blue-200 text-sm space-y-1">
                                            <li>• Make sure the server address is reachable from your client machine</li>
                                            <li>• Enable TLS if your server uses HTTPS</li>
                                            <li>• Get Token from Elchi UI Settings page</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div id="supported-os" className="space-y-6">
                            <h2 className="text-2xl font-semibold text-white flex items-center">
                                <Monitor className="w-6 h-6 mr-2 text-green-400" />
                                Supported Operating Systems
                            </h2>
                            
                            <div className="glass-effect p-6 rounded-xl">
                                <div className="flex items-center space-x-3 mb-4">
                                    <CheckCircle className="w-5 h-5 text-green-400" />
                                    <span className="text-white font-medium">Linux</span>
                                </div>
                                <div className="pl-8">
                                    <div className="flex items-center space-x-2 text-gray-300">
                                        <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                                        <span>Ubuntu 24.04 (minimum required)</span>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                )
            case 'discovery':
                return (
                    <div className="space-y-8">
                        <div id="discovery-overview">
                            <h1 className="text-4xl font-bold text-white mb-4">Elchi Endpoint Discovery</h1>
                            <p className="text-xl text-gray-300 leading-relaxed">
                                Deploy the Elchi Endpoint Discovery plugin on your Kubernetes cluster using Helm to automatically discover and manage your services.
                            </p>
                        </div>

                        <div id="discovery-prerequisites" className="space-y-6">
                            <h2 className="text-2xl font-semibold text-white flex items-center">
                                <CheckCircle className="w-6 h-6 mr-2 text-green-400" />
                                Prerequisites
                            </h2>
                            
                            <div className="glass-effect p-6 rounded-xl">
                                <ul className="space-y-3 text-gray-300">
                                    <li className="flex items-start">
                                        <span className="text-green-400 mr-2">✓</span>
                                        <span>Kubernetes 1.19+</span>
                                    </li>
                                    <li className="flex items-start">
                                        <span className="text-green-400 mr-2">✓</span>
                                        <span>Helm 3.2.0+ installed on your local machine</span>
                                    </li>
                                    <li className="flex items-start">
                                        <span className="text-green-400 mr-2">✓</span>
                                        <span>Discovery token from Settings → Tokens page</span>
                                    </li>
                                </ul>
                            </div>
                        </div>

                        <div id="discovery-installation" className="space-y-6">
                            <h2 className="text-2xl font-semibold text-white flex items-center">
                                <Download className="w-6 h-6 mr-2 text-blue-400" />
                                Installation
                            </h2>
                            
                            <div className="glass-effect p-6 rounded-xl">
                                <h3 className="text-lg font-medium text-white mb-4">Installation Commands</h3>
                                
                                <div className="space-y-4">
                                    <div>
                                        <h4 className="text-white font-medium mb-2">1. Add Elchi Helm Repository</h4>
                                        <div className="bg-gray-900/50 rounded-lg p-4 font-mono text-sm">
                                            <div className="text-gray-400 mb-1"># Add Elchi Helm repository</div>
                                            <div className="text-green-400">helm repo add elchi https://charts.elchi.io</div>
                                            <div className="text-green-400">helm repo update</div>
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="text-white font-medium mb-2">2. Install Elchi Discovery Agent</h4>
                                        <div className="bg-gray-900/50 rounded-lg p-4 font-mono text-sm overflow-x-auto">
                                            <div className="text-gray-400 mb-1"># Install Elchi Discovery Agent</div>
                                            <div className="text-green-400">helm install elchi-discovery elchi/discovery-agent \</div>
                                            <div className="text-green-400 ml-4">--set config.elchiEndpoint="https://your-elchi-instance.com" \</div>
                                            <div className="text-green-400 ml-4">--set config.token="your-discovery-token" \</div>
                                            <div className="text-green-400 ml-4">--set config.clusterName="my-k8s-cluster" \</div>
                                            <div className="text-green-400 ml-4">--namespace elchi-stack \</div>
                                            <div className="text-green-400 ml-4">--create-namespace</div>
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="text-white font-medium mb-2">3. Verify Installation</h4>
                                        <div className="bg-gray-900/50 rounded-lg p-4 font-mono text-sm">
                                            <div className="text-gray-400 mb-1"># Verify installation</div>
                                            <div className="text-green-400">kubectl get pods -n elchi-stack</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="glass-effect p-6 rounded-xl">
                                <h3 className="text-lg font-medium text-white mb-4">Alternative: Install from Local Chart</h3>
                                <div className="bg-gray-900/50 rounded-lg p-4 font-mono text-sm">
                                    <div className="text-gray-400 mb-1"># Install from local chart</div>
                                    <div className="text-green-400">helm install endpoint-discovery . --values values.yaml</div>
                                </div>
                            </div>
                        </div>

                        <div id="discovery-configuration" className="space-y-6">
                            <h2 className="text-2xl font-semibold text-white flex items-center">
                                <Settings className="w-6 h-6 mr-2 text-purple-400" />
                                Configuration Parameters
                            </h2>
                            
                            <div className="glass-effect p-6 rounded-xl">
                                <div className="space-y-4">
                                    <div className="border-b border-white/10 pb-4">
                                        <h4 className="text-blue-400 font-mono mb-2">config.elchiEndpoint</h4>
                                        <p className="text-gray-300">Your Elchi instance URL</p>
                                    </div>
                                    
                                    <div className="border-b border-white/10 pb-4">
                                        <h4 className="text-blue-400 font-mono mb-2">config.token</h4>
                                        <p className="text-gray-300">Discovery token from Settings page</p>
                                    </div>
                                    
                                    <div className="pb-4">
                                        <h4 className="text-blue-400 font-mono mb-2">config.clusterName</h4>
                                        <p className="text-gray-300">Unique name for your cluster</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                                <div className="flex items-start space-x-3">
                                    <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center mt-0.5">
                                        <span className="text-white text-xs font-bold">i</span>
                                    </div>
                                    <div>
                                        <h4 className="text-blue-400 font-medium mb-1">Quick Tips</h4>
                                        <ul className="text-blue-200 text-sm space-y-1">
                                            <li>• Get your discovery token from the Elchi UI Settings → Tokens page</li>
                                            <li>• The cluster name should be unique across all your Kubernetes clusters</li>
                                            <li>• The discovery agent will automatically detect and register your services</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            default:
                return <div>Section not found</div>
        }
    }

    return (
        <div className="min-h-screen gradient-bg">
            {/* Header */}
            <div className="sticky top-0 z-50 glass-effect border-b border-white/10">
                <div className="container mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <Link 
                            to="/" 
                            className="flex items-center space-x-3 text-white hover:text-blue-400 transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                            <span className="font-medium">Back to Main Site</span>
                        </Link>
                        <div className="flex items-center space-x-3">
                            <img
                                src="/logo.png"
                                alt="Elchi Logo"
                                className="w-20 h-16 object-contain"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex">
                {/* Sidebar */}
                <div className="w-64 min-h-screen glass-effect border-r border-white/10 mt-1">
                    <div className="p-6">
                        <h2 className="text-xl font-bold text-white mb-6">Documentation</h2>
                        
                        <nav className="space-y-2">
                            {sections.map((section) => (
                                <div key={section.id}>
                                    <button
                                        onClick={() => setActiveSection(section.id)}
                                        className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                                            activeSection === section.id
                                                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                                : 'text-gray-300 hover:text-white hover:bg-white/5'
                                        }`}
                                    >
                                        {section.title}
                                    </button>
                                    
                                    {activeSection === section.id && section.subsections && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            className="ml-4 mt-2 space-y-1"
                                        >
                                            {section.subsections.map((subsection) => (
                                                <a
                                                    key={subsection.id}
                                                    href={`#${subsection.id}`}
                                                    className="block px-3 py-1 text-sm text-gray-400 hover:text-white transition-colors"
                                                >
                                                    {subsection.title}
                                                </a>
                                            ))}
                                        </motion.div>
                                    )}
                                </div>
                            ))}
                        </nav>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1">
                    <div className="container mx-auto px-8 py-8 max-w-4xl">
                        <motion.div
                            key={activeSection}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                        >
                            {renderContent()}
                        </motion.div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default DocsPage