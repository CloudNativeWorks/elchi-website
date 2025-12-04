import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ZoomIn, ChevronLeft, ChevronRight } from 'lucide-react'

const ScreenshotGallery = () => {
    const screenshots = [
        {
            id: 1,
            title: "Service Management",
            description: "Manage your services and their configurations with intuitive interface",
            image: "service.png",
            category: "Management"
        },
        {
            id: 2,
            title: "Service Management 2",
            description: "Manage your services and their configurations with intuitive interface",
            image: "service2.png",
            category: "Management"
        },
        {
            id: 3,
            title: "Service Management 3",
            description: "Manage your services and their configurations with intuitive interface",
            image: "service3.png",
            category: "Management"
        },
        {
            id: 4,
            title: "Advanced Filters",
            description: "Use powerful filters to find and manage your proxies",
            image: "filter.png",
            category: "Tools"
        },
        {
            id: 5,
            title: "Advanced Filters 2",
            description: "Use powerful filters to find and manage your proxies",
            image: "filter2.png",
            category: "Tools"
        },
        {
            id: 6,
            title: "Scenario Workflows",
            description: "Wizard-based configuration management for quick setup",
            image: "scenario.png",
            category: "Configuration"
        },
        {
            id: 7,
            title: "Metrics Dashboard",
            description: "Real-time metrics visualization with ECharts integration",
            image: "metric.png",
            category: "Monitoring"
        },
        {
            id: 8,
            title: "Dependency Graph",
            description: "Interactive visual representation of service dependencies",
            image: "dependency.png",
            category: "Visualization"
        },
        {
            id: 9,
            title: "Platform Overview",
            description: "Complete overview of Elchi platform capabilities",
            image: "main.png",
            category: "Overview"
        },
        {
            id: 10,
            title: "Platform Overview 2",
            description: "Complete overview of Elchi platform capabilities",
            image: "main2.png",
            category: "Overview"
        },
        {
            id: 11,
            title: "xDS Configuration",
            description: "Comprehensive xDS protocol configuration interface",
            image: "configuration.png",
            category: "Configuration"
        },
        {
            id: 12,
            title: "Agent Management",
            description: "Distribute configurations and manage network traffic via agents",
            image: "agent.png",
            category: "Management"
        },
        {
            id: 13,
            title: "Config Info",
            description: "Protobuf-based configuration information viewer",
            image: "confinfo.png",
            category: "Configuration"
        },
        {
            id: 14,
            title: "Log Viewer",
            description: "Advanced log viewing and analysis capabilities",
            image: "logs.png",
            category: "Monitoring"
        },
        {
            id: 15,
            title: "Log Viewer 2",
            description: "Advanced log viewing and analysis capabilities",
            image: "logs2.png",
            category: "Monitoring"
        },
        {
            id: 16,
            title: "AI Assistant",
            description: "Get intelligent configuration help and troubleshooting with OpenRouter",
            image: "ai.png",
            category: "AI"
        },
        {
            id: 17,
            title: "Audit Trail",
            description: "Complete audit logging for compliance and security tracking",
            image: "audit.png",
            category: "Security"
        },
        {
            id: 18,
            title: "Background Jobs",
            description: "Monitor and manage all background processing tasks",
            image: "jobs.png",
            category: "Management"
        },
        {
            id: 19,
            title: "Service Registry",
            description: "Service discovery and registry management interface",
            image: "registry.png",
            category: "Discovery"
        },
        {
            id: 20,
            title: "Route Mapping",
            description: "Visual route configuration and traffic flow management",
            image: "routemap.png",
            category: "Configuration"
        },
        {
            id: 21,
            title: "Architecture Flow",
            description: "Visual diagram showing how Elchi works end-to-end",
            image: "flow.png",
            category: "Documentation"
        },
    ]

    const [selectedCategory, setSelectedCategory] = useState('All')
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [currentImageIndex, setCurrentImageIndex] = useState(0)

    const categories = ['All', ...Array.from(new Set(screenshots.map(s => s.category)))]

    const filteredScreenshots = selectedCategory === 'All'
        ? screenshots
        : screenshots.filter(s => s.category === selectedCategory)

    const openModal = (index: number) => {
        setCurrentImageIndex(index)
        setIsModalOpen(true)
    }

    const goToNext = () => {
        setCurrentImageIndex((prev) => (prev + 1) % filteredScreenshots.length)
    }

    const goToPrevious = () => {
        setCurrentImageIndex((prev) => (prev - 1 + filteredScreenshots.length) % filteredScreenshots.length)
    }

    // Keyboard navigation
    useEffect(() => {
        if (!isModalOpen) return

        const handleKeyDown = (e: KeyboardEvent) => {
            switch (e.key) {
                case 'Escape':
                    setIsModalOpen(false)
                    break
                case 'ArrowLeft':
                    goToPrevious()
                    break
                case 'ArrowRight':
                    goToNext()
                    break
            }
        }

        document.addEventListener('keydown', handleKeyDown)
        return () => document.removeEventListener('keydown', handleKeyDown)
    }, [isModalOpen, currentImageIndex, filteredScreenshots.length])

    return (
        <section id="screenshots" className="py-20 px-6 relative overflow-hidden">
            {/* Animated Background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl animate-pulse-slow"></div>
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
                <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
            </div>

            <div className="container mx-auto relative z-10">
                {/* Section Header */}
                <motion.div
                    className="text-center mb-12"
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    viewport={{ once: true }}
                >
                    <motion.h2
                        className="text-4xl lg:text-6xl font-bold mb-6"
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.6 }}
                        viewport={{ once: true }}
                    >
                        <span className="text-gradient">Platform Screenshots</span>
                    </motion.h2>
                    <motion.p
                        className="text-xl text-gray-300 max-w-3xl mx-auto"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        viewport={{ once: true }}
                    >
                        Explore Elchi's powerful interface designed for enterprise-grade proxy management
                    </motion.p>

                    {/* Category Pills */}
                    <motion.div
                        className="flex flex-wrap justify-center gap-2 mt-8"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                        viewport={{ once: true }}
                    >
                        {categories.map((category) => (
                            <motion.button
                                key={category}
                                onClick={() => setSelectedCategory(category)}
                                className={`px-5 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${selectedCategory === category
                                    ? 'bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-500 text-white shadow-lg shadow-blue-500/50 scale-105'
                                    : 'glass-effect text-gray-300 hover:bg-white/10 hover:scale-105'
                                    }`}
                                whileHover={{ y: -2 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                {category}
                            </motion.button>
                        ))}
                    </motion.div>
                </motion.div>

                {/* Bento Grid Layout */}
                <motion.div
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 auto-rows-[200px]"
                    layout
                >
                    <AnimatePresence mode="popLayout">
                        {filteredScreenshots.map((screenshot, index) => {
                            // Create varied sizes for bento grid effect
                            const isLarge = index % 7 === 0
                            const isMedium = index % 5 === 0 && !isLarge
                            const spanClass = isLarge
                                ? 'md:col-span-2 md:row-span-2'
                                : isMedium
                                    ? 'md:col-span-2'
                                    : 'md:col-span-1'

                            return (
                                <motion.div
                                    key={screenshot.id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.8, y: 20 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.8, y: 20 }}
                                    transition={{
                                        duration: 0.5,
                                        delay: index * 0.05,
                                        layout: { duration: 0.3 }
                                    }}
                                    className={`group relative ${spanClass}`}
                                >
                                    <div
                                        className="relative h-full overflow-hidden rounded-2xl bg-gradient-to-br from-gray-900/90 to-gray-800/90 backdrop-blur-sm border border-white/10 cursor-pointer"
                                        onClick={() => openModal(index)}
                                    >
                                        {/* Image */}
                                        <div className="absolute inset-0">
                                            <img
                                                src={screenshot.image}
                                                alt={screenshot.title}
                                                className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110 group-hover:brightness-75"
                                                loading="lazy"
                                            />
                                        </div>

                                        {/* Gradient Overlays */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-80 group-hover:opacity-95 transition-opacity duration-300"></div>
                                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                                        {/* Zoom Icon */}
                                        <motion.div
                                            className="absolute top-2 right-2 bg-black/40 backdrop-blur-md p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                                            whileHover={{ scale: 1.2, rotate: 90 }}
                                            transition={{ duration: 0.2 }}
                                        >
                                            <ZoomIn className="w-4 h-4 text-white" />
                                        </motion.div>

                                        {/* Category Badge */}
                                        <div className="absolute top-2 left-2">
                                            <motion.span
                                                className="inline-block px-3 py-1 bg-gradient-to-r from-blue-500/40 to-cyan-500/40 backdrop-blur-md rounded-full text-xs font-bold text-white border border-white/20"
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ duration: 0.4, delay: index * 0.05 }}
                                            >
                                                {screenshot.category}
                                            </motion.span>
                                        </div>

                                        {/* Content */}
                                        <div className="absolute bottom-0 left-0 right-0 p-4 transform transition-transform duration-300 group-hover:translate-y-0">
                                            <motion.div
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ duration: 0.4, delay: 0.1 }}
                                            >
                                                <h3 className="text-lg font-bold text-white mb-1 group-hover:text-cyan-400 transition-colors duration-300">
                                                    {screenshot.title}
                                                </h3>
                                                <p className="text-gray-300 text-xs leading-relaxed opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                                                    {screenshot.description}
                                                </p>
                                            </motion.div>
                                        </div>

                                        {/* Hover Effect Border */}
                                        <div className="absolute inset-0 rounded-2xl border-2 border-transparent group-hover:border-cyan-500/50 transition-all duration-300"></div>
                                    </div>
                                </motion.div>
                            )
                        })}
                    </AnimatePresence>
                </motion.div>
            </div>

            {/* Fullscreen Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <motion.div
                        className="fixed inset-0 z-[100] flex items-center justify-center"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        {/* Backdrop */}
                        <motion.div
                            className="absolute inset-0 bg-black/95 backdrop-blur-2xl"
                            onClick={() => setIsModalOpen(false)}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        />

                        {/* Navigation Arrows */}
                        <button
                            onClick={(e) => { e.stopPropagation(); goToPrevious(); }}
                            className="absolute left-8 top-1/2 -translate-y-1/2 z-20 bg-white/10 backdrop-blur-md p-4 rounded-full hover:bg-white/20 transition-all duration-300 group"
                        >
                            <ChevronLeft className="w-8 h-8 text-white group-hover:scale-110 transition-transform" />
                        </button>

                        <button
                            onClick={(e) => { e.stopPropagation(); goToNext(); }}
                            className="absolute right-8 top-1/2 -translate-y-1/2 z-20 bg-white/10 backdrop-blur-md p-4 rounded-full hover:bg-white/20 transition-all duration-300 group"
                        >
                            <ChevronRight className="w-8 h-8 text-white group-hover:scale-110 transition-transform" />
                        </button>

                        {/* Content */}
                        <motion.div
                            className="relative max-w-7xl max-h-[90vh] w-full mx-4 md:mx-8"
                            initial={{ scale: 0.8, y: 100 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.8, y: 100 }}
                            transition={{ duration: 0.4, type: "spring", bounce: 0.3 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Close Button */}
                            <motion.button
                                className="absolute -top-16 right-0 bg-white/10 backdrop-blur-md text-white p-4 rounded-full hover:bg-white/20 transition-all duration-300 z-10"
                                onClick={() => setIsModalOpen(false)}
                                whileHover={{ scale: 1.1, rotate: 90 }}
                                whileTap={{ scale: 0.9 }}
                            >
                                <X className="w-6 h-6" />
                            </motion.button>

                            {/* Image Container */}
                            <div className="relative bg-gray-900/60 backdrop-blur-xl rounded-3xl overflow-hidden shadow-2xl border border-white/10">
                                <img
                                    src={filteredScreenshots[currentImageIndex].image}
                                    alt={filteredScreenshots[currentImageIndex].title}
                                    className="w-full h-auto max-h-[70vh] object-contain"
                                    loading="lazy"
                                />

                                {/* Info Overlay */}
                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/80 to-transparent p-8">
                                    <span className="inline-block px-4 py-1.5 bg-gradient-to-r from-blue-500/50 to-cyan-500/50 backdrop-blur-md rounded-full text-sm font-bold mb-4 text-white">
                                        {filteredScreenshots[currentImageIndex].category}
                                    </span>
                                    <h3 className="text-3xl lg:text-4xl font-bold text-white mb-3">
                                        {filteredScreenshots[currentImageIndex].title}
                                    </h3>
                                    <p className="text-gray-300 text-lg">
                                        {filteredScreenshots[currentImageIndex].description}
                                    </p>
                                </div>
                            </div>

                            {/* Thumbnail Navigation */}
                            <div className="flex justify-center gap-2 mt-6 overflow-x-auto pb-2">
                                {filteredScreenshots.map((screenshot, idx) => (
                                    <motion.button
                                        key={screenshot.id}
                                        onClick={() => setCurrentImageIndex(idx)}
                                        className={`relative flex-shrink-0 w-20 h-14 rounded-lg overflow-hidden border-2 transition-all duration-300 ${idx === currentImageIndex
                                            ? 'border-cyan-500 scale-110 shadow-lg shadow-cyan-500/50'
                                            : 'border-white/20 hover:border-white/40 opacity-60 hover:opacity-100'
                                            }`}
                                        whileHover={{ scale: idx === currentImageIndex ? 1.1 : 1.05 }}
                                    >
                                        <img
                                            src={screenshot.image}
                                            alt={screenshot.title}
                                            className="w-full h-full object-cover"
                                        />
                                    </motion.button>
                                ))}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </section>
    )
}

export default ScreenshotGallery
