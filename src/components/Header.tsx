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
        { name: 'Screenshots', href: '/screenshots', type: 'route' },
        { name: 'Features', href: '/features', type: 'route' },
        { name: 'Architecture', href: '/architecture', type: 'route' },
        { name: 'Docs', href: '/docs', type: 'route' },
    ]

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
                            <Link
                                key={item.name}
                                to={item.href}
                                className="block text-gray-300 hover:text-white transition-colors duration-300 py-2"
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                {item.name}
                            </Link>
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