# 🚀 Deployment Guide

This guide will help you deploy Arxiv Research Pilot to various platforms so researchers can access it from any device.

## 🌐 Quick Deploy Options

### 1. **Heroku (Recommended - Free)**
```bash
# Install Heroku CLI
npm install -g heroku

# Login to Heroku
heroku login

# Create new app
heroku create your-app-name

# Deploy
git push heroku main

# Open app
heroku open
```

### 2. **Railway (Free Tier)**
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize project
railway init

# Deploy
railway up
```

### 3. **Vercel (Free)**
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Follow prompts
```

### 4. **Netlify (Free)**
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
netlify deploy --prod
```

## 📱 Mobile App Deployment

### Progressive Web App (PWA)
The app is already configured as a PWA. Users can:
- **iPhone**: Add to home screen via Safari
- **Android**: Install via Chrome
- **Desktop**: Install via browser

### Native App Wrappers
```bash
# Using Capacitor
npm install @capacitor/core @capacitor/cli
npx cap init
npx cap add android
npx cap add ios

# Build and run
npx cap build
npx cap run android
npx cap run ios
```

## 🔧 Environment Setup

### Required Environment Variables
```bash
# Production
NODE_ENV=production
PORT=3000

# Optional
CORS_ORIGIN=https://yourdomain.com
ARXIV_API_URL=http://export.arxiv.org/api/query
```

### Platform-Specific Config

#### Heroku
```bash
# Set environment variables
heroku config:set NODE_ENV=production

# Add buildpack if needed
heroku buildpacks:set heroku/nodejs
```

#### Railway
```bash
# Set in Railway dashboard
NODE_ENV=production
PORT=3000
```

#### Vercel
```bash
# Create vercel.json
{
  "version": 2,
  "builds": [
    {
      "src": "server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/server.js"
    }
  ]
}
```

## 📊 Performance Optimization

### 1. **Enable Compression**
```javascript
// Add to server.js
const compression = require('compression');
app.use(compression());
```

### 2. **Cache Headers**
```javascript
// Add to server.js
app.use(express.static(path.join(__dirname), {
  maxAge: '1d',
  etag: true
}));
```

### 3. **CDN Setup**
- Use Cloudflare for static assets
- Enable gzip compression
- Set cache headers

## 🔒 Security Considerations

### 1. **HTTPS Only**
```javascript
// Force HTTPS in production
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.header('x-forwarded-proto') !== 'https') {
      res.redirect(`https://${req.header('host')}${req.url}`);
    } else {
      next();
    }
  });
}
```

### 2. **CORS Configuration**
```javascript
// Configure CORS for production
const corsOptions = {
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
};
app.use(cors(corsOptions));
```

### 3. **Rate Limiting**
```bash
npm install express-rate-limit
```

```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);
```

## 📈 Monitoring & Analytics

### 1. **Health Check Endpoint**
```javascript
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});
```

### 2. **Error Tracking**
```bash
npm install sentry
```

### 3. **Performance Monitoring**
- Use New Relic or DataDog
- Monitor response times
- Track API usage

## 🚀 Scaling Considerations

### 1. **Load Balancing**
- Use multiple instances
- Set up auto-scaling
- Use Redis for session storage

### 2. **Database (Future)**
```bash
# Add MongoDB for user data
npm install mongoose

# Add PostgreSQL for complex queries
npm install pg
```

### 3. **File Storage**
- Use AWS S3 for file uploads
- Implement CDN for static assets
- Cache frequently accessed papers

## 📱 Mobile-Specific Optimizations

### 1. **Touch Interactions**
- Large touch targets (44px minimum)
- Swipe gestures for navigation
- Pull-to-refresh functionality

### 2. **Offline Support**
- Service worker caching
- Offline-first architecture
- Background sync for updates

### 3. **Performance**
- Lazy loading of images
- Minimal JavaScript bundle
- Optimized fonts and icons

## 🔄 Continuous Deployment

### GitHub Actions
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    - uses: actions/setup-node@v2
      with:
        node-version: '16'
    - run: npm install
    - run: npm test
    - run: npm run deploy
```

## 📞 Support & Maintenance

### 1. **Logging**
```javascript
// Add structured logging
const winston = require('winston');
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});
```

### 2. **Backup Strategy**
- Regular database backups
- Version control for all changes
- Disaster recovery plan

### 3. **Update Process**
```bash
# Automated updates
git pull origin main
npm install
npm run build
pm2 restart all
```

## 🎯 Success Metrics

### 1. **Performance**
- Page load time < 3 seconds
- API response time < 500ms
- 99.9% uptime

### 2. **User Engagement**
- Daily active users
- Session duration
- Feature usage analytics

### 3. **Technical**
- Error rate < 1%
- Cache hit ratio > 80%
- Mobile vs desktop usage

---

**Ready to deploy? Choose your platform and follow the steps above!** 🚀 