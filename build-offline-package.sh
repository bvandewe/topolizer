#!/bin/bash

# Script to create an offline/standalone package of Topology Builder
# This creates a zip file with the built frontend that can run without a server

set -e

echo "🔨 Building Topology Builder Offline Package..."

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get version from CHANGELOG or use default
VERSION=$(grep -m 1 "## \[" CHANGELOG.md | grep -v "Unreleased" | head -n 1 | sed -n 's/.*\[\(.*\)\].*/\1/p')
if [ -z "$VERSION" ]; then
    VERSION="0.1.0"
fi
PACKAGE_NAME="topology-builder-offline-v${VERSION}"
PACKAGE_DIR="./build/${PACKAGE_NAME}"

echo -e "${BLUE}Version: ${VERSION}${NC}"

# Clean and create build directory
echo -e "${BLUE}📁 Preparing build directory...${NC}"
rm -rf ./build
mkdir -p "${PACKAGE_DIR}"

# Build the frontend
echo -e "${BLUE}🏗️  Building frontend...${NC}"
cd frontend

# Render templates
echo -e "${BLUE}📝 Rendering templates...${NC}"
npm run render

# Build for production
echo -e "${BLUE}📦 Building production bundle...${NC}"
npm run build

cd ..

# Copy dist files
echo -e "${BLUE}📋 Copying application files...${NC}"
cp -r frontend/dist/* "${PACKAGE_DIR}/"

# Fix paths in HTML for offline use (change /static/ to ./)
echo -e "${BLUE}🔧 Fixing paths for offline use...${NC}"
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    sed -i '' 's|/static/|./|g' "${PACKAGE_DIR}/index.html"
else
    # Linux
    sed -i 's|/static/|./|g' "${PACKAGE_DIR}/index.html"
fi

# Copy Cisco icons
echo -e "${BLUE}🎨 Copying Cisco icons...${NC}"
mkdir -p "${PACKAGE_DIR}/cisco_icons"
cp -r cisco_icons/* "${PACKAGE_DIR}/cisco_icons/"

# Create README for the offline package
echo -e "${BLUE}📄 Creating README...${NC}"
cat > "${PACKAGE_DIR}/README.txt" << 'EOF'
Topology Builder - Offline Standalone Package
==============================================

VERSION: ${VERSION}

QUICK START:
1. Extract this zip file to any location
2. Open index.html in your web browser
3. Start creating your network topology diagrams!

FEATURES:
- Drag-and-drop network shapes (Cisco devices, basic shapes)
- Create connections between devices
- Multi-shape alignment and distribution tools
- Export/Import topology as JSON
- Export as PNG image
- All data stored locally in browser (no server needed)

BROWSER REQUIREMENTS:
- Modern web browser (Chrome, Firefox, Safari, Edge)
- JavaScript enabled
- localStorage support

USAGE NOTES:
- This is a fully offline version - no internet required
- Your diagrams are saved in browser localStorage
- Use File > Export to save your work as JSON
- Use File > Import to load saved topologies
- Clear browser data will erase saved topologies (export first!)

KEYBOARD SHORTCUTS:
- Delete/Backspace: Delete selected shape(s)
- V: Toggle selection mode
- Esc: Cancel current action
- +/-: Zoom in/out

For full documentation and latest version, visit:
https://github.com/bvandewe/topolizer

LICENSE: MIT
EOF

# Replace version placeholder
sed -i.bak "s/\${VERSION}/${VERSION}/g" "${PACKAGE_DIR}/README.txt" && rm "${PACKAGE_DIR}/README.txt.bak" 2>/dev/null || sed -i "s/\${VERSION}/${VERSION}/g" "${PACKAGE_DIR}/README.txt"

# Create a simple launcher HTML that explains the offline mode
cat > "${PACKAGE_DIR}/OPEN_ME.html" << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Topology Builder - Launcher</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            max-width: 800px;
            margin: 50px auto;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #fff;
        }
        .container {
            background: rgba(255, 255, 255, 0.95);
            border-radius: 15px;
            padding: 40px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            color: #333;
        }
        h1 { color: #667eea; margin-top: 0; }
        .btn {
            display: inline-block;
            background: #667eea;
            color: white;
            padding: 15px 30px;
            text-decoration: none;
            border-radius: 8px;
            font-size: 18px;
            font-weight: bold;
            margin: 20px 10px 10px 0;
            transition: background 0.3s;
        }
        .btn:hover { background: #764ba2; }
        .info { background: #f0f0f0; padding: 15px; border-radius: 8px; margin: 20px 0; }
        ul { line-height: 1.8; }
        .version { color: #999; font-size: 14px; margin-top: 30px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🌐 Topology Builder - Offline Edition</h1>
        <p><strong>Welcome to the standalone version of Topology Builder!</strong></p>

        <a href="index.html" class="btn">🚀 Launch Application</a>

        <div class="info">
            <h3>✨ What's Included:</h3>
            <ul>
                <li>Full network topology diagram editor</li>
                <li>Cisco device shapes and basic shapes</li>
                <li>Multi-shape alignment tools</li>
                <li>Export/Import as JSON</li>
                <li>PNG image export</li>
                <li>Completely offline - no server needed!</li>
            </ul>
        </div>

        <div class="info">
            <h3>💡 Getting Started:</h3>
            <ol>
                <li>Click "Launch Application" above</li>
                <li>Select shapes from the left sidebar</li>
                <li>Click on canvas to place shapes</li>
                <li>Create connections between shapes</li>
                <li>Use alignment tools for professional layouts</li>
                <li>Export your work when done!</li>
            </ol>
        </div>

        <div class="info">
            <h3>📝 Important Notes:</h3>
            <ul>
                <li>Your work is saved in browser localStorage</li>
                <li>Clearing browser data will delete your diagrams</li>
                <li>Use File → Export to backup your work</li>
                <li>Works in any modern browser (Chrome, Firefox, Safari, Edge)</li>
            </ul>
        </div>

        <div class="version">
            Topology Builder v${VERSION} - Offline Package<br>
            <a href="https://github.com/bvandewe/topolizer" style="color: #667eea;">GitHub Repository</a>
        </div>
    </div>
</body>
</html>
EOF

# Replace version placeholder
sed -i.bak "s/\${VERSION}/${VERSION}/g" "${PACKAGE_DIR}/OPEN_ME.html" && rm "${PACKAGE_DIR}/OPEN_ME.html.bak" 2>/dev/null || sed -i "s/\${VERSION}/${VERSION}/g" "${PACKAGE_DIR}/OPEN_ME.html"

# Create the zip file
echo -e "${BLUE}📦 Creating zip package...${NC}"
cd ./build
zip -r "${PACKAGE_NAME}.zip" "${PACKAGE_NAME}" > /dev/null
cd ..

# Calculate package size
PACKAGE_SIZE=$(du -h "./build/${PACKAGE_NAME}.zip" | cut -f1)

echo ""
echo -e "${GREEN}✅ Offline package created successfully!${NC}"
echo ""
echo -e "${YELLOW}📦 Package Details:${NC}"
echo -e "   Name: ${PACKAGE_NAME}.zip"
echo -e "   Size: ${PACKAGE_SIZE}"
echo -e "   Location: ./build/${PACKAGE_NAME}.zip"
echo ""
echo -e "${YELLOW}📋 Package Contents:${NC}"
echo -e "   - index.html (main application)"
echo -e "   - OPEN_ME.html (launcher with instructions)"
echo -e "   - README.txt (documentation)"
echo -e "   - All bundled JS/CSS assets"
echo -e "   - Cisco device icons"
echo ""
echo -e "${YELLOW}🚀 To use:${NC}"
echo -e "   1. Extract: unzip ./build/${PACKAGE_NAME}.zip"
echo -e "   2. Open: ${PACKAGE_NAME}/OPEN_ME.html"
echo -e "   3. Or directly: ${PACKAGE_NAME}/index.html"
echo ""
echo -e "${GREEN}Done! 🎉${NC}"
