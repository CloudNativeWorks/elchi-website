import { motion } from 'framer-motion'
import { CheckCircle, X, Zap, Brain, GitBranch, Shield, ArrowUpCircle, UserCheck, Server, BarChart3 } from 'lucide-react'

const WhyElchi = () => {
    const comparisons = [
        {
            feature: 'Intelligent Configuration Analysis',
            elchi: true,
            manual: false,
            serviceMesh: false,
            description: 'Automated intelligent config analysis and troubleshooting with advanced recommendations'
        },
        {
            feature: 'Proto-to-UI Auto Generation',
            elchi: true,
            manual: false,
            serviceMesh: false,
            description: 'Automatically generate UI components from Envoy protobuf definitions'
        },
        {
            feature: 'Multi-Version Envoy Support',
            elchi: true,
            manual: false,
            serviceMesh: 'Partial',
            description: 'Support for Envoy versions 1.27 through 1.35+ with version routing'
        },
        {
            feature: '3-Process Distributed Architecture',
            elchi: true,
            manual: false,
            serviceMesh: true,
            description: 'Scalable architecture with Registry, Controller, and Control-Plane'
        },
        {
            feature: 'Real-time Configuration Validation',
            elchi: true,
            manual: false,
            serviceMesh: 'Basic',
            description: 'Two-step validation before applying changes to production'
        },
        {
            feature: 'Kubernetes Auto-Discovery',
            elchi: true,
            manual: false,
            serviceMesh: true,
            description: 'Automatic endpoint discovery and synchronization with K8s'
        },
        {
            feature: 'Visual Dependency Graphs',
            elchi: true,
            manual: false,
            serviceMesh: 'Limited',
            description: 'Interactive Cytoscape-based dependency visualization'
        },
        {
            feature: 'Enterprise Multi-Tenancy',
            elchi: true,
            manual: false,
            serviceMesh: 'Varies',
            description: 'Project-based isolation with 4-tier RBAC'
        },
        {
            feature: 'Version Upgrade & Migration',
            elchi: true,
            manual: false,
            serviceMesh: false,
            description: 'Seamlessly migrate Envoy configs from version X to Y with compatibility checks'
        },
        {
            feature: 'LDAP/AD Authentication',
            elchi: true,
            manual: false,
            serviceMesh: 'Varies',
            description: 'Enterprise SSO integration with LDAP and Active Directory'
        },
        {
            feature: 'Log Export (Syslog/ELK)',
            elchi: true,
            manual: false,
            serviceMesh: 'Limited',
            description: 'Export logs to external systems via Syslog and Elastic Logstash'
        },
        {
            feature: 'Grafana Integration',
            elchi: true,
            manual: false,
            serviceMesh: true,
            description: 'Native integration with Grafana for advanced metrics visualization'
        },
        {
            feature: 'Web Application Firewall (WAF)',
            elchi: true,
            manual: false,
            serviceMesh: false,
            description: 'Integrated OWASP CRS with customizable rules'
        },
        {
            feature: 'ACME Certificate Management',
            elchi: true,
            manual: false,
            serviceMesh: 'Limited',
            description: 'Automated certificate lifecycle with Let\'s Encrypt and Google Trust Services'
        },
        {
            feature: 'Learning Curve',
            elchi: 'Easy',
            manual: 'Steep',
            serviceMesh: 'Medium',
            description: 'Intuitive UI vs complex YAML configurations'
        },
        {
            feature: 'Configuration Complexity',
            elchi: 'Simple',
            manual: 'High',
            serviceMesh: 'Medium',
            description: 'Visual UI vs manual configuration files'
        }
    ]

    const uniqueFeatures = [
        {
            icon: Brain,
            title: 'Intelligent Automation',
            description: 'Advanced automated analysis for configuration optimization and intelligent log troubleshooting'
        },
        {
            icon: Zap,
            title: 'Auto-Generated UI',
            description: 'Unique proto-to-UI generation means support for new Envoy features without manual UI updates'
        },
        {
            icon: GitBranch,
            title: 'Version Intelligence',
            description: 'Smart routing to appropriate control-plane versions based on client Envoy version'
        },
        {
            icon: Shield,
            title: 'Enterprise Ready',
            description: 'Built from ground up for multi-tenancy, RBAC, and compliance requirements'
        },
        {
            icon: ArrowUpCircle,
            title: 'Seamless Upgrades',
            description: 'Effortlessly upgrade between Envoy versions with automated compatibility validation'
        },
        {
            icon: UserCheck,
            title: 'Enterprise Auth',
            description: 'LDAP/AD integration for centralized authentication and authorization'
        },
        {
            icon: Server,
            title: 'Log Centralization',
            description: 'Export logs to Syslog and ELK stack for unified observability'
        },
        {
            icon: BarChart3,
            title: 'Advanced Metrics',
            description: 'Built-in dashboards with Grafana integration for comprehensive monitoring'
        }
    ]

    const renderValue = (value: boolean | string) => {
        if (typeof value === 'boolean') {
            return value ? (
                <CheckCircle className="w-6 h-6 text-green-400 mx-auto" />
            ) : (
                <X className="w-6 h-6 text-red-400 mx-auto" />
            )
        }
        return <span className={`text-sm font-medium ${
            value === 'Easy' || value === 'Simple' ? 'text-green-400' :
            value === 'Steep' || value === 'High' ? 'text-red-400' :
            'text-yellow-400'
        }`}>{value}</span>
    }

    return (
        <section id="why-elchi" className="py-20 px-6 relative overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl"></div>
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl"></div>
            </div>

            <div className="container mx-auto relative z-10">
                {/* Section Header */}
                <motion.div
                    className="text-center mb-16"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                >
                    <h2 className="text-4xl lg:text-5xl font-bold mb-6">
                        <span className="text-gradient">Why Choose Elchi?</span>
                    </h2>
                    <p className="text-xl text-gray-400 max-w-3xl mx-auto">
                        See how Elchi compares to manual Envoy configuration and traditional service mesh solutions
                    </p>
                </motion.div>

                {/* Comparison Table */}
                <motion.div
                    className="mb-20 overflow-x-auto"
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                >
                    <div className="glass-effect rounded-2xl p-8 min-w-[800px]">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-700">
                                    <th className="text-left py-4 px-4 text-gray-400 font-semibold">Feature</th>
                                    <th className="text-center py-4 px-4">
                                        <div className="text-gradient font-bold text-lg">Elchi</div>
                                    </th>
                                    <th className="text-center py-4 px-4 text-gray-400 font-semibold">Manual Config</th>
                                    <th className="text-center py-4 px-4 text-gray-400 font-semibold">Service Mesh</th>
                                </tr>
                            </thead>
                            <tbody>
                                {comparisons.map((item, index) => (
                                    <motion.tr
                                        key={item.feature}
                                        className="border-b border-gray-800 hover:bg-white/5 transition-colors"
                                        initial={{ opacity: 0, x: -20 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ duration: 0.4, delay: 0.3 + index * 0.05 }}
                                    >
                                        <td className="py-4 px-4">
                                            <div className="text-white font-medium">{item.feature}</div>
                                            <div className="text-xs text-gray-500 mt-1">{item.description}</div>
                                        </td>
                                        <td className="py-4 px-4 text-center bg-cyan-500/5">
                                            {renderValue(item.elchi)}
                                        </td>
                                        <td className="py-4 px-4 text-center">
                                            {renderValue(item.manual)}
                                        </td>
                                        <td className="py-4 px-4 text-center">
                                            {renderValue(item.serviceMesh)}
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </motion.div>

                {/* Unique Features */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.8 }}
                >
                    <h3 className="text-3xl font-bold text-center mb-12">
                        <span className="text-gradient">What Makes Elchi Unique</span>
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {uniqueFeatures.map((feature, index) => {
                            const Icon = feature.icon
                            return (
                                <motion.div
                                    key={feature.title}
                                    className="glass-effect p-6 rounded-xl text-center"
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.4, delay: 0.9 + index * 0.1 }}
                                    whileHover={{ scale: 1.05 }}
                                >
                                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 p-3 mx-auto mb-4">
                                        <Icon className="w-full h-full text-white" />
                                    </div>
                                    <h4 className="text-lg font-bold text-white mb-2">{feature.title}</h4>
                                    <p className="text-sm text-gray-400">{feature.description}</p>
                                </motion.div>
                            )
                        })}
                    </div>
                </motion.div>

                {/* Bottom CTA */}
                <motion.div
                    className="text-center mt-16"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 1.2 }}
                >
                    <div className="glass-effect inline-block px-8 py-6 rounded-xl">
                        <p className="text-xl text-gray-300 mb-4">
                            Ready to simplify your Envoy proxy management?
                        </p>
                        <motion.button
                            className="btn-primary"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => window.open('https://demo.elchi.io', '_blank')}
                        >
                            Try Demo Now
                        </motion.button>
                    </div>
                </motion.div>
            </div>
        </section>
    )
}

export default WhyElchi
