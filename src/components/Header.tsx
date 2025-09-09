import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Menu, X } from 'lucide-react'
import { Link } from 'react-router-dom'

const Header = () => {
    const [isScrolled, setIsScrolled] = useState(false)
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50)
        }
        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    const navItems = [
        { name: 'Home', href: '/', type: 'route' },
        { name: 'Screenshots', href: 'screenshots', type: 'scroll' },
        { name: 'Features', href: 'features', type: 'scroll' },
        { name: 'Architecture', href: 'architecture', type: 'scroll' },
        { name: 'Docs', href: '/docs', type: 'route' },
    ]
    
    const scrollToSection = (sectionId: string) => {
        // If we're not on the home page, navigate there first
        if (window.location.hash !== '#/') {
            window.location.href = '/#/'
            // Wait a bit for the page to load, then scroll
            setTimeout(() => {
                const element = document.getElementById(sectionId)
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth' })
                }
            }, 100)
        } else {
            // We're already on home page, just scroll
            const element = document.getElementById(sectionId)
            if (element) {
                element.scrollIntoView({ behavior: 'smooth' })
            }
        }
    }

    return (
        <motion.nav role="navigation" aria-label="Main navigation"
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'glass-effect shadow-xl' : 'bg-transparent'
                }`}
        >
            <div className="container mx-auto px-6 py-4">
                <div className="flex items-center justify-between">
                    {/* Logo */}
                    <motion.div
                        className="flex items-center space-x-3"
                        whileHover={{ scale: 1.05 }}
                    >
                        <div className="flex items-center justify-center p-1">
                            <img
                                src="logo.png"
                                alt="Elchi Logo"
                                className="w-26 h-20 object-contain"
                            />
                        </div>

                    </motion.div>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex items-center space-x-8">
                        {navItems.map((item) => (
                            item.type === 'route' ? (
                                <Link
                                    key={item.name}
                                    to={item.href}
                                    className="text-gray-300 hover:text-white transition-colors duration-300 font-medium"
                                >
                                    <motion.span
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        className="block"
                                    >
                                        {item.name}
                                    </motion.span>
                                </Link>
                            ) : item.type === 'scroll' ? (
                                <motion.button
                                    key={item.name}
                                    onClick={() => scrollToSection(item.href)}
                                    className="text-gray-300 hover:text-white transition-colors duration-300 font-medium"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    {item.name}
                                </motion.button>
                            ) : (
                                <motion.a
                                    key={item.name}
                                    href={`#${item.href}`}
                                    className="text-gray-300 hover:text-white transition-colors duration-300 font-medium"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    {item.name}
                                </motion.a>
                            )
                        ))}
                    </nav>

                    {/* CTA Button */}
                    <motion.button
                        className="hidden md:block btn-primary"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => window.open('https://demo.elchi.io', '_blank')}
                    >
                        Try Now
                    </motion.button>

                    {/* Mobile Menu Button */}
                    <button
                        className="md:hidden text-white"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    >
                        {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>

                {/* Mobile Menu */}
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="md:hidden mt-4 space-y-4"
                    >
                        {navItems.map((item) => (
                            item.type === 'route' ? (
                                <Link
                                    key={item.name}
                                    to={item.href}
                                    className="block text-gray-300 hover:text-white transition-colors duration-300 py-2"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    {item.name}
                                </Link>
                            ) : item.type === 'scroll' ? (
                                <button
                                    key={item.name}
                                    onClick={() => {
                                        scrollToSection(item.href)
                                        setIsMobileMenuOpen(false)
                                    }}
                                    className="block text-gray-300 hover:text-white transition-colors duration-300 py-2 text-left w-full"
                                >
                                    {item.name}
                                </button>
                            ) : (
                                <a
                                    key={item.name}
                                    href={`#${item.href}`}
                                    className="block text-gray-300 hover:text-white transition-colors duration-300 py-2"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    {item.name}
                                </a>
                            )
                        ))}
                        <motion.button
                            className="btn-primary w-full mt-4"
                            onClick={() => window.open('https://demo.elchi.io', '_blank')}
                        >
                            Try Now
                        </motion.button>
                    </motion.div>
                )}
            </div>
        </motion.nav>
    )
}

export default Header 