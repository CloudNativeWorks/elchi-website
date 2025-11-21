import { motion } from 'framer-motion'
import { Server, Database, Globe, Network, Shield, BarChart3, Bot, Code, Layers, Cloud, Zap, FileText, Activity, Cpu } from 'lucide-react'

const ArchitectureNew = () => {
    const architectureLayers = [
        {
            title: 'Frontend Layer',
            color: 'from-blue-500 to-cyan-500',
            components: [
                { icon: Globe, name: 'React 18', desc: 'Modern UI Framework', detail: '' },
                { icon: Code, name: 'TypeScript', desc: 'Type Safety', detail: '' },
                { icon: Zap, name: 'Ant Design', desc: 'Component Library', detail: '' },
                { icon: Code, name: 'Monaco Editor', desc: 'Code Editing', detail: '' },
                { icon: Network, name: 'Cytoscape', desc: 'Graph Visualization', detail: '' },
                { icon: BarChart3, name: 'ECharts', desc: 'Metrics Charts', detail: '' }
            ]
        },
        {
            title: 'Backend Layer - 3-Process Architecture',
            color: 'from-purple-500 to-pink-500',
            components: [
                { icon: Server, name: 'Controller', desc: 'REST API (Port: Custom)', detail: 'Client management, xDS resources, User auth' },
                { icon: Cpu, name: 'Control-Plane', desc: 'gRPC xDS (Port: 18000)', detail: 'ADS, VHDS, Snapshot cache' },
                { icon: FileText, name: 'Registry', desc: 'Discovery (Port: 9090)', detail: 'Service discovery, Version routing' }
            ]
        },
        {
            title: 'Data & Storage Layer',
            color: 'from-green-500 to-emerald-500',
            components: [
                { icon: Database, name: 'MongoDB', desc: 'Config Storage', detail: '' },
                { icon: BarChart3, name: 'VictoriaMetrics', desc: 'Time-Series DB', detail: '' },
                { icon: Bot, name: 'OpenRouter', desc: 'AI Model Integration', detail: '' }
            ]
        },
        {
            title: 'Proxy Layer',
            color: 'from-orange-500 to-red-500',
            components: [
                { icon: Layers, name: 'Envoy Proxy', desc: 'Multi-Version Support', detail: '' },
                { icon: Shield, name: 'WAF', desc: 'OWASP CRS', detail: '' },
                { icon: Activity, name: 'Health Check', desc: 'Auto-Recovery', detail: '' }
            ]
        }
    ]

    const integrations = [
        { name: 'Kubernetes', icon: Cloud, color: 'text-blue-400' },
        { name: 'Docker', icon: Layers, color: 'text-cyan-400' },
        { name: 'gRPC', icon: Network, color: 'text-purple-400' },
        { name: 'Prometheus', icon: BarChart3, color: 'text-orange-400' }
    ]

    return (
        <section id="architecture" className="py-24 px-6 relative overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl"></div>
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl"></div>
            </div>

            <div className="container mx-auto relative z-10">
                {/* Section Header */}
                <motion.div
                    className="text-center mb-20"
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    viewport={{ once: true }}
                >
                    <h2 className="text-4xl lg:text-6xl font-bold mb-6">
                        <span className="text-gradient">Layered Architecture</span>
                    </h2>
                    <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                        Modern technology stack with distributed processing and enterprise-grade components
                    </p>
                </motion.div>

                {/* Architecture Layers */}
                <div className="space-y-8 mb-20">
                    {architectureLayers.map((layer, layerIndex) => (
                        <motion.div
                            key={layer.title}
                            initial={{ opacity: 0, x: -50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.6, delay: layerIndex * 0.2 }}
                            viewport={{ once: true }}
                            className="glass-effect p-8 rounded-2xl"
                        >
                            {/* Layer Title */}
                            <div className="flex items-center mb-6">
                                <div className={`h-1 w-12 bg-gradient-to-r ${layer.color} rounded mr-4`}></div>
                                <h3 className="text-2xl font-bold text-white">{layer.title}</h3>
                            </div>

                            {/* Components Grid */}
                            <div className={`grid grid-cols-2 md:grid-cols-3 ${layer.components.length > 3 ? 'lg:grid-cols-6' : 'lg:grid-cols-3'} gap-6`}>
                                {layer.components.map((component, index) => {
                                    const Icon = component.icon
                                    return (
                                        <motion.div
                                            key={component.name}
                                            className="relative group"
                                            initial={{ opacity: 0, y: 20 }}
                                            whileInView={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.4, delay: layerIndex * 0.2 + index * 0.1 }}
                                            viewport={{ once: true }}
                                            whileHover={{ scale: 1.05 }}
                                        >
                                            <div className="bg-white/5 hover:bg-white/10 p-6 rounded-xl border border-white/10 transition-all duration-300">
                                                {/* Icon */}
                                                <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${layer.color} p-2.5 mb-4 mx-auto`}>
                                                    <Icon className="w-full h-full text-white" />
                                                </div>

                                                {/* Name */}
                                                <div className="text-center">
                                                    <div className="text-white font-bold text-sm mb-1">{component.name}</div>
                                                    <div className="text-gray-400 text-xs">{component.desc}</div>
                                                    {component.detail && component.detail.length > 0 && (
                                                        <div className="text-gray-500 text-xs mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            {component.detail}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </motion.div>
                                    )
                                })}
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Data Flow Diagram */}
                <motion.div
                    className="glass-effect p-10 rounded-2xl mb-20"
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    viewport={{ once: true }}
                >
                    <h3 className="text-2xl font-bold text-white mb-8 text-center">Request Flow</h3>

                    <div className="flex flex-col md:flex-row items-center justify-center space-y-4 md:space-y-0 md:space-x-6">
                        {[
                            { label: 'Client', icon: Globe, color: 'from-blue-500 to-cyan-500' },
                            { label: 'Registry', icon: FileText, color: 'from-yellow-500 to-orange-500' },
                            { label: 'Controller', icon: Server, color: 'from-purple-500 to-pink-500' },
                            { label: 'Control-Plane', icon: Cpu, color: 'from-green-500 to-emerald-500' },
                            { label: 'Envoy', icon: Layers, color: 'from-red-500 to-orange-500' }
                        ].map((step, index) => {
                            const Icon = step.icon
                            return (
                                <div key={step.label} className="flex items-center">
                                    <motion.div
                                        className="flex flex-col items-center"
                                        initial={{ opacity: 0, scale: 0 }}
                                        whileInView={{ opacity: 1, scale: 1 }}
                                        transition={{ duration: 0.4, delay: index * 0.15 }}
                                        viewport={{ once: true }}
                                    >
                                        <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${step.color} p-3 mb-2`}>
                                            <Icon className="w-full h-full text-white" />
                                        </div>
                                        <span className="text-sm text-gray-300 font-medium">{step.label}</span>
                                    </motion.div>

                                    {index < 4 && (
                                        <motion.div
                                            className="hidden md:block mx-4"
                                            initial={{ opacity: 0, x: -20 }}
                                            whileInView={{ opacity: 1, x: 0 }}
                                            transition={{ duration: 0.4, delay: index * 0.15 + 0.2 }}
                                            viewport={{ once: true }}
                                        >
                                            <div className="flex flex-col items-center">
                                                <div className="text-cyan-400 text-2xl">→</div>
                                                <div className="text-xs text-gray-500 mt-1">
                                                    {index === 0 ? 'Register' : index === 1 ? 'Route' : index === 2 ? 'xDS' : 'Config'}
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </div>
                            )
                        })}
                    </div>

                    {/* Flow Description */}
                    <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-400">
                        <div className="bg-white/5 p-4 rounded-lg">
                            <span className="text-cyan-400 font-semibold">Registration:</span> Clients register with Registry for service discovery
                        </div>
                        <div className="bg-white/5 p-4 rounded-lg">
                            <span className="text-purple-400 font-semibold">Routing:</span> Registry routes clients to appropriate Controller version
                        </div>
                        <div className="bg-white/5 p-4 rounded-lg">
                            <span className="text-green-400 font-semibold">xDS Protocol:</span> Control-Plane serves Envoy configurations via gRPC
                        </div>
                        <div className="bg-white/5 p-4 rounded-lg">
                            <span className="text-orange-400 font-semibold">Configuration:</span> Envoy receives and applies dynamic configurations
                        </div>
                    </div>
                </motion.div>

                {/* Integrations */}
                <motion.div
                    className="text-center"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.8 }}
                    viewport={{ once: true }}
                >
                    <h3 className="text-2xl font-bold text-white mb-8">Native Integrations</h3>
                    <div className="flex flex-wrap justify-center gap-6">
                        {integrations.map((integration, index) => {
                            const Icon = integration.icon
                            return (
                                <motion.div
                                    key={integration.name}
                                    className="glass-effect px-8 py-4 rounded-xl flex items-center space-x-3"
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    whileInView={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.4, delay: 0.9 + index * 0.1 }}
                                    viewport={{ once: true }}
                                    whileHover={{ scale: 1.05 }}
                                >
                                    <Icon className={`w-6 h-6 ${integration.color}`} />
                                    <span className="text-white font-semibold">{integration.name}</span>
                                </motion.div>
                            )
                        })}
                    </div>
                </motion.div>
            </div>
        </section>
    )
}

export default ArchitectureNew
