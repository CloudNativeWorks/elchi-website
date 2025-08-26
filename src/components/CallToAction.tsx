import { motion } from 'framer-motion'
import { ArrowRight, Download, Star, Users } from 'lucide-react'

const CallToAction = () => {
    return (
        <section className="py-24 px-6 relative">
            <div className="container mx-auto">
                {/* Background Effects */}
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute top-0 left-1/4 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl animate-pulse-slow"></div>
                    <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl animate-pulse-slow delay-1000"></div>
                </div>

                <motion.div
                    className="glass-effect p-12 lg:p-16 rounded-3xl text-center relative overflow-hidden"
                    initial={{ opacity: 0, y: 50 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    viewport={{ once: true }}
                >
                    {/* Background Pattern */}
                    <div className="absolute inset-0 opacity-5">
                        <div className="w-full h-full" style={{
                            backgroundImage: `
                radial-gradient(circle at 20% 50%, rgba(120, 119, 198, 0.3), transparent 50%),
                radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.3), transparent 50%),
                radial-gradient(circle at 40% 80%, rgba(120, 199, 255, 0.3), transparent 50%)`
                        }}></div>
                    </div>

                    <div className="relative z-10">
                        {/* Main Heading */}
                        <motion.h2
                            className="text-4xl lg:text-6xl font-bold mb-6"
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.3 }}
                            viewport={{ once: true }}
                        >
                            <span className="text-white">Experience Elchi</span>
                            <br />
                            <span className="text-gradient"> Now</span>
                        </motion.h2>

                        {/* Description */}
                        <motion.p
                            className="text-xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed"
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.4 }}
                            viewport={{ once: true }}
                        >
                            Try the stack solution for Proxy management with our demo,
                            or deploy to your Kubernetes cluster using our Helm chart.
                        </motion.p>

                        {/* Stats */}
                        <motion.div
                            className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12"
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.5 }}
                            viewport={{ once: true }}
                        >
                            <div className="flex items-center justify-center space-x-3">
                                <Users className="w-8 h-8 text-blue-400" />
                                <div>
                                    <div className="text-2xl font-bold text-white">Demo</div>
                                    <div className="text-gray-400 text-sm">Access</div>
                                </div>
                            </div>
                            <div className="flex items-center justify-center space-x-3">
                                <Download className="w-8 h-8 text-green-400" />
                                <div>
                                    <div className="text-2xl font-bold text-white">K8s</div>
                                    <div className="text-gray-400 text-sm">Helm Deploy</div>
                                </div>
                            </div>
                            <div className="flex items-center justify-center space-x-3">
                                <Star className="w-8 h-8 text-yellow-400" />
                                <div>
                                    <div className="text-2xl font-bold text-white">Agent</div>
                                    <div className="text-gray-400 text-sm">Client Support</div>
                                </div>
                            </div>
                        </motion.div>

                        {/* CTA Buttons */}
                        <motion.div
                            className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6"
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.6 }}
                            viewport={{ once: true }}
                        >
                            <motion.button
                                className="btn-primary flex items-center space-x-2 text-lg px-12 py-4"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => window.open('https://demo.elchi.io', '_blank')}
                            >
                                <span>Try Demo</span>
                                <ArrowRight size={20} />
                            </motion.button>

                            <motion.button
                                className="btn-secondary flex items-center space-x-2 text-lg px-12 py-4"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => window.open('https://artifacthub.io/packages/helm/elchi-stack/elchi-stack', '_blank')}
                            >
                                <Download size={20} />
                                <span>Helm Chart</span>
                            </motion.button>
                        </motion.div>

                        {/* Trust Indicators */}
                        <motion.div
                            className="flex flex-wrap items-center justify-center space-x-8 mt-12 opacity-60"
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 0.6 }}
                            transition={{ duration: 0.8, delay: 0.8 }}
                            viewport={{ once: true }}
                        >
                            <div className="text-sm text-gray-400">✓ Ready To Use</div>
                            <div className="text-sm text-gray-400">✓ MongoDB Store</div>
                            <div className="text-sm text-gray-400">✓ Multi-Version Proxy</div>
                            <div className="text-sm text-gray-400">✓ Agent Support</div>
                        </motion.div>
                    </div>
                </motion.div>
            </div>
        </section>
    )
}

export default CallToAction 