import { motion } from 'framer-motion'
import { Shield, Rocket, Database, BarChart3, FileText, Award, ScrollText, Radar, ArrowUpCircle, Server, UserCheck } from 'lucide-react'

const ComprehensiveFeatures = () => {
    const features = [
        {
            icon: Shield,
            title: 'Web Application Firewall (WAF)',
            description: 'Integrated OWASP Core Rule Set (CRS) with customizable directive sets, per-authority rules, and comprehensive filtering by severity, phase, and paranoia level.',
            highlights: [
                'OWASP CRS integration',
                'Custom directive management',
                'Domain-specific rules',
                'Rule browser & import'
            ],
            color: 'from-red-500 to-orange-500'
        },
        {
            icon: Rocket,
            title: 'Scenario Workflows',
            subtitle: 'Quick Start Templates',
            description: 'Pre-built scenario workflows with step-by-step wizards for common Envoy configurations. Execute, test, and deploy configurations efficiently.',
            highlights: [
                'Scenario wizard',
                'Dynamic forms',
                'Configuration review',
                'Quick deployment'
            ],
            color: 'from-purple-500 to-pink-500'
        },
        {
            icon: Radar,
            title: 'Service Discovery',
            subtitle: 'Auto Registration',
            description: 'Discover and manage clusters automatically. Track service status, monitor cluster health, and manage registration with real-time updates.',
            highlights: [
                'Cluster discovery',
                'Status monitoring',
                'Usage statistics',
                'Last seen tracking'
            ],
            color: 'from-blue-500 to-cyan-500'
        },
        {
            icon: Award,
            title: 'ACME Certificate Management',
            subtitle: 'Automated SSL/TLS',
            description: 'Automated certificate lifecycle management with ACME protocol support for Let\'s Encrypt and Google Trust Services. DNS-01 challenge verification with auto-renewal.',
            highlights: [
                'Let\'s Encrypt integration',
                'Google Trust Services',
                'DNS provider management',
                'Automatic renewal'
            ],
            color: 'from-green-500 to-emerald-500'
        },
        {
            icon: ScrollText,
            title: 'Audit Logging',
            subtitle: 'Compliance & Security',
            description: 'Complete audit trail for all user actions, configuration changes, and system operations. Filter by date, action type, user, and resource.',
            highlights: [
                'Action tracking',
                'User accountability',
                'Resource changes',
                'Compliance reporting'
            ],
            color: 'from-yellow-500 to-orange-500'
        },
        {
            icon: BarChart3,
            title: 'Advanced Metrics',
            subtitle: 'Real-time Monitoring',
            description: 'ECharts-powered visualization with downstream, upstream, and listener metrics. Custom time ranges, metric grouping, and auto-refresh.',
            highlights: [
                'Real-time charts',
                'Custom time ranges',
                'Metric filtering',
                'Export capabilities'
            ],
            color: 'from-indigo-500 to-purple-500'
        },
        {
            icon: FileText,
            title: 'Log Management',
            subtitle: 'Intelligent Analysis',
            description: 'Real-time service logs with JSON parsing, HTTP access log detection, and intelligent log analysis for pattern detection and troubleshooting.',
            highlights: [
                'JSON log parsing',
                'Log level filtering',
                'Search functionality',
                'Pattern detection'
            ],
            color: 'from-pink-500 to-rose-500'
        },
        {
            icon: Database,
            title: 'Registry Management',
            subtitle: 'Configuration Central',
            description: 'Centralized configuration registry with version tracking, resource metadata, and schema information for all Envoy configurations.',
            highlights: [
                'Version tracking',
                'Resource metadata',
                'Schema validation',
                'Registry browser'
            ],
            color: 'from-teal-500 to-blue-500'
        },
        {
            icon: ArrowUpCircle,
            title: 'Version Upgrade',
            subtitle: 'Seamless Migration',
            description: 'Effortlessly upgrade Envoy configurations from one version to another. Migrate resources from version X to version Y with automated compatibility checks.',
            highlights: [
                'Cross-version migration',
                'Compatibility validation',
                'Resource transformation',
                'Zero-downtime upgrades'
            ],
            color: 'from-violet-500 to-purple-500'
        },
        {
            icon: Server,
            title: 'Log Export',
            subtitle: 'Syslog & ELK Integration',
            description: 'Export logs to external systems via Syslog and Elastic Logstash. Centralize log management and integrate with your existing observability stack.',
            highlights: [
                'Syslog integration',
                'Elastic Logstash support',
                'Centralized logging',
                'Flexible export formats'
            ],
            color: 'from-amber-500 to-orange-500'
        },
        {
            icon: BarChart3,
            title: 'Metrics Visualization',
            subtitle: 'Platform & Grafana',
            description: 'View detailed metrics both on the platform and through Grafana integration. Monitor performance, traffic patterns, and system health in real-time.',
            highlights: [
                'Built-in dashboards',
                'Grafana integration',
                'Custom metrics',
                'Real-time updates'
            ],
            color: 'from-sky-500 to-blue-500'
        },
        {
            icon: UserCheck,
            title: 'LDAP Authentication',
            subtitle: 'Enterprise SSO',
            description: 'Integrate with your existing LDAP/Active Directory infrastructure. Centralized user authentication and authorization for enterprise deployments.',
            highlights: [
                'LDAP integration',
                'Active Directory support',
                'Centralized auth',
                'Enterprise SSO'
            ],
            color: 'from-emerald-500 to-green-500'
        }
    ]

    return (
        <section id="comprehensive-features" className="py-20 px-6 relative overflow-hidden bg-gradient-to-b from-gray-900 to-black">
            {/* Background */}
            <div className="absolute inset-0">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl"></div>
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
                        <span className="text-gradient">Comprehensive Feature Set</span>
                    </h2>
                    <p className="text-xl text-gray-400 max-w-3xl mx-auto">
                        Advanced capabilities for security, monitoring, and operational excellence
                    </p>
                </motion.div>

                {/* Features Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {features.map((feature, index) => {
                        const Icon = feature.icon
                        return (
                            <motion.div
                                key={feature.title}
                                className="glass-effect p-6 rounded-2xl relative overflow-hidden group"
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.6, delay: index * 0.1 }}
                                whileHover={{ scale: 1.05 }}
                            >
                                {/* Gradient Background */}
                                <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${feature.color} opacity-5 group-hover:opacity-10 rounded-full blur-2xl transition-opacity duration-300`}></div>

                                {/* Icon */}
                                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} p-2.5 mb-4 relative z-10`}>
                                    <Icon className="w-full h-full text-white" />
                                </div>

                                {/* Content */}
                                <div className="relative z-10">
                                    <h3 className="text-lg font-bold text-white mb-1">{feature.title}</h3>
                                    {feature.subtitle && (
                                        <div className="text-xs text-cyan-400 mb-3">{feature.subtitle}</div>
                                    )}
                                    <p className="text-sm text-gray-400 mb-4">{feature.description}</p>

                                    {/* Highlights */}
                                    <ul className="space-y-1">
                                        {feature.highlights.map((highlight, idx) => (
                                            <li key={idx} className="flex items-start space-x-2 text-xs text-gray-300">
                                                <div className="w-1 h-1 rounded-full bg-cyan-400 mt-1.5 flex-shrink-0"></div>
                                                <span>{highlight}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </motion.div>
                        )
                    })}
                </div>

                {/* Bottom Note */}
                <motion.div
                    className="text-center mt-16"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 1 }}
                >
                    <p className="text-gray-400 text-lg">
                        All features integrated into a{' '}
                        <span className="text-gradient font-semibold">unified management platform</span>
                    </p>
                </motion.div>
            </div>
        </section>
    )
}

export default ComprehensiveFeatures
