# Elchi Website

Modern React TypeScript website for Elchi. Landing site for the Envoy Control Plane with UI tool.

## 🚀 Features

- ⚡ Modern React TypeScript project
- 🎨 Responsive design with Tailwind CSS
- 🔄 Framer Motion animations
- 🌙 Dark theme design
- 📱 Mobile-first approach
- ✨ Glass effect and gradient designs
- 🎯 SEO optimized

## 🛠️ Technologies

- **React 18** - Modern UI library
- **TypeScript** - Type-safe JavaScript
- **Vite** - Fast build tool
- **Tailwind CSS** - Utility-first CSS framework
- **Framer Motion** - Animation library
- **Lucide React** - Modern icons

## 📦 Installation

### Requirements

- Node.js 18+ 
- npm or yarn

### Steps

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start development server:**
   ```bash
   npm run dev
   ```

3. **Open in browser:**
   ```
   http://localhost:5173
   ```

## 📁 Project Structure

```
src/
├── components/          # React components
│   ├── Header.tsx      # Navigation bar
│   ├── Hero.tsx        # Homepage hero section
│   ├── Features.tsx    # Features section
│   ├── Architecture.tsx # Architecture section
│   ├── CallToAction.tsx # CTA section
│   └── Footer.tsx      # Footer
├── App.tsx             # Main application component
├── main.tsx           # Entry point
└── index.css          # Global styles
```

## 🎨 Design System

### Colors
- **Primary:** #056ccd to #00c6fb gradient
- **Background:** Dark slate tones
- **Accent:** Blue-cyan gradients throughout

### Animations
- Scroll-triggered animations
- Hover effects
- Page transitions
- Floating elements

### Responsive Breakpoints
- **Mobile:** < 768px
- **Tablet:** 768px - 1024px
- **Desktop:** > 1024px

## 🔧 Configuration

### Build
```bash
npm run build
```

### Linting
```bash
npm run lint
```

### Preview
```bash
npm run preview
```

## 🌐 Deployment

### Vercel (Recommended)
1. Push to GitHub
2. Import to Vercel
3. Auto deploy

### Netlify
1. `npm run build` 
2. Deploy `dist` folder

### Custom Server
1. `npm run build`
2. Upload `dist` folder to your web server

## 📄 License

MIT License - See [LICENSE](LICENSE) file for details.

## 🤝 Contributing

1. Fork it
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit (`git commit -m 'Add amazing feature'`)
4. Push (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📞 Contact & Resources

- **Demo Platform**: [demo.elchi.io](https://demo.elchi.io) (24-hour access)
- **Helm Chart**: [Artifact Hub](https://artifacthub.io/packages/helm/elchi/elchi-platform)
- **Email**: info@elchi.io

---

**Note:** This project showcases [Elchi](https://demo.elchi.io) - a stack solution for Proxy management combining React TypeScript frontend with Go backend. The actual platform can be tried at [demo.elchi.io](https://demo.elchi.io) or deployed via [Helm chart](https://artifacthub.io/packages/helm/elchi/elchi-platform).

⚠️ **Experimental Project**: Currently in experimental stage. Use with caution in production environments. 