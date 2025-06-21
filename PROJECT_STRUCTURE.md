# Project Structure

```
arxiv-fetcher/
├── 📁 .vscode/                    # VS Code configuration
│   └── launch.json               # Debugging configuration
├── 📁 scripts/                   # Utility scripts
│   └── setup.sh                  # Project setup script
├── 📁 node_modules/              # Dependencies (gitignored)
├── 📄 .gitignore                 # Git ignore rules
├── 📄 config.js                  # Application configuration
├── 📄 index.html                 # Main HTML file
├── 📄 package.json               # Project metadata & dependencies
├── 📄 package-lock.json          # Dependency lock file
├── 📄 README.md                  # Project documentation
├── 📄 server.js                  # Express server (backend)
├── 📄 script.js                  # Frontend JavaScript
├── 📄 style.css                  # CSS styling
└── 📄 PROJECT_STRUCTURE.md       # This file
```

## File Descriptions

### Core Application Files
- **`server.js`** - Express.js server with API endpoints
- **`script.js`** - Frontend JavaScript with modular architecture
- **`config.js`** - Centralized configuration settings
- **`index.html`** - Main HTML interface
- **`style.css`** - Application styling

### Configuration Files
- **`package.json`** - Project metadata, dependencies, and scripts
- **`.gitignore`** - Git ignore rules for clean repository
- **`.vscode/launch.json`** - VS Code debugging configuration

### Documentation
- **`README.md`** - Comprehensive project documentation
- **`PROJECT_STRUCTURE.md`** - This file

### Scripts
- **`scripts/setup.sh`** - Automated project setup script

## Architecture Overview

### Backend (server.js)
- Express.js REST API
- arXiv API integration
- Error handling & validation
- Health check endpoint

### Frontend (script.js)
- Modular JavaScript architecture
- API abstraction layer
- UI component management
- Error handling & user feedback

### Configuration (config.js)
- Centralized settings
- Category definitions
- Error messages
- API configuration

## Development Workflow

1. **Setup**: Run `./scripts/setup.sh`
2. **Development**: Press `F5` in VS Code or run `npm start`
3. **Testing**: Open `http://localhost:3000` in browser
4. **Debugging**: Use VS Code debugger with breakpoints 