import { motion } from 'framer-motion'
import { Github, Twitter, Linkedin, Mail } from 'lucide-react'

const Footer = () => {
    const socialLinks = [
        { name: 'GitHub', icon: Github, href: 'https://github.com/orgs/CloudNativeWorks/repositories', color: 'hover:text-gray-300' },
        { name: 'Twitter', icon: Twitter, href: '#', color: 'hover:text-blue-400' },
        { name: 'LinkedIn', icon: Linkedin, href: '#', color: 'hover:text-blue-600' },
        { name: 'Email', icon: Mail, href: 'mailto:admin@cloudnativeworks.com', color: 'hover:text-green-400' },
    ]

    return (
        <footer className="relative py-20 px-6 border-white/10">
            <motion.div
                    className="flex flex-col md:flex-row items-center justify-between pt-8 border-t border-white/10"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ duration: 0.6 }}
                    viewport={{ once: true }}
                >
                    {/* Copyright */}
                    <div className="text-gray-400 text-sm mb-4 md:mb-0">
                        © 2025 Elchi. All rights reserved.
                    </div>

                    {/* Social Links */}
                    <div className="flex items-center space-x-6">
                        {socialLinks.map((social) => (
                            <motion.a
                                key={social.name}
                                href={social.href}
                                className={`text-gray-400 ${social.color} transition-colors duration-300`}
                                whileHover={{ scale: 1.2, y: -2 }}
                                whileTap={{ scale: 0.9 }}
                            >
                                <social.icon size={20} />
                            </motion.a>
                        ))}
                    </div>
                </motion.div>

            {/* Background Effects */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -bottom-32 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-32 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl"></div>
            </div>
        </footer>
    )
}

export default Footer 