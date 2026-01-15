import { motion } from 'framer-motion'
import { Brain, Cloud, Shield, Eye, Globe } from 'lucide-react'

const AdvancedFeatures = () => {
    const features = [
        {
            icon: Brain,
            title: 'AI-Powered Analysis',
            subtitle: 'OpenRouter AI Integration',
            description: 'Bring your own OpenRouter API key and choose any AI model for configuration analysis, log debugging, pattern recognition, and intelligent troubleshooting recommendations.',
            highlights: [
                'Configuration analysis',
                'Log pattern recognition',
                'Anomaly detection',
                'Root cause analysis'
            ],
            color: 'from-purple-500 to-pink-500'
        },
        {
            icon: Cloud,
            title: 'Kubernetes Discovery',
            subtitle: 'Auto Endpoint Management',
            description: 'Automatic discovery and synchronization of Kubernetes endpoints with real-time updates as your services scale.',
            highlights: [
                'Auto-discover K8s services',
                'Real-time endpoint updates',
                'Multi-cluster support',
                'Service mesh integration'
            ],
            color: 'from-blue-500 to-cyan-500'
        },
        {
            icon: Shield,
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
            icon: Globe,
            title: 'Global Server Load Balancing',
            subtitle: 'DNS-Based Traffic Management',
            description: 'Enterprise GSLB with intelligent health probing, automatic failover, and geo-based traffic routing. Integrate with CoreDNS for dynamic DNS responses based on endpoint health.',
            highlights: [
                'HTTP/HTTPS/TCP health probes',
                'Anti-flapping protection',
                'Per-record failover zones',
                'Circuit breaker with backoff'
            ],
            color: 'from-orange-500 to-amber-500'
        }
    ]

    return (
        <section id="advanced-features" className="py-20 px-6 relative overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0">
                <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl"></div>
                <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl"></div>
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
                        <span className="text-gradient">Advanced Features</span>
                    </h2>
                    <p className="text-xl text-gray-400 max-w-3xl mx-auto">
                        Enterprise-grade capabilities with intelligent automation and modern cloud-native technologies
                    </p>
                </motion.div>

                {/* Features Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {features.map((feature, index) => {
                        const Icon = feature.icon
                        return (
                            <motion.div
                                key={feature.title}
                                className="glass-effect p-8 rounded-2xl relative overflow-hidden group"
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.6, delay: index * 0.1 }}
                                whileHover={{ scale: 1.02 }}
                            >
                                {/* Gradient Background */}
                                <div className={`absolute top-0 right-0 w-64 h-64 bg-gradient-to-br ${feature.color} opacity-5 group-hover:opacity-10 rounded-full blur-3xl transition-opacity duration-300`}></div>

                                {/* Icon */}
                                <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${feature.color} p-3 mb-4 relative z-10`}>
                                    <Icon className="w-full h-full text-white" />
                                </div>

                                {/* Content */}
                                <div className="relative z-10">
                                    <h3 className="text-2xl font-bold text-white mb-1">{feature.title}</h3>
                                    <div className="text-sm text-cyan-400 mb-4">{feature.subtitle}</div>
                                    <p className="text-gray-400 mb-6">{feature.description}</p>

                                    {/* Highlights */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {feature.highlights.map((highlight, idx) => (
                                            <div key={idx} className="flex items-start space-x-2">
                                                <Eye className="w-4 h-4 mt-0.5 flex-shrink-0 text-cyan-400" />
                                                <span className="text-sm text-gray-300">{highlight}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        )
                    })}
                </div>

                {/* Bottom CTA */}
                <motion.div
                    className="text-center mt-16"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.8 }}
                >
                    <div className="glass-effect inline-block px-8 py-4 rounded-xl">
                        <p className="text-gray-300">
                            <span className="text-gradient font-semibold">Intelligent Automation</span> meets{' '}
                            <span className="text-gradient font-semibold">Cloud-Native Architecture</span>
                        </p>
                    </div>
                </motion.div>
            </div>
        </section>
    )
}

export default AdvancedFeatures
