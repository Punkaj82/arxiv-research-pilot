#!/bin/bash

# arXiv Fetcher Cleanup Script
echo "🧹 Cleaning up arXiv Fetcher project..."

# Stop any running server processes
echo "🛑 Stopping server processes..."
pkill -f "node server.js" 2>/dev/null || true

# Clear port 3000 if in use
echo "🔌 Clearing port 3000..."
lsof -ti:3000 | xargs kill -9 2>/dev/null || true

# Remove temporary files
echo "🗑️  Removing temporary files..."
find . -name "*.log" -delete 2>/dev/null || true
find . -name "*.tmp" -delete 2>/dev/null || true
find . -name ".DS_Store" -delete 2>/dev/null || true
find . -name "Thumbs.db" -delete 2>/dev/null || true

# Clean npm cache
echo "🧽 Cleaning npm cache..."
npm cache clean --force

# Remove node_modules and reinstall (optional)
if [ "$1" = "--full" ]; then
    echo "📦 Full cleanup: removing node_modules..."
    rm -rf node_modules package-lock.json
    npm install
fi

echo "✅ Cleanup completed!"
echo ""
echo "To start fresh:"
echo "  npm start" 