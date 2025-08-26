import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import DocsPage from './pages/DocsPage'

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/docs" element={<DocsPage />} />
            </Routes>
        </Router>
    )
}

export default App 