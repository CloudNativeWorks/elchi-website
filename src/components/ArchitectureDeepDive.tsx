import { motion } from 'framer-motion'
import { Database, Server, Cpu, Network, ArrowRight, Shield, Zap } from 'lucide-react'

const ArchitectureDeepDive = () => {
    const processes = [
        {
            name: 'Registry',
            port: '9090',
            icon: Database,
            color: 'from-blue-500 to-cyan-500',
            description: 'Service discovery and routing hub',
            features: [
                'Controller registration & address sharing',
                'Client location tracking',
                'Version-based control-plane routing',
                'External processing integration',
                'In-memory data with auto-cleanup'
            ]
        },
        {
            name: 'Controller',
            port: 'Configurable',
            icon: Server,
            color: 'from-purple-500 to-pink-500',
            description: 'REST API and management layer',
            features: [
                'Client management & command dispatch',
                'xDS resource management (CDS, LDS, RDS, EDS)',
                'User & authorization (JWT + RBAC)',
                'MongoDB integration',
                'AI-powered config analysis (Claude)',
                'K8s Discovery system'
            ]
        },
        {
            name: 'Control-Plane',
            port: '18000',
            icon: Cpu,
            color: 'from-green-500 to-emerald-500',
            description: 'gRPC-based xDS control plane',
            features: [
                'Envoy ADS (Aggregated Discovery Service)',
                'VHDS (Virtual Host Discovery Service)',
                'Snapshot management & cache system',
                'Bridge services (snapshot, resource, poke)',
                'Auto-registration with registry',
                'Health monitoring & keepalive'
            ]
        }
    ]

    const connections = [
        { from: 'Registry', to: 'Controller', label: 'Registration & Discovery' },
        { from: 'Controller', to: 'Control-Plane', label: 'Config Sync' },
        { from: 'Control-Plane', to: 'Envoy', label: 'xDS Protocol (gRPC)' }
    ]

    return (
        <section id="architecture-deep-dive" className="py-20 px-6 relative overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0">
                <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl"></div>
                <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl"></div>
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
                        <span className="text-gradient">3-Process Distributed Architecture</span>
                    </h2>
                    <p className="text-xl text-gray-400 max-w-3xl mx-auto">
                        Enterprise-grade scalability with specialized microservices working in harmony
                    </p>
                </motion.div>

                {/* Process Flow Diagram */}
                <div className="mb-20">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
                        {processes.map((process, index) => {
                            const Icon = process.icon
                            return (
                                <motion.div
                                    key={process.name}
                                    className="glass-effect p-8 rounded-2xl relative overflow-hidden"
                                    initial={{ opacity: 0, y: 30 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.6, delay: index * 0.2 }}
                                    whileHover={{ scale: 1.02 }}
                                >
                                    {/* Gradient Background */}
                                    <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${process.color} opacity-10 rounded-full blur-2xl`}></div>

                                    {/* Icon */}
                                    <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${process.color} p-3 mb-4 relative z-10`}>
                                        <Icon className="w-full h-full text-white" />
                                    </div>

                                    {/* Content */}
                                    <h3 className="text-2xl font-bold text-white mb-2">{process.name}</h3>
                                    <div className="text-sm text-gray-500 mb-4">Port: {process.port}</div>
                                    <p className="text-gray-400 mb-6">{process.description}</p>

                                    {/* Features */}
                                    <ul className="space-y-2">
                                        {process.features.map((feature, idx) => (
                                            <li key={idx} className="flex items-start space-x-2 text-sm text-gray-300">
                                                <ArrowRight className="w-4 h-4 mt-0.5 flex-shrink-0 text-cyan-400" />
                                                <span>{feature}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </motion.div>
                            )
                        })}
                    </div>

                    {/* Flow Arrows */}
                    <motion.div
                        className="flex items-center justify-center space-x-4 flex-wrap"
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.8 }}
                    >
                        {connections.map((conn, index) => (
                            <div key={index} className="flex items-center space-x-2">
                                <div className="glass-effect px-4 py-2 rounded-lg">
                                    <span className="text-sm font-semibold text-white">{conn.from}</span>
                                </div>
                                <div className="flex flex-col items-center">
                                    <ArrowRight className="w-8 h-8 text-cyan-400" />
                                    <span className="text-xs text-gray-500 mt-1">{conn.label}</span>
                                </div>
                                <div className="glass-effect px-4 py-2 rounded-lg">
                                    <span className="text-sm font-semibold text-white">{conn.to}</span>
                                </div>
                            </div>
                        ))}
                    </motion.div>
                </div>

                {/* Key Benefits */}
                <motion.div
                    className="grid grid-cols-1 md:grid-cols-3 gap-8"
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 1 }}
                >
                    {[
                        {
                            icon: Shield,
                            title: 'High Availability',
                            description: 'Multiple control-plane instances with automatic failover and health monitoring'
                        },
                        {
                            icon: Zap,
                            title: 'Scalability',
                            description: 'Load balancing across controllers and control-planes for enterprise workloads'
                        },
                        {
                            icon: Network,
                            title: 'Version Routing',
                            description: 'Intelligent routing to appropriate control-plane versions based on client requirements'
                        }
                    ].map((benefit) => {
                        const Icon = benefit.icon
                        return (
                            <motion.div
                                key={benefit.title}
                                className="glass-effect p-6 rounded-xl text-center"
                                whileHover={{ scale: 1.05 }}
                            >
                                <Icon className="w-12 h-12 mx-auto mb-4 text-cyan-400" />
                                <h4 className="text-xl font-bold text-white mb-2">{benefit.title}</h4>
                                <p className="text-gray-400">{benefit.description}</p>
                            </motion.div>
                        )
                    })}
                </motion.div>
            </div>
        </section>
    )
}

export default ArchitectureDeepDive
