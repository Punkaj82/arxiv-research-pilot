#!/usr/bin/env node

/**
 * PWA Icon Generator
 * 
 * This script generates all required PWA icons from a base image.
 * Place a 512x512 PNG image named 'icon-base.png' in the project root.
 * 
 * Requirements:
 * - Node.js with npm
 * - sharp package: npm install sharp
 */

const fs = require('fs');
const path = require('path');

// Icon sizes for PWA
const iconSizes = [
  72, 96, 128, 144, 152, 192, 384, 512
];

// Favicon sizes
const faviconSizes = [16, 32];

// Apple touch icon sizes
const appleSizes = [152, 167, 180];

console.log('🎨 PWA Icon Generator');
console.log('====================');

// Check if sharp is installed
try {
  require('sharp');
} catch (error) {
  console.log('❌ Sharp package not found. Installing...');
  require('child_process').execSync('npm install sharp', { stdio: 'inherit' });
}

const sharp = require('sharp');

// Create icons directory
const iconsDir = path.join(__dirname, '..', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
  console.log('✅ Created icons directory');
}

// Check if base icon exists
const baseIconPath = path.join(__dirname, '..', 'icon-base.png');
if (!fs.existsSync(baseIconPath)) {
  console.log('❌ Base icon not found. Creating a simple placeholder...');
  
  // Create a simple placeholder icon
  const svgIcon = `
    <svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="512" height="512" fill="url(#grad)"/>
      <text x="256" y="200" font-family="Arial, sans-serif" font-size="80" font-weight="bold" text-anchor="middle" fill="white">AR</text>
      <text x="256" y="300" font-family="Arial, sans-serif" font-size="40" text-anchor="middle" fill="white">Research</text>
      <text x="256" y="350" font-family="Arial, sans-serif" font-size="40" text-anchor="middle" fill="white">Pilot</text>
    </svg>
  `;
  
  sharp(Buffer.from(svgIcon))
    .png()
    .toFile(baseIconPath)
    .then(() => {
      console.log('✅ Created placeholder icon');
      generateIcons();
    });
} else {
  generateIcons();
}

async function generateIcons() {
  console.log('🔄 Generating PWA icons...');
  
  try {
    // Generate main PWA icons
    for (const size of iconSizes) {
      await sharp(baseIconPath)
        .resize(size, size)
        .png()
        .toFile(path.join(iconsDir, `icon-${size}x${size}.png`));
      console.log(`✅ Generated icon-${size}x${size}.png`);
    }
    
    // Generate favicons
    for (const size of faviconSizes) {
      await sharp(baseIconPath)
        .resize(size, size)
        .png()
        .toFile(path.join(iconsDir, `favicon-${size}x${size}.png`));
      console.log(`✅ Generated favicon-${size}x${size}.png`);
    }
    
    // Generate Apple touch icons
    for (const size of appleSizes) {
      await sharp(baseIconPath)
        .resize(size, size)
        .png()
        .toFile(path.join(iconsDir, `apple-touch-icon-${size}x${size}.png`));
      console.log(`✅ Generated apple-touch-icon-${size}x${size}.png`);
    }
    
    console.log('\n🎉 All icons generated successfully!');
    console.log('📁 Icons saved in:', iconsDir);
    console.log('\n📱 Your PWA is now ready for mobile devices!');
    
  } catch (error) {
    console.error('❌ Error generating icons:', error.message);
  }
} 