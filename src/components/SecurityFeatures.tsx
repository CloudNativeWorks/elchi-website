import { motion } from 'framer-motion'
import { Shield, Lock, Users, Key, FileText, Building2, CheckCircle } from 'lucide-react'

const SecurityFeatures = () => {
    const features = [
        {
            icon: Lock,
            title: 'JWT Authentication',
            description: 'Secure token-based authentication for all API endpoints with configurable expiration and refresh mechanisms.',
            capabilities: [
                'Token-based authentication',
                'Automatic token refresh',
                'Secure session management',
                'Configurable expiration'
            ]
        },
        {
            icon: Users,
            title: '4-Tier RBAC System',
            description: 'Granular role-based access control with Owner, Admin, Editor, and Viewer roles for precise permission management.',
            capabilities: [
                'Owner: Full system control',
                'Admin: User & project management',
                'Editor: Configuration changes',
                'Viewer: Read-only access'
            ]
        },
        {
            icon: Building2,
            title: 'Multi-Tenancy',
            description: 'Complete project isolation with tenant-based resource separation ensuring data privacy and security.',
            capabilities: [
                'Project-based isolation',
                'Resource segregation',
                'Tenant-specific configurations',
                'Cross-tenant security'
            ]
        },
        {
            icon: Key,
            title: 'API Token Management',
            description: 'Generate and manage API tokens for programmatic access with fine-grained permissions and audit trails.',
            capabilities: [
                'Personal access tokens',
                'Service account tokens',
                'Scoped permissions',
                'Token rotation support'
            ]
        },
        {
            icon: FileText,
            title: 'Audit Logging',
            description: 'Comprehensive audit logs tracking all configuration changes, user actions, and system events for compliance.',
            capabilities: [
                'Configuration change tracking',
                'User action logging',
                'System event monitoring',
                'Compliance reporting'
            ]
        },
        {
            icon: Shield,
            title: 'TLS/mTLS Support',
            description: 'End-to-end encryption with TLS and mutual TLS support for secure communication between all components.',
            capabilities: [
                'TLS encryption',
                'Mutual TLS authentication',
                'Certificate management',
                'Secure gRPC connections'
            ]
        }
    ]

    const complianceFeatures = [
        'SOC 2 Ready Architecture',
        'GDPR Compliant Data Handling',
        'Complete Audit Trail',
        'Data Encryption at Rest',
        'Role-Based Access Control',
        'Multi-Factor Authentication Ready'
    ]

    return (
        <section id="security-features" className="py-20 px-6 relative overflow-hidden bg-gradient-to-b from-gray-900 to-black">
            {/* Background */}
            <div className="absolute inset-0">
                <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl"></div>
                <div className="absolute bottom-1/3 right-1/3 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl"></div>
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
                    <div className="inline-block mb-4">
                        <Shield className="w-16 h-16 text-cyan-400 mx-auto" />
                    </div>
                    <h2 className="text-4xl lg:text-5xl font-bold mb-6">
                        <span className="text-gradient">Enterprise Security</span>
                    </h2>
                    <p className="text-xl text-gray-400 max-w-3xl mx-auto">
                        Production-ready security features designed for enterprise compliance and data protection
                    </p>
                </motion.div>

                {/* Features Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
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
                                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500 to-cyan-500 opacity-5 group-hover:opacity-10 rounded-full blur-2xl transition-opacity duration-300"></div>

                                {/* Icon */}
                                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 p-3 mb-4 relative z-10">
                                    <Icon className="w-full h-full text-white" />
                                </div>

                                {/* Content */}
                                <div className="relative z-10">
                                    <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                                    <p className="text-gray-400 mb-4 text-sm">{feature.description}</p>

                                    {/* Capabilities */}
                                    <ul className="space-y-2">
                                        {feature.capabilities.map((capability, idx) => (
                                            <li key={idx} className="flex items-start space-x-2 text-sm text-gray-300">
                                                <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-green-400" />
                                                <span>{capability}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </motion.div>
                        )
                    })}
                </div>

                {/* Compliance Section */}
                <motion.div
                    className="glass-effect p-10 rounded-2xl"
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.6 }}
                >
                    <h3 className="text-2xl font-bold text-white mb-8 text-center">
                        Compliance & Standards
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {complianceFeatures.map((feature, index) => (
                            <motion.div
                                key={feature}
                                className="flex items-center space-x-3 bg-white/5 p-4 rounded-xl"
                                initial={{ opacity: 0, x: -20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.4, delay: 0.7 + index * 0.1 }}
                            >
                                <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0" />
                                <span className="text-gray-300 font-medium">{feature}</span>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>

                {/* Bottom Note */}
                <motion.div
                    className="text-center mt-12"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 1 }}
                >
                    <p className="text-gray-400">
                        Built with security-first mindset for{' '}
                        <span className="text-gradient font-semibold">enterprise-grade deployments</span>
                    </p>
                </motion.div>
            </div>
        </section>
    )
}

export default SecurityFeatures
