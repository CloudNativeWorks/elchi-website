import Header from '../components/Header'
import Features from '../components/Features'
import AdvancedFeatures from '../components/AdvancedFeatures'
import ComprehensiveFeatures from '../components/ComprehensiveFeatures'
import Footer from '../components/Footer'
import { Helmet } from 'react-helmet-async'

const FeaturesPage = () => {
    return (
        <div className="min-h-screen gradient-bg text-white overflow-hidden">
            <Helmet>
                <title>Features - Elchi Proxy Management Platform</title>
                <meta name="description" content="Explore Elchi's powerful features: Proto-to-UI auto-generation, xDS protocol support, Kubernetes discovery, GSLB, ACME certificates, AI-powered analysis, and more." />
                <link rel="canonical" href="https://elchi.io/features" />
            </Helmet>
            <Header />
            <main className="pt-24">
                <Features />
                <AdvancedFeatures />
                <ComprehensiveFeatures />
            </main>
            <Footer />
        </div>
    )
}

export default FeaturesPage
