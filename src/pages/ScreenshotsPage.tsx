import Header from '../components/Header'
import ScreenshotGallery from '../components/ScreenshotGallery'
import Footer from '../components/Footer'
import { Helmet } from 'react-helmet-async'

const ScreenshotsPage = () => {
    return (
        <div className="min-h-screen gradient-bg text-white overflow-hidden">
            <Helmet>
                <title>Screenshots - Elchi Proxy Management Platform</title>
                <meta name="description" content="View Elchi's modern UI screenshots: service management, configuration editor, GSLB dashboard, metrics visualization, dependency graphs, and more." />
                <link rel="canonical" href="https://elchi.io/screenshots" />
            </Helmet>
            <Header />
            <main className="pt-24">
                <ScreenshotGallery />
            </main>
            <Footer />
        </div>
    )
}

export default ScreenshotsPage
