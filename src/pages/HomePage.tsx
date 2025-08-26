import Header from '../components/Header'
import Hero from '../components/Hero'
import ScreenshotGallery from '../components/ScreenshotGallery'
import Features from '../components/Features'
import Architecture from '../components/Architecture'
import CallToAction from '../components/CallToAction'
import Footer from '../components/Footer'

const HomePage = () => {
    return (
        <div className="min-h-screen gradient-bg text-white overflow-hidden">
            <Header />
            <main>
                <Hero />
                <ScreenshotGallery />
                <Features />
                <Architecture />
                <CallToAction />
            </main>
            <Footer />
        </div>
    )
}

export default HomePage