import { motion } from 'framer-motion'
import { CheckCircle } from 'lucide-react'

const SecurityFeatures = () => {
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
