import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import HomePage from './pages/HomePage'
import DocsPage from './pages/DocsPage'
import FeaturesPage from './pages/FeaturesPage'
import ScreenshotsPage from './pages/ScreenshotsPage'
import ArchitecturePage from './pages/ArchitecturePage'

function ScrollToTop() {
    const { pathname } = useLocation()

    useEffect(() => {
        window.scrollTo(0, 0)
    }, [pathname])

    return null
}

function AppContent() {
    const location = useLocation()

    useEffect(() => {
        // Handle anchor scrolling for hash fragments in URL
        if (location.hash) {
            const elementId = location.hash.substring(1)
            setTimeout(() => {
                const element = document.getElementById(elementId)
                if (element) {
                    const headerHeight = 120
                    const elementPosition = element.offsetTop - headerHeight
                    window.scrollTo({
                        top: elementPosition,
                        behavior: 'smooth'
                    })
                }
            }, 100)
        }
    }, [location])

    return (
        <>
            <ScrollToTop />
            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/docs" element={<DocsPage />} />
                <Route path="/features" element={<FeaturesPage />} />
                <Route path="/screenshots" element={<ScreenshotsPage />} />
                <Route path="/architecture" element={<ArchitecturePage />} />
            </Routes>
        </>
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