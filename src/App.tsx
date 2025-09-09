import { HashRouter as Router, Routes, Route, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import HomePage from './pages/HomePage'
import DocsPage from './pages/DocsPage'

function AppContent() {
    const location = useLocation()
    
    useEffect(() => {
        // Handle anchor scrolling for hash fragments in URL
        // Support both /#/docs#section and direct #section formats
        const fullHash = window.location.hash
        let elementId = ''
        
        // Check for nested hash like /#/docs#section
        if (fullHash.includes('#', 1)) {
            const lastHashIndex = fullHash.lastIndexOf('#')
            elementId = fullHash.substring(lastHashIndex + 1)
        } else if (location.hash) {
            // Regular location hash
            elementId = location.hash.substring(1)
        }
        
        if (elementId) {
            // Wait for the component to render
            setTimeout(() => {
                const element = document.getElementById(elementId)
                if (element) {
                    const headerHeight = 120
                    const elementPosition = element.offsetTop - headerHeight
                    window.scrollTo({
                        top: elementPosition,
                        behavior: 'smooth'
                    })
                    // Clean up the URL to remove the nested hash
                    if (fullHash.includes('#', 1)) {
                        const cleanHash = fullHash.substring(0, fullHash.lastIndexOf('#'))
                        window.history.replaceState(null, '', cleanHash)
                    }
                }
            }, 100)
        }
    }, [location])
    
    return (
        <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/docs" element={<DocsPage />} />
        </Routes>
    )
}

function App() {
    return (
        <Router>
            <AppContent />
        </Router>
    )
}

export default App 