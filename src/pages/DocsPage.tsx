import { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Download, CheckCircle, Monitor, Settings } from 'lucide-react'
import { Link } from 'react-router-dom'

const DocsPage = () => {
    const [activeSection, setActiveSection] = useState('client')

    const sections = [
        {
            id: 'client',
            title: 'Client',
            subsections: [
                { id: 'getting-started', title: 'Getting Started' },
                { id: 'installation', title: 'Installation' },
                { id: 'configuration', title: 'Configuration' },
                { id: 'supported-os', title: 'Supported OS' }
            ]
        }
    ]

    const renderContent = () => {
        switch (activeSection) {
            case 'client':
                return (
                    <div className="space-y-8">
                        <div>
                            <h1 className="text-4xl font-bold text-white mb-4">Elchi Client</h1>
                            <p className="text-xl text-gray-300 leading-relaxed">
                                You can download and run the client to start managing your Envoy Proxy configurations with ease.
                            </p>
                        </div>

                        <div id="installation" className="space-y-6">
                            <h2 className="text-2xl font-semibold text-white flex items-center">
                                <Download className="w-6 h-6 mr-2 text-blue-400" />
                                Download and Install
                            </h2>
                            
                            <div className="glass-effect p-6 rounded-xl">
                                <h3 className="text-lg font-medium text-white mb-4">Bootstrap Installation</h3>
                                <div className="bg-gray-900/50 rounded-lg p-4 font-mono text-sm">
                                    <div className="text-gray-400 mb-2"># Install using bootstrap script</div>
                                    <div className="text-green-400">curl -sSL https://github.com/CloudNativeWorks/elchi-client/releases/download/v1.0.0/elchi-install.sh | sudo bash</div>
                                    <div className="text-gray-400 mb-2 mt-2"># With BGP enabled</div>
                                    <div className="text-green-400">curl -sSL https://github.com/CloudNativeWorks/elchi-client/releases/download/v1.0.0/elchi-install.sh | sudo bash -s -- --enable-bgp</div>
                                </div>
                            </div>
                        </div>

                        <div id="configuration" className="space-y-6">
                            <h2 className="text-2xl font-semibold text-white flex items-center">
                                <Settings className="w-6 h-6 mr-2 text-purple-400" />
                                Configuration
                            </h2>
                            
                            <div className="glass-effect p-6 rounded-xl">
                                <h3 className="text-lg font-medium text-white mb-4">Post-Installation Setup</h3>
                                <p className="text-gray-300 mb-4">
                                    After installation, you need to configure the client to connect to your Elchi server.
                                </p>
                                
                                <div className="space-y-4">
                                    <div>
                                        <h4 className="text-white font-medium mb-2">1. Edit Configuration File</h4>
                                        <p className="text-gray-400 text-sm mb-2">Open the configuration file located at:</p>
                                        <div className="bg-gray-900/50 rounded-lg p-3 font-mono text-sm">
                                            <div className="text-yellow-400">/etc/elchi/config.yaml</div>
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="text-white font-medium mb-2">2. Update Server & Client Configuration</h4>
                                        <p className="text-gray-400 text-sm mb-2">Fill in the following server details:</p>
                                        <div className="bg-gray-900/50 rounded-lg p-4 font-mono text-sm">
                                            <div className="text-blue-400">server:</div>
                                            <div className="text-gray-300 ml-2">host: <span className="text-green-400">""</span> <span className="text-gray-500"># Main server address</span></div>
                                            <div className="text-gray-300 ml-2">port: <span className="text-yellow-400">80</span> <span className="text-gray-500"># Main server port</span></div>
                                            <div className="text-gray-300 ml-2">tls: <span className="text-orange-400">false</span> <span className="text-gray-500"># Set to true if you are using TLS on main server</span></div>
                                            <div className="text-gray-300 ml-2">token: <span className="text-green-400">"xxxx-xxxx-xxxx-xxxx"</span> <span className="text-gray-500"># Get from Elchi</span></div>
                                            <div className="text-blue-400">client:</div>
                                            <div className="text-gray-300 ml-2">name: <span className="text-green-400">""</span> <span className="text-gray-500"># Set to the name of the machine</span></div>
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="text-white font-medium mb-2">3. Restart the Service</h4>
                                        <p className="text-gray-400 text-sm mb-2">After updating the configuration, restart the client service:</p>
                                        <div className="bg-gray-900/50 rounded-lg p-3 font-mono text-sm">
                                            <div className="text-green-400">systemctl restart elchi-client.service</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                                <div className="flex items-start space-x-3">
                                    <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center mt-0.5">
                                        <span className="text-white text-xs font-bold">i</span>
                                    </div>
                                    <div>
                                        <h4 className="text-blue-400 font-medium mb-1">Configuration Tips</h4>
                                        <ul className="text-blue-200 text-sm space-y-1">
                                            <li>• Make sure the server address is reachable from your client machine</li>
                                            <li>• Enable TLS if your server uses HTTPS</li>
                                            <li>• Get Token from Elchi UI Settings page</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div id="supported-os" className="space-y-6">
                            <h2 className="text-2xl font-semibold text-white flex items-center">
                                <Monitor className="w-6 h-6 mr-2 text-green-400" />
                                Supported Operating Systems
                            </h2>
                            
                            <div className="glass-effect p-6 rounded-xl">
                                <div className="flex items-center space-x-3 mb-4">
                                    <CheckCircle className="w-5 h-5 text-green-400" />
                                    <span className="text-white font-medium">Linux</span>
                                </div>
                                <div className="pl-8">
                                    <div className="flex items-center space-x-2 text-gray-300">
                                        <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                                        <span>Ubuntu 24.04 (minimum required)</span>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                )
            default:
                return <div>Section not found</div>
        }
    }

    return (
        <div className="min-h-screen gradient-bg">
            {/* Header */}
            <div className="sticky top-0 z-50 glass-effect border-b border-white/10">
                <div className="container mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <Link 
                            to="/" 
                            className="flex items-center space-x-3 text-white hover:text-blue-400 transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                            <span className="font-medium">Back to Main Site</span>
                        </Link>
                        <div className="flex items-center space-x-3">
                            <img
                                src="/logo.png"
                                alt="Elchi Logo"
                                className="w-20 h-16 object-contain"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex">
                {/* Sidebar */}
                <div className="w-64 min-h-screen glass-effect border-r border-white/10 mt-1">
                    <div className="p-6">
                        <h2 className="text-xl font-bold text-white mb-6">Documentation</h2>
                        
                        <nav className="space-y-2">
                            {sections.map((section) => (
                                <div key={section.id}>
                                    <button
                                        onClick={() => setActiveSection(section.id)}
                                        className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                                            activeSection === section.id
                                                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                                : 'text-gray-300 hover:text-white hover:bg-white/5'
                                        }`}
                                    >
                                        {section.title}
                                    </button>
                                    
                                    {activeSection === section.id && section.subsections && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            className="ml-4 mt-2 space-y-1"
                                        >
                                            {section.subsections.map((subsection) => (
                                                <a
                                                    key={subsection.id}
                                                    href={`#${subsection.id}`}
                                                    className="block px-3 py-1 text-sm text-gray-400 hover:text-white transition-colors"
                                                >
                                                    {subsection.title}
                                                </a>
                                            ))}
                                        </motion.div>
                                    )}
                                </div>
                            ))}
                        </nav>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1">
                    <div className="container mx-auto px-8 py-8 max-w-4xl">
                        <motion.div
                            key={activeSection}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                        >
                            {renderContent()}
                        </motion.div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default DocsPage