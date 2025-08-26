import { motion } from 'framer-motion'
import {
    Layers,
    GitBranch,
    HardHat,
    Zap,
    Network,
    Shield,
    Settings,
    Monitor,
    Server
} from 'lucide-react'

const Features = () => {
    const features = [
        {
            Icon: Layers,
            title: 'Proto to UI Components',
            description: 'Dynamically generates configuration sections using Proxy proto files. Create Listeners, Clusters, Endpoints, and HTTPRoutes directly from the UI with TypeScript validation.',
            color: 'from-blue-500 to-cyan-500'
        },
        {
            Icon: GitBranch,
            title: 'Interactive Dependency Graphs',
            description: 'Visual flow diagrams display relationships between Proxy components. Understand resource dependencies, data flow, and troubleshoot configurations with ease.',
            color: 'from-green-500 to-emerald-500'
        },
        {
            Icon: Zap,
            title: 'Quick Start Scenarios',
            description: 'Effortlessly generate basic and advanced Proxy configurations with minimal input. Automated resource creation streamlines the configuration process.',
            color: 'from-yellow-500 to-orange-500'
        },
        {
            Icon: HardHat,
            title: 'Agent Support',
            description: 'Elchi provides a go-based agent for client side configuration management.',
            color: 'from-orange-500 to-red-500'
        },
        {
            Icon: Server,
            title: 'xDS Protocol Support',
            description: 'Elchi backend gRPC server provides full xDS protocol support using go-control-plane. Delta gRPC for incremental updates and dynamic resource management.',
            color: 'from-indigo-500 to-purple-500'
        },
        {
            Icon: Shield,
            title: 'Two-Step Validation',
            description: 'Frontend validation using TypeScript proto conversion and backend validation with protoc-gen-validate ensures configuration reliability and error prevention.',
            color: 'from-teal-500 to-blue-500'
        },
        {
            Icon: Settings,
            title: 'Save & Publish Workflow',
            description: 'Incrementally modify configurations without immediate deployment. Save changes safely and publish bulk updates when ready across multiple components.',
            color: 'from-pink-500 to-rose-500'
        },
        {
            Icon: Network,
            title: 'Multi-Version Support',
            description: 'Manage multiple Proxy versions from single interface. Dynamic routing based on bootstrap files enables centralized management of different version requirements.',
            color: 'from-purple-500 to-pink-500'
        },
        {
            Icon: Monitor,
            title: 'Project-Based Architecture',
            description: 'Organize configurations by teams or environments. Improved collaboration with isolated changes and independent project management for organizational scalability.',
            color: 'from-cyan-500 to-teal-500'
        }
    ]

    return (
        <section id="features" className="py-24 px-6 relative" aria-labelledby="features-heading">
            <div className="container mx-auto">
                {/* Section Header */}
                <motion.div
                    className="text-center mb-20"
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    viewport={{ once: true }}
                >
                    <h2 id="features-heading" className="text-4xl lg:text-6xl font-bold mb-6">
                        <span className="text-gradient">Powerful Features</span>
                    </h2>
                    <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                        Elchi provides a complete solution for enterprise Proxy management.
                    </p>
                </motion.div>

                {/* Features Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {features.map((feature, index) => (
                        <motion.div
                            key={index}
                            className="feature-card group cursor-pointer"
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: index * 0.1 }}
                            viewport={{ once: true }}
                            whileHover={{ y: -5 }}
                        >
                            {/* Icon */}
                            <div className={`w-16 h-16 rounded-xl bg-gradient-to-r ${feature.color} p-4 mb-6 group-hover:scale-110 transition-transform duration-300`}>
                                <feature.Icon className="w-full h-full text-white" />
                            </div>

                            {/* Content */}
                            <h3 className="text-xl font-bold text-white mb-4 group-hover:text-gradient transition-all duration-300">
                                {feature.title}
                            </h3>
                            <p className="text-gray-400 leading-relaxed group-hover:text-gray-300 transition-colors duration-300">
                                {feature.description}
                            </p>

                            {/* Hover Effect */}
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    )
}

export default Features 