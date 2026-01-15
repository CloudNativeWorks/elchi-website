import Header from '../components/Header'
import ArchitectureDeepDive from '../components/ArchitectureDeepDive'
import ArchitectureNew from '../components/ArchitectureNew'
import Footer from '../components/Footer'
import { Helmet } from 'react-helmet-async'

const ArchitecturePage = () => {
    return (
        <div className="min-h-screen gradient-bg text-white overflow-hidden">
            <Helmet>
                <title>Architecture - Elchi 3-Process Distributed Architecture</title>
                <meta name="description" content="Learn about Elchi's scalable 3-process distributed architecture: Registry, Controller, and Control-Plane components for enterprise proxy management." />
                <link rel="canonical" href="https://elchi.io/architecture" />
            </Helmet>
            <Header />
            <main className="pt-24">
                <ArchitectureDeepDive />
                <ArchitectureNew />
            </main>
            <Footer />
        </div>
    )
}

export default ArchitecturePage
