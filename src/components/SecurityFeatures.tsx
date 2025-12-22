import { motion } from 'framer-motion'
import { Shield, Lock, Users, Key, FileText, Building2, CheckCircle, Award } from 'lucide-react'

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
        },
        {
            icon: Award,
            title: 'ACME Certificate Management',
            description: 'Automated certificate lifecycle management with ACME protocol support for Let\'s Encrypt and Google Trust Services.',
            capabilities: [
                'Automatic certificate issuance',
                'Multi-provider support',
                'DNS-01 challenge verification',
                'Auto-renewal and rotation'
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


                {/* Features Grid */}


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
