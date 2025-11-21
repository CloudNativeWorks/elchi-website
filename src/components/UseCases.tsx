import { motion } from 'framer-motion'
import { Globe, GitBranch, Cloud, Building2, Boxes, Layers } from 'lucide-react'

const UseCases = () => {
    const useCases = [
        {
            icon: Globe,
            title: 'API Gateway Management',
            description: 'Centralized management of Envoy as an API gateway for microservices architectures.',
            scenarios: [
                'Rate limiting and traffic control',
                'Authentication and authorization',
                'Request/response transformation',
                'API versioning and routing'
            ],
            gradient: 'from-blue-500 to-cyan-500'
        },
        {
            icon: GitBranch,
            title: 'Service Mesh Management',
            description: 'Deploy and manage Envoy as a service mesh data plane with centralized control.',
            scenarios: [
                'Service-to-service communication',
                'Traffic splitting and canary deployments',
                'Circuit breaking and retry policies',
                'Observability and metrics collection'
            ],
            gradient: 'from-purple-500 to-pink-500'
        },
        {
            icon: Cloud,
            title: 'Multi-Cluster Deployment',
            description: 'Manage Envoy instances across multiple Kubernetes clusters with unified configuration.',
            scenarios: [
                'Cross-cluster service discovery',
                'Unified policy enforcement',
                'Disaster recovery and failover',
                'Global load balancing'
            ],
            gradient: 'from-green-500 to-emerald-500'
        },
        {
            icon: Building2,
            title: 'Enterprise Microservices',
            description: 'Enterprise-grade proxy management with multi-tenancy and role-based access control.',
            scenarios: [
                'Team-based configuration isolation',
                'Audit logging and compliance',
                'Centralized policy management',
                'Self-service configuration'
            ],
            gradient: 'from-orange-500 to-yellow-500'
        },
        {
            icon: Boxes,
            title: 'Cloud-Native Applications',
            description: 'Modern cloud-native applications leveraging Envoy for traffic management and observability.',
            scenarios: [
                'Container-based deployments',
                'Auto-scaling and load balancing',
                'Zero-downtime deployments',
                'Health checking and monitoring'
            ],
            gradient: 'from-indigo-500 to-purple-500'
        },
        {
            icon: Layers,
            title: 'Edge Proxy & CDN',
            description: 'Deploy Envoy at the edge for content delivery and request routing.',
            scenarios: [
                'Geographic traffic routing',
                'Cache management',
                'DDoS protection',
                'SSL/TLS termination'
            ],
            gradient: 'from-pink-500 to-rose-500'
        }
    ]

    const industries = [
        'Financial Services',
        'E-Commerce',
        'Healthcare',
        'Technology',
        'Telecommunications',
        'Media & Entertainment'
    ]

    return (
        <section id="use-cases" className="py-20 px-6 relative overflow-hidden bg-gradient-to-b from-black to-gray-900">
            {/* Background */}
            <div className="absolute inset-0">
                <div className="absolute top-1/3 right-1/3 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl"></div>
                <div className="absolute bottom-1/3 left-1/3 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl"></div>
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
                        <span className="text-gradient">Use Cases</span>
                    </h2>
                    <p className="text-xl text-gray-400 max-w-3xl mx-auto">
                        Versatile platform designed for diverse deployment scenarios
                    </p>
                </motion.div>

                {/* Use Cases Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
                    {useCases.map((useCase, index) => {
                        const Icon = useCase.icon
                        return (
                            <motion.div
                                key={useCase.title}
                                className="glass-effect p-8 rounded-2xl relative overflow-hidden group"
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.6, delay: index * 0.1 }}
                                whileHover={{ scale: 1.02 }}
                            >
                                {/* Gradient Background */}
                                <div className={`absolute top-0 right-0 w-40 h-40 bg-gradient-to-br ${useCase.gradient} opacity-5 group-hover:opacity-10 rounded-full blur-3xl transition-opacity duration-300`}></div>

                                {/* Icon */}
                                <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${useCase.gradient} p-3 mb-4 relative z-10`}>
                                    <Icon className="w-full h-full text-white" />
                                </div>

                                {/* Content */}
                                <div className="relative z-10">
                                    <h3 className="text-xl font-bold text-white mb-3">{useCase.title}</h3>
                                    <p className="text-gray-400 mb-6">{useCase.description}</p>

                                    {/* Scenarios */}
                                    <div className="space-y-2">
                                        <div className="text-sm font-semibold text-cyan-400 mb-3">Common Scenarios:</div>
                                        <ul className="space-y-2">
                                            {useCase.scenarios.map((scenario, idx) => (
                                                <li key={idx} className="flex items-start space-x-2 text-sm text-gray-300">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 flex-shrink-0"></div>
                                                    <span>{scenario}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </motion.div>
                        )
                    })}
                </div>

                {/* Industries Section */}
                <motion.div
                    className="glass-effect p-10 rounded-2xl"
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.8 }}
                >
                    <h3 className="text-2xl font-bold text-white mb-8 text-center">
                        Trusted Across Industries
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                        {industries.map((industry, index) => (
                            <motion.div
                                key={industry}
                                className="bg-white/5 p-4 rounded-xl text-center"
                                initial={{ opacity: 0, scale: 0.9 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.4, delay: 0.9 + index * 0.05 }}
                                whileHover={{ scale: 1.05 }}
                            >
                                <span className="text-gray-300 font-medium text-sm">{industry}</span>
                            </motion.div>
                        ))}
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
                    <p className="text-gray-400 text-lg">
                        Whatever your use case, Elchi provides the{' '}
                        <span className="text-gradient font-semibold">flexibility and power</span> you need
                    </p>
                </motion.div>
            </div>
        </section>
    )
}

export default UseCases
