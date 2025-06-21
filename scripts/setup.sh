#!/bin/bash

# arXiv Fetcher Setup Script
echo "🚀 Setting up arXiv Fetcher..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 12 ]; then
    echo "❌ Node.js version 12 or higher is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Check if installation was successful
if [ $? -eq 0 ]; then
    echo "✅ Dependencies installed successfully"
else
    echo "❌ Failed to install dependencies"
    exit 1
fi

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p logs
mkdir -p temp

# Set permissions
chmod +x scripts/setup.sh

echo "🎉 Setup completed successfully!"
echo ""
echo "To start the server:"
echo "  npm start"
echo ""
echo "To open in browser:"
echo "  http://localhost:3000"
echo ""
echo "For development:"
echo "  Press F5 in VS Code to start debugging" 