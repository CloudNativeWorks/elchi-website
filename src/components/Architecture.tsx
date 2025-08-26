import { motion } from 'framer-motion'
import { Server, Database, Globe, Shield, Layers, FileText, BarChart3, Bot, Network, Activity, Settings, Code, Zap, Container, Cpu, Monitor } from 'lucide-react'

const Architecture = () => {
    const components = [
        {
            id: 'elchi',
            Icon: Globe,
            title: 'Elchi Frontend',
            description: 'React TypeScript UI',
            position: { x: 15, y: 10 },
            color: 'from-blue-500 to-cyan-500',
        },
        {
            id: 'elchi-backend',
            Icon: Server,
            title: 'Elchi Backend',
            description: 'Controller + Control Plane',
            position: { x: 50, y: 45 },
            color: 'from-purple-500 to-pink-500',
        },
        {
            id: 'mongodb',
            Icon: Database,
            title: 'MongoDB Store',
            description: 'Configuration storage',
            position: { x: 75, y: 70 },
            color: 'from-green-500 to-emerald-500',
        },
        {
            id: 'envoy',
            Icon: Layers,
            title: 'Envoy Proxies',
            description: 'Multi-version support',
            position: { x: 80, y: 25 },
            color: 'from-indigo-500 to-purple-500',
        },
        {
            id: 'xds',
            Icon: Network,
            title: 'xDS Protocol',
            description: 'go-control-plane',
            position: { x: 60, y: 15 },
            color: 'from-orange-500 to-red-500',
        },
        {
            id: 'metrics',
            Icon: BarChart3,
            title: 'Metrics',
            description: 'victoriametrics',
            position: { x: 10, y: 60 },
            color: 'from-yellow-500 to-orange-600',
        },
        {
            id: 'agent',
            Icon: Bot,
            title: 'Agent',
            description: 'elchi-agent',
            position: { x: 25, y: 75 },
            color: 'from-cyan-500 to-blue-600',
        },
        {
            id: 'config-info',
            Icon: Settings,
            title: 'Config Info',
            description: 'Proto based configuration',
            position: { x: 60, y: 77 },
            color: 'from-rose-500 to-pink-600',
        },
        {
            id: 'registry',
            Icon: Activity,
            title: 'Registry',
            description: 'Registry Service',
            position: { x: 35, y: 25 },
            color: 'from-emerald-500 to-teal-600',
        }
    ]

    return (
        <section id="architecture" className="py-24 px-6 relative">
            <div className="container mx-auto">
                {/* Section Header */}
                <motion.div
                    className="text-center mb-20"
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    viewport={{ once: true }}
                >
                    <h2 className="text-4xl lg:text-6xl font-bold mb-6">
                        <span className="text-gradient">Architecture</span>
                    </h2>
                    <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                        Elchi architecture combines React TypeScript frontend with Go backend
                    </p>
                </motion.div>

                {/* Architecture Diagram */}
                <div className="relative mb-20">
                    <motion.div
                        className="glass-effect p-8 rounded-3xl relative overflow-hidden"
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8 }}
                        viewport={{ once: true }}
                    >
                        {/* Background Grid */}
                        <div className="absolute inset-0 opacity-10">
                            <div className="w-full h-full" style={{
                                backgroundImage: `
                                    linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                                    linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
                                `,
                                backgroundSize: '20px 20px'
                            }}></div>
                        </div>

                        {/* Components */}
                        <div className="relative h-96">
                            {components.map((component, index) => (
                                <motion.div
                                    key={component.id}
                                    className="absolute"
                                    style={{
                                        left: `${component.position.x}%`,
                                        top: `${component.position.y}%`,
                                        transform: 'translate(-50%, -50%)'
                                    }}
                                    initial={{ opacity: 0, scale: 0 }}
                                    whileInView={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.6, delay: index * 0.2 }}
                                    viewport={{ once: true }}
                                    whileHover={{ scale: 1.1 }}
                                >
                                    <div className={`glass-effect p-4 rounded-xl bg-gradient-to-r ${component.color} bg-opacity-20 min-w-40 text-center group cursor-pointer`}>
                                        <component.Icon className="w-8 h-8 mx-auto mb-2 text-white group-hover:scale-110 transition-transform duration-300" />
                                        <h4 className="text-sm font-bold text-white mb-1">{component.title}</h4>
                                        <p className="text-xs text-gray-300">{component.description}</p>
                                    </div>
                                </motion.div>
                            ))}

                            {/* Connection Lines */}
                            <svg className="absolute inset-0 w-full h-full pointer-events-none">
                                <defs>
                                    <linearGradient id="connectionGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.6" />
                                        <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.6" />
                                    </linearGradient>
                                </defs>
                                {/* Animated connection lines can be added here */}
                            </svg>
                        </div>
                    </motion.div>
                </div>

                {/* Technical Specs */}
                <motion.div
                    className="mt-20 glass-effect p-8 rounded-2xl"
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    viewport={{ once: true }}
                >
                    <h3 className="text-2xl font-bold text-white mb-8 text-center">Technology Stack</h3>

                    {/* Frontend Technologies */}
                    <div className="mb-8">
                        <h4 className="text-lg font-semibold text-blue-400 mb-4 text-center">Frontend</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="glass-effect p-4 rounded-lg text-center hover:scale-105 transition-transform duration-300">
                                <Globe className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                                <div className="text-sm font-bold text-white">React</div>
                                <div className="text-xs text-gray-400">TypeScript</div>
                            </div>
                            <div className="glass-effect p-4 rounded-lg text-center hover:scale-105 transition-transform duration-300">
                                <Code className="w-8 h-8 text-cyan-400 mx-auto mb-2" />
                                <div className="text-sm font-bold text-white">Vite</div>
                                <div className="text-xs text-gray-400">Build Tool</div>
                            </div>
                            <div className="glass-effect p-4 rounded-lg text-center hover:scale-105 transition-transform duration-300">
                                <Zap className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                                <div className="text-sm font-bold text-white">Ant Design</div>
                                <div className="text-xs text-gray-400">UI Components</div>
                            </div>
                            <div className="glass-effect p-4 rounded-lg text-center hover:scale-105 transition-transform duration-300">
                                <Activity className="w-8 h-8 text-green-400 mx-auto mb-2" />
                                <div className="text-sm font-bold text-white">CSS Modules</div>
                                <div className="text-xs text-gray-400">Styling</div>
                            </div>
                        </div>
                    </div>

                    {/* Backend Technologies */}
                    <div className="mb-8">
                        <h4 className="text-lg font-semibold text-purple-400 mb-4 text-center">Backend</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="glass-effect p-4 rounded-lg text-center hover:scale-105 transition-transform duration-300">
                                <Server className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                                <div className="text-sm font-bold text-white">GO</div>
                                <div className="text-xs text-gray-400">Elchi Controller</div>
                            </div>
                            <div className="glass-effect p-4 rounded-lg text-center hover:scale-105 transition-transform duration-300">
                                <Network className="w-8 h-8 text-orange-400 mx-auto mb-2" />
                                <div className="text-sm font-bold text-white">GO</div>
                                <div className="text-xs text-gray-400">Elchi Control Plane</div>
                            </div>
                            <div className="glass-effect p-4 rounded-lg text-center hover:scale-105 transition-transform duration-300">
                                <FileText className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
                                <div className="text-sm font-bold text-white">GO</div>
                                <div className="text-xs text-gray-400">Elchi Registry</div>
                            </div>
                            <div className="glass-effect p-4 rounded-lg text-center hover:scale-105 transition-transform duration-300">
                                <Shield className="w-8 h-8 text-teal-400 mx-auto mb-2" />
                                <div className="text-sm font-bold text-white">gRPC</div>
                                <div className="text-xs text-gray-400">Communication</div>
                            </div>
                        </div>
                    </div>

                    {/* Infrastructure & Monitoring */}
                    <div className="mb-8">
                        <h4 className="text-lg font-semibold text-green-400 mb-4 text-center">Infrastructure & Monitoring</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="glass-effect p-4 rounded-lg text-center hover:scale-105 transition-transform duration-300">
                                <Database className="w-8 h-8 text-green-400 mx-auto mb-2" />
                                <div className="text-sm font-bold text-white">MongoDB</div>
                                <div className="text-xs text-gray-400">Configuration DB</div>
                            </div>
                            <div className="glass-effect p-4 rounded-lg text-center hover:scale-105 transition-transform duration-300">
                                <BarChart3 className="w-8 h-8 text-orange-400 mx-auto mb-2" />
                                <div className="text-sm font-bold text-white">VictoriaMetrics</div>
                                <div className="text-xs text-gray-400">Monitoring</div>
                            </div>
                            <div className="glass-effect p-4 rounded-lg text-center hover:scale-105 transition-transform duration-300">
                                <Container className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                                <div className="text-sm font-bold text-white">Docker</div>
                                <div className="text-xs text-gray-400">Containerization</div>
                            </div>
                            <div className="glass-effect p-4 rounded-lg text-center hover:scale-105 transition-transform duration-300">
                                <Bot className="w-8 h-8 text-cyan-400 mx-auto mb-2" />
                                <div className="text-sm font-bold text-white">Elchi Agent</div>
                                <div className="text-xs text-gray-400">Agent for Client Side</div>
                            </div>
                        </div>
                    </div>

                    {/* Proxy & Service Mesh */}
                    <div>
                        <h4 className="text-lg font-semibold text-indigo-400 mb-4 text-center">Proxy & Service Mesh</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="glass-effect p-4 rounded-lg text-center hover:scale-105 transition-transform duration-300">
                                <Layers className="w-8 h-8 text-indigo-400 mx-auto mb-2" />
                                <div className="text-sm font-bold text-white">Envoy Proxy</div>
                                <div className="text-xs text-gray-400">Multi-version Support</div>
                            </div>
                            <div className="glass-effect p-4 rounded-lg text-center hover:scale-105 transition-transform duration-300">
                                <Cpu className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                                <div className="text-sm font-bold text-white">go-control-plane</div>
                                <div className="text-xs text-gray-400">Envoy Management</div>
                            </div>
                            <div className="glass-effect p-4 rounded-lg text-center hover:scale-105 transition-transform duration-300">
                                <Monitor className="w-8 h-8 text-pink-400 mx-auto mb-2" />
                                <div className="text-sm font-bold text-white">Registry</div>
                                <div className="text-xs text-gray-400">Service Discovery</div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    )
}

export default Architecture 