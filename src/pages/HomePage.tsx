import Header from '../components/Header'
import Hero from '../components/Hero'
import ScreenshotGallery from '../components/ScreenshotGallery'
import WhyElchi from '../components/WhyElchi'
import Features from '../components/Features'
import AdvancedFeatures from '../components/AdvancedFeatures'
import ComprehensiveFeatures from '../components/ComprehensiveFeatures'
import SecurityFeatures from '../components/SecurityFeatures'
import ArchitectureDeepDive from '../components/ArchitectureDeepDive'
import ArchitectureNew from '../components/ArchitectureNew'
import UseCases from '../components/UseCases'
import CallToAction from '../components/CallToAction'
import Footer from '../components/Footer'

const HomePage = () => {
    return (
        <div className="min-h-screen gradient-bg text-white overflow-hidden">
            <Header />
            <main>
                <Hero />
                <ScreenshotGallery />
                <WhyElchi />
                <Features />
                <AdvancedFeatures />
                <ComprehensiveFeatures />
                <SecurityFeatures />
                <ArchitectureDeepDive />
                <ArchitectureNew />
                <UseCases />
                <CallToAction />
            </main>
            <Footer />
        </div>
    )
}

export default HomePage