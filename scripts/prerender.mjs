import puppeteer from 'puppeteer';
import { createServer } from 'http';
import { readFileSync, writeFileSync, mkdirSync, existsSync, statSync } from 'fs';
import { join, extname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const distDir = join(__dirname, '..', 'dist');

const routes = [
    '/',
    '/features',
    '/screenshots',
    '/architecture',
    '/docs'
];

const MIME_TYPES = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.json': 'application/json',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.xml': 'application/xml',
    '.txt': 'text/plain',
    '.webp': 'image/webp',
};

function startServer(port, originalIndexHtml) {
    return new Promise((resolve) => {
        const server = createServer((req, res) => {
            const urlPath = req.url.split('?')[0];
            let filePath = join(distDir, urlPath);

            try {
                if (existsSync(filePath) && statSync(filePath).isFile()) {
                    const content = readFileSync(filePath);
                    const ext = extname(filePath);
                    res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
                    res.end(content);
                    return;
                }
            } catch { /* fallback to index.html */ }

            // SPA fallback - always serve the ORIGINAL index.html
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(originalIndexHtml);
        });

        server.listen(port, () => resolve(server));
    });
}

async function prerender() {
    console.log('🔄 Starting prerender...\n');

    if (!existsSync(distDir)) {
        console.error('❌ dist/ directory not found. Run "vite build" first.');
        process.exit(1);
    }

    // Save original index.html before any prerendering overwrites it
    const originalIndex = readFileSync(join(distDir, 'index.html'), 'utf-8');

    const port = 4567;
    const server = await startServer(port, originalIndex);
    console.log(`📡 Static server running on http://localhost:${port}\n`);

    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    for (const route of routes) {
        console.log(`  Prerendering: ${route}`);
        const page = await browser.newPage();

        await page.goto(`http://localhost:${port}${route}`, {
            waitUntil: 'networkidle0',
            timeout: 30000
        });

        // Wait for React to render content inside #root
        await page.waitForSelector('#root > *', { timeout: 10000 });

        // Small delay to ensure react-helmet-async updates head
        await new Promise(r => setTimeout(r, 500));

        // Get the full rendered HTML
        let html = await page.content();

        // Clean up duplicate tags: remove original static tags that
        // react-helmet-async has overridden (helmet tags have data-rh="true")
        // Remove original canonical if helmet provides a page-specific one
        if (html.includes('data-rh="true"')) {
            // Remove original canonical (without data-rh) if helmet canonical exists
            html = html.replace(/<link rel="canonical" href="[^"]*">\s*(?=[\s\S]*<link rel="canonical"[^>]*data-rh="true")/i, '');
            // Remove original meta description (without data-rh) if helmet one exists
            html = html.replace(/<meta name="description"\s+content="[^"]*"\s*\/?>\s*(?=[\s\S]*<meta name="description"[^>]*data-rh="true")/i, '');
            // Remove original title if helmet title exists
            html = html.replace(/<meta name="title" content="[^"]*"\s*\/?>\s*(?=[\s\S]*<title[^>]*data-rh="true")/i, '');
        }

        // Add a marker comment so we know this page was prerendered
        html = html.replace('<head>', '<head>\n    <!-- prerendered -->');

        // Determine output path
        if (route === '/') {
            writeFileSync(join(distDir, 'index.html'), html, 'utf-8');
            console.log(`    ✅ Saved: dist/index.html`);
        } else {
            const routeDir = join(distDir, route.slice(1));
            if (!existsSync(routeDir)) {
                mkdirSync(routeDir, { recursive: true });
            }
            writeFileSync(join(routeDir, 'index.html'), html, 'utf-8');
            console.log(`    ✅ Saved: dist/${route.slice(1)}/index.html`);
        }

        await page.close();
    }

    await browser.close();
    server.close();

    console.log(`\n✅ Prerendering complete! ${routes.length} pages generated.`);
}

prerender().catch((err) => {
    console.error('❌ Prerender failed:', err);
    process.exit(1);
});
