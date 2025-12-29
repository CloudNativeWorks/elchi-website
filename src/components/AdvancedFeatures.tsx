import { motion } from 'framer-motion'
import { Brain, Cloud, Activity, GitBranch, Eye, Workflow } from 'lucide-react'

const AdvancedFeatures = () => {
    const features = [
        {
            icon: Brain,
            title: 'Intelligent Configuration Analysis',
            subtitle: 'OpenRouter AI Integration',
            description: 'Bring your own OpenRouter API key and choose any AI model for automated configuration analysis with intelligent recommendations, error detection, and optimization suggestions.',
            highlights: [
                'Bring your own API key',
                'Choose any AI model',
                'Automatic error detection',
                'Performance optimization'
            ],
            color: 'from-purple-500 to-pink-500'
        },
        {
            icon: Brain,
            title: 'Intelligent Log Analysis',
            subtitle: 'AI-Powered Debugging',
            description: 'Use your preferred AI model via OpenRouter to analyze Envoy access and error logs, quickly identify issues, patterns, and anomalies in your proxy traffic.',
            highlights: [
                'Multiple AI models',
                'Pattern recognition',
                'Anomaly detection',
                'Root cause analysis'
            ],
            color: 'from-pink-500 to-rose-500'
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
            icon: Activity,
            title: 'Health Monitoring',
            subtitle: 'Continuous Reliability',
            description: 'Comprehensive health checks with automatic recovery mechanisms ensuring your control plane is always operational.',
            highlights: [
                'Real-time health checks',
                'Auto-recovery mechanisms',
                'gRPC keepalive monitoring',
                'Process status tracking'
            ],
            color: 'from-green-500 to-emerald-500'
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
