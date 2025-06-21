# 🚀 Arxiv Research Pilot

**An all-in-one research paper explorer, presenter, and AI assistant for researchers**

[![Node.js](https://img.shields.io/badge/Node.js-14+-green.svg)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/Platform-Web%20%7C%20Mobile%20%7C%20Desktop-lightgrey.svg)](https://github.com/yourusername/arxiv-research-pilot)

## 🌟 Features

### 📚 **Research Paper Read Mode**
- Fetch latest papers from arXiv by category
- Full paper content extraction and display
- PDF opens in new tab for easy reference
- Responsive design for all devices

### 🎓 **Classroom Mode**
- Convert papers into lecture format
- Text-to-speech with male voice
- Section-by-section presentation
- Interactive learning experience

### 📥 **Download/Extract Mode**
- Download papers in multiple formats
- Extract key sections and summaries
- Generate research notes
- Share content easily

### 🧠 **Deep Research Pilot Mode**
- AI-powered research assistant
- Interactive chat interface
- Research file management
- Advanced analysis tools

## 🚀 Quick Start

### Prerequisites
- Node.js 14+ ([Download](https://nodejs.org/))
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/arxiv-research-pilot.git
   cd arxiv-research-pilot
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the server**
   ```bash
   npm start
   ```

4. **Open in browser**
   ```
   http://localhost:3000
   ```

## 📱 Mobile & Cross-Platform Support

### 🌐 Web Browser
- **Chrome/Edge**: Full functionality
- **Firefox**: Full functionality  
- **Safari**: Full functionality
- **Mobile browsers**: Responsive design

### 📱 Mobile Apps
- **iPhone Safari**: Add to home screen for app-like experience
- **Android Chrome**: Progressive Web App (PWA) support
- **Tablets**: Optimized layout for larger screens

### 💻 Desktop
- **Windows**: Works in all browsers
- **macOS**: Native app experience
- **Linux**: Full compatibility

## 🛠️ Usage Guide

### 1. **Search Papers**
- Select a category (AI, Computer Vision, etc.)
- Set date range (optional)
- Click "Search" to fetch latest papers

### 2. **Select a Paper**
- Click on any paper card
- PDF opens automatically in new tab
- Paper content is processed on server

### 3. **Choose Your Mode**

#### 📚 Research Paper Read Mode
- View full paper content
- Navigate through sections
- Read abstracts and summaries

#### 🎓 Classroom Mode
- Listen to paper as lecture
- Follow along with text
- Use stop/play controls

#### 📥 Download/Extract Mode
- Download paper content
- Extract key sections
- Generate research notes

#### 🧠 Deep Research Pilot Mode
- Chat with AI assistant
- Manage research files
- Get insights and analysis

## 🌐 Deployment Options

### Heroku (Recommended)
```bash
# Install Heroku CLI
npm install -g heroku

# Login to Heroku
heroku login

# Create app
heroku create your-app-name

# Deploy
git push heroku main

# Open app
heroku open
```

### Railway
```bash
# Connect to Railway
railway login
railway init
railway up
```

### Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### DigitalOcean App Platform
- Connect GitHub repository
- Auto-deploy on push
- SSL certificate included

### AWS/Google Cloud
- Deploy to EC2/Compute Engine
- Use load balancer for scaling
- Set up custom domain

## 🔧 Configuration

### Environment Variables
```bash
# Server port (default: 3000)
PORT=3000

# Node environment
NODE_ENV=production

# CORS origins (for production)
CORS_ORIGIN=https://yourdomain.com
```

### Custom Categories
Edit `server.js` to add more arXiv categories:
```javascript
const categories = [
  'cs.AI', 'cs.CV', 'cs.LG', 'cs.CL', 
  'cs.NE', 'cs.SE', 'cs.DC', 'cs.AR'
];
```

## 📊 API Endpoints

### Get Papers
```
GET /api/papers?category=cs.AI&startDate=20250501&endDate=20250601
```

### Extract Content
```
POST /api/extract-enhanced
Body: { "paper": {...} }
```

### Generate Audio
```
POST /api/generate-audio
Body: { "paper": {...}, "type": "classroom" }
```

### Classroom Mode
```
GET /api/classroom/:paperId
```

## 🎨 Customization

### Themes
Edit `style.css` to customize colors and layout:
```css
:root {
  --primary-color: #667eea;
  --secondary-color: #764ba2;
  --background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
```

### Features
- Add new research categories
- Customize audio voices
- Integrate with other APIs
- Add user authentication

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [arXiv API](https://arxiv.org/help/api) for paper data
- [Font Awesome](https://fontawesome.com/) for icons
- [Inter Font](https://rsms.me/inter/) for typography
- [Express.js](https://expressjs.com/) for the server framework

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/arxiv-research-pilot/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/arxiv-research-pilot/discussions)
- **Email**: your.email@example.com

## 🔄 Updates

Stay updated with the latest features:
```bash
git pull origin main
npm install
npm start
```

---

**Made with ❤️ for the research community**

*Share this project with fellow researchers!* 