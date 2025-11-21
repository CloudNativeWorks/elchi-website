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
            title: 'Proto to UI Auto-Generation',
            description: 'Automatically generates UI configuration components from Envoy protobuf definitions. Create Listeners, Clusters, Endpoints, and Routes with full TypeScript type safety and validation.',
            color: 'from-blue-500 to-cyan-500'
        },
        {
            Icon: GitBranch,
            title: 'Interactive Dependency Graphs',
            description: 'Cytoscape-powered visual diagrams display relationships between Envoy components. Understand resource dependencies, data flow, and troubleshoot configurations with interactive exploration.',
            color: 'from-green-500 to-emerald-500'
        },
        {
            Icon: Zap,
            title: 'Quick Start Scenarios',
            description: 'Pre-built templates for common Envoy configurations. Generate complete setups for API gateways, load balancers, and service mesh deployments with just a few clicks.',
            color: 'from-yellow-500 to-orange-500'
        },
        {
            Icon: HardHat,
            title: 'Go-Based Agent',
            description: 'Lightweight Go agent for client-side Envoy management. Automatic registration, health monitoring, log export to Syslog/ELK, and seamless integration with the control plane.',
            color: 'from-orange-500 to-red-500'
        },
        {
            Icon: Server,
            title: 'Full xDS Protocol Support',
            description: 'Complete implementation of xDS (ADS, CDS, EDS, LDS, RDS, VHDS) using go-control-plane. Delta xDS support for efficient incremental configuration updates.',
            color: 'from-indigo-500 to-purple-500'
        },
        {
            Icon: Shield,
            title: 'Two-Step Validation',
            description: 'Frontend TypeScript validation and backend protoc-gen-validate ensures configurations are correct before deployment. Catch errors early and prevent misconfigurations.',
            color: 'from-teal-500 to-blue-500'
        },
        {
            Icon: Settings,
            title: 'Save & Publish Workflow',
            description: 'Draft mode for safe configuration changes. Save incrementally and publish bulk updates atomically when ready. Rollback support for quick recovery from issues.',
            color: 'from-pink-500 to-rose-500'
        },
        {
            Icon: Network,
            title: 'Multi-Version Envoy Support',
            description: 'Manage Envoy versions 1.27 through 1.35+ from a single interface. Intelligent version-based routing with seamless version upgrade capability. Migrate resources from version X to Y effortlessly.',
            color: 'from-purple-500 to-pink-500'
        },
        {
            Icon: Monitor,
            title: 'Project-Based Multi-Tenancy',
            description: 'Organize configurations by teams, environments, or customers. Complete resource isolation with 4-tier RBAC (Owner, Admin, Editor, Viewer) for enterprise collaboration.',
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
                        <span className="text-gradient">Core Features</span>
                    </h2>
                    <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                        Comprehensive platform for enterprise Envoy Proxy management with modern UI and powerful automation
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