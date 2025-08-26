import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'

const ScreenshotGallery = () => {
    const screenshots = [
        {
            id: 1,
            title: "Service Management",
            description: "Manage your services and their configurations",
            image: "service.png",
            category: "Service"
        },
        {
            id: 2,
            title: "Filters",
            description: "Use most common filters to find your Envoy proxies",
            image: "filter.png",
            category: "Filter"
        },
        {
            id: 3,
            title: "Scenarios",
            description: "Wizard based configuration management",
            image: "scenario.png",
            category: "Scenario"
        },
        {
            id: 4,
            title: "Metric Dashboard",
            description: "View your metrics in a dashboard",
            image: "metric.png",
            category: "Metrics"
        },
        {
            id: 5,
            title: "Dependency Graph",
            description: "Get a visual representation of your dependencies",
            image: "dependency.png",
            category: "Dependency"
        },
        {
            id: 6,
            title: "Overview",
            description: "Overview of the platform.",
            image: "main.png",
            category: "Overview"
        },
        {
            id: 11,
            title: "xDS Configuration",
            description: "Easy configuration setup for your Envoy proxies",
            image: "configuration.png",
            category: "Configuration"
        },
        {
            id: 7,
            title: "Agent",
            description: "With agent you can distribute your configurations and manage network traffic",
            image: "agent.png",
            category: "Agent"
        },
        {
            id: 8,
            title: "Config Info",
            description: "Proto based configuration info",
            image: "confinfo.png",
            category: "Config Info"
        },
        {
            id: 9,
            title: "Logs",
            description: "View detailed logs.",
            image: "logs.png",
            category: "Logs"
        },
        {
            id: 12,
            title: "Working Diagram",
            description: "How Elchi works.",
            image: "flow.png",
            category: "Diagram"
        }
    ]

    const [currentIndex, setCurrentIndex] = useState(Math.floor(screenshots.length / 2))
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [modalImage, setModalImage] = useState<any>(null)



    const goToPrevious = () => {
        setCurrentIndex(currentIndex === 0 ? screenshots.length - 1 : currentIndex - 1)
    }

    const goToNext = () => {
        setCurrentIndex(currentIndex === screenshots.length - 1 ? 0 : currentIndex + 1)
    }

    const openModal = (screenshot: any) => {
        setModalImage(screenshot)
        setIsModalOpen(true)
    }

    // Keyboard navigation
    useEffect(() => {
        if (!isModalOpen) return

        const handleKeyDown = (e: KeyboardEvent) => {
            switch (e.key) {
                case 'Escape':
                    setIsModalOpen(false)
                    setModalImage(null)
                    break
                case 'ArrowLeft':
                    const prevIndex = currentIndex === 0 ? screenshots.length - 1 : currentIndex - 1
                    setCurrentIndex(prevIndex)
                    setModalImage(screenshots[prevIndex])
                    break
                case 'ArrowRight':
                    const nextIndex = currentIndex === screenshots.length - 1 ? 0 : currentIndex + 1
                    setCurrentIndex(nextIndex)
                    setModalImage(screenshots[nextIndex])
                    break
            }
        }

        document.addEventListener('keydown', handleKeyDown)
        return () => document.removeEventListener('keydown', handleKeyDown)
    }, [isModalOpen, currentIndex, screenshots])

    return (
        <section id="screenshots" className="py-24 px-6 relative overflow-hidden">
            <div className="container mx-auto">
                {/* Section Header */}
                <motion.div
                    className="text-center mb-0"
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    viewport={{ once: true }}
                >
                    <h2 className="text-4xl lg:text-6xl font-bold mb-6">
                        <span className="text-gradient">Platform Screenshots</span>
                    </h2>
                    <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                        Experience Elchi's intuitive interface designed for proxy management
                    </p>
                </motion.div>

                {/* 3D Perspective Gallery */}
                <div className="relative max-w-7xl mx-auto" style={{ perspective: '1000px' }}>
                    {/* Navigation Arrows */}
                    <motion.button
                        onClick={goToPrevious}
                        className="absolute left-8 top-1/2 z-30 glass-effect p-4 rounded-full hover:bg-white/20 hover:scale-110 transition-all duration-300 group"
                        style={{
                            transform: 'translateY(-50%)',
                            transformOrigin: 'center'
                        }}
                        aria-label="Previous screenshot"
                    >
                        <ChevronLeft className="w-8 h-8 text-white transition-transform duration-300" />
                    </motion.button>

                    <motion.button
                        onClick={goToNext}
                        className="absolute right-8 top-1/2 z-30 glass-effect p-4 rounded-full hover:bg-white/20 hover:scale-110 transition-all duration-300 group"
                        style={{
                            transform: 'translateY(-50%)',
                            transformOrigin: 'center'
                        }}
                        aria-label="Next screenshot"
                    >
                        <ChevronRight className="w-8 h-8 text-white transition-transform duration-300" />
                    </motion.button>

                    {/* 3D Carousel Container */}
                    <motion.div
                        className="relative h-[700px] flex items-center justify-center"
                        initial={{ opacity: 0, y: 50 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        viewport={{ once: true }}
                    >
                        {screenshots.map((screenshot, index) => {
                            const offset = index - currentIndex
                            const isActive = index === currentIndex

                            // Calculate position and scale based on offset
                            const getTransform = () => {
                                if (offset === 0) {
                                    // Center card
                                    return {
                                        x: 0,
                                        scale: 1,
                                        rotateY: 0,
                                        zIndex: 10,
                                        opacity: 1
                                    }
                                } else if (offset === 1) {
                                    // Right card
                                    return {
                                        x: 580,
                                        scale: 0.65,
                                        rotateY: -25,
                                        zIndex: 5,
                                        opacity: 0.7
                                    }
                                } else if (offset === -1) {
                                    // Left card
                                    return {
                                        x: -580,
                                        scale: 0.65,
                                        rotateY: 25,
                                        zIndex: 5,
                                        opacity: 0.7
                                    }
                                } else if (offset === 2) {
                                    // Far right card
                                    return {
                                        x: 850,
                                        scale: 0.45,
                                        rotateY: -35,
                                        zIndex: 2,
                                        opacity: 0.4
                                    }
                                } else if (offset === -2) {
                                    // Far left card
                                    return {
                                        x: -850,
                                        scale: 0.45,
                                        rotateY: 35,
                                        zIndex: 2,
                                        opacity: 0.4
                                    }
                                } else {
                                    // Hidden cards
                                    return {
                                        x: offset > 0 ? 1050 : -1050,
                                        scale: 0.3,
                                        rotateY: offset > 0 ? -45 : 45,
                                        zIndex: 1,
                                        opacity: 0
                                    }
                                }
                            }

                            const transform = getTransform()

                            return (
                                <motion.div
                                    key={screenshot.id}
                                    className="absolute cursor-pointer"
                                    style={{
                                        transformStyle: 'preserve-3d',
                                        zIndex: transform.zIndex
                                    }}
                                    animate={{
                                        x: transform.x,
                                        scale: transform.scale,
                                        rotateY: transform.rotateY,
                                        opacity: transform.opacity
                                    }}
                                    transition={{
                                        duration: 0.6,
                                        type: "spring",
                                        stiffness: 100,
                                        damping: 15
                                    }}
                                    whileHover={!isActive ? {
                                        scale: transform.scale * 1.05,
                                        rotateY: transform.rotateY * 0.7
                                    } : {}}
                                    onClick={() => {
                                        if (isActive) {
                                            openModal(screenshot)
                                        } else {
                                            setCurrentIndex(index)
                                        }
                                    }}
                                >
                                    <div className={`
                                        relative w-[640px] h-[450px] rounded-2xl overflow-hidden shadow-2xl transition-all duration-500
                                        ${isActive
                                            ? 'ring-4 ring-blue-500/50 ring-offset-8 ring-offset-transparent shadow-blue-500/30'
                                            : 'shadow-black/40 hover:shadow-black/60'
                                        }
                                    `}>
                                        {/* Screenshot Image */}
                                        <img
                                            src={screenshot.image}
                                            alt={screenshot.title}
                                            className={`w-full h-full object-contain transition-all duration-500 ${!isActive ? 'filter blur-sm' : ''
                                                }`}
                                            loading="lazy"
                                        />

                                        {/* Gradient Overlay */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>

                                        {/* Content */}
                                        <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                                            <motion.div
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: isActive ? 1 : 0.8, y: 0 }}
                                                transition={{ duration: 0.4 }}
                                            >
                                                <span className="inline-block px-3 py-1 bg-blue-500/30 backdrop-blur-sm rounded-full text-xs font-medium mb-3">
                                                    {screenshot.category}
                                                </span>
                                                <h3 className={`font-bold mb-2 transition-all duration-300 ${isActive ? 'text-xl text-blue-300' : 'text-lg text-white'
                                                    }`}>
                                                    {screenshot.title}
                                                </h3>
                                                {isActive && (
                                                    <motion.p
                                                        className="text-gray-300 text-sm"
                                                        initial={{ opacity: 0, height: 0 }}
                                                        animate={{ opacity: 1, height: 'auto' }}
                                                        transition={{ duration: 0.3, delay: 0.2 }}
                                                    >
                                                        {screenshot.description}
                                                    </motion.p>
                                                )}
                                            </motion.div>
                                        </div>

                                        {/* Active Glow Effect */}
                                        {isActive && (
                                            <motion.div
                                                className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 pointer-events-none"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                transition={{ duration: 0.4 }}
                                            />
                                        )}
                                    </div>
                                </motion.div>
                            )
                        })}
                    </motion.div>
                </div>
            </div>

            {/* Background Effects */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl animate-pulse-slow"></div>
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl animate-pulse-slow delay-1000"></div>
            </div>

            {/* Modal */}
            {isModalOpen && modalImage && (
                <div className="fixed inset-0 z-[100]">
                    {/* Blurred Background */}
                    <div
                        className="absolute inset-0 bg-black/80 backdrop-blur-lg cursor-pointer"
                        onClick={() => {
                            setIsModalOpen(false)
                            setModalImage(null)
                        }}
                    />

                    {/* Modal Content Container */}
                    <div className="relative h-full flex items-center justify-center p-4">
                        {/* Navigation Arrows */}
                        <button
                            onClick={() => {
                                const prevIndex = currentIndex === 0 ? screenshots.length - 1 : currentIndex - 1
                                setCurrentIndex(prevIndex)
                                setModalImage(screenshots[prevIndex])
                            }}
                            className="absolute left-8 top-1/2 z-30 bg-black/50 backdrop-blur-sm p-4 rounded-full hover:bg-black/70 transition-all duration-300 hover:scale-110"
                            style={{ transform: 'translateY(-50%)' }}
                        >
                            <ChevronLeft className="w-8 h-8 text-white" />
                        </button>

                        <button
                            onClick={() => {
                                const nextIndex = currentIndex === screenshots.length - 1 ? 0 : currentIndex + 1
                                setCurrentIndex(nextIndex)
                                setModalImage(screenshots[nextIndex])
                            }}
                            className="absolute right-8 top-1/2 z-30 bg-black/50 backdrop-blur-sm p-4 rounded-full hover:bg-black/70 transition-all duration-300 hover:scale-110"
                            style={{ transform: 'translateY(-50%)' }}
                        >
                            <ChevronRight className="w-8 h-8 text-white" />
                        </button>

                        {/* Modal Content */}
                        <div
                            className="relative max-w-6xl max-h-[90vh] w-full z-20"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Close Button */}
                            <button
                                className="absolute top-4 right-4 z-10 bg-black/50 backdrop-blur-sm text-white p-3 rounded-full hover:bg-black/70 transition-all duration-300 hover:scale-110"
                                onClick={() => {
                                    setIsModalOpen(false)
                                    setModalImage(null)
                                }}
                            >
                                <X className="w-6 h-6" />
                            </button>

                            {/* Image Container */}
                            <div className="relative bg-gray-900/50 backdrop-blur-sm rounded-2xl overflow-hidden shadow-2xl">
                                <img
                                    src={modalImage.image}
                                    alt={modalImage.title}
                                    className="w-full h-auto max-h-[80vh] object-contain"
                                    loading="lazy"
                                />

                                {/* Image Info */}
                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
                                    <span className="inline-block px-3 py-1 bg-blue-500/30 backdrop-blur-sm rounded-full text-xs font-medium mb-2 text-white">
                                        {modalImage.category}
                                    </span>
                                    <h3 className="text-2xl font-bold text-white mb-2">
                                        {modalImage.title}
                                    </h3>
                                    <p className="text-gray-300">
                                        {modalImage.description}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </section>
    )
}

export default ScreenshotGallery 