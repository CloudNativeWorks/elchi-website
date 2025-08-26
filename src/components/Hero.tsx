import { motion } from 'framer-motion'
import { ArrowRight, Zap, Shield, Settings } from 'lucide-react'

const Hero = () => {
    const floatingIcons = [
        { Icon: Zap, delay: 0.2, x: 100, y: 50 },
        { Icon: Shield, delay: 0.4, x: -80, y: 80 },
        { Icon: Settings, delay: 0.6, x: 120, y: -40 },
    ]

    return (
        <header id="home" role="banner" className="relative min-h-screen flex items-center justify-center pt-20 px-6">
            {/* Background Elements */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse-slow"></div>
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse-slow delay-1000"></div>
            </div>

            {/* Floating Icons */}
            {floatingIcons.map(({ Icon, delay, x, y }, index) => (
                <motion.div
                    key={index}
                    className="absolute hidden lg:block"
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{
                        opacity: 0.3,
                        scale: 1,
                        x: [0, x, 0],
                        y: [0, y, 0]
                    }}
                    transition={{
                        duration: 8,
                        delay,
                        repeat: Infinity,
                        repeatType: "reverse"
                    }}
                    style={{
                        left: `${20 + index * 20}%`,
                        top: `${30 + index * 15}%`
                    }}
                >
                    <Icon size={40} className="text-blue-400" />
                </motion.div>
            ))}

            <div className="container mx-auto text-center relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                >

                    {/* Main Heading */}
                    <h1 className="text-5xl lg:text-7xl font-bold mb-6 leading-tight" itemProp="headline">
                        <span className="text-white">Elchi is the</span>
                        <br />
                        <span className="text-gradient">Next Generation Proxy Management</span>
                    </h1>

                    {/* Subtitle */}
                    <p className="text-xl lg:text-2xl text-gray-300 mb-12 max-w-4xl mx-auto leading-relaxed">
                        Manage multi proxy configurations, real-time validation, metric views and visual dependency graphs across any infrastructure.
                    </p>

                    {/* CTA Buttons */}
                    <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6 mb-16">
                        <motion.button
                            className="btn-primary flex items-center space-x-2"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => window.open('https://demo.elchi.io', '_blank')}
                        >
                            <span>Try Demo</span>
                            <ArrowRight size={20} />
                        </motion.button>

                        {/* <motion.button
                            className="btn-secondary flex items-center space-x-2"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <Play size={20} />
                            <span>Watch Demo</span>
                        </motion.button> */}
                    </div>

                    {/* Stats */}
                    <motion.div
                        className="grid grid-cols-1 md:grid-cols-4 gap-8 max-w-6xl mx-auto"
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.4 }}
                    >
                        {[
                            { number: 'xDS', label: 'Protocol Support' },
                            { number: 'Real-time', label: 'Config Validation' },
                            { number: 'Multi-Version', label: 'Envoy Support' },
                            { number: 'Agent', label: 'Powered Management' },
                            { number: 'Metrics', label: 'Graphs' },
                            { number: 'Dependencies', label: 'Graphs' },
                            { number: 'Quick', label: 'Configuration Scenarios' },
                            { number: 'Proto', label: 'Generated configurations' },
                        ].map((stat, index) => (
                            <motion.div
                                key={index}
                                className="glass-effect p-6 rounded-xl"
                                whileHover={{ scale: 1.05 }}
                            >
                                <div className="text-3xl font-bold text-gradient mb-2">{stat.number}</div>
                                <div className="text-gray-400">{stat.label}</div>
                            </motion.div>
                        ))}
                    </motion.div>
                </motion.div>
            </div>

            {/* Scroll Indicator */}
            <motion.div
                className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
            >
                <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center">
                    <div className="w-1 h-3 bg-white/50 rounded-full mt-2 animate-pulse"></div>
                </div>
            </motion.div>
        </header>
    )
}

export default Hero 