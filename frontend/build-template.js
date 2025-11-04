#!/usr/bin/env node

const nunjucks = require('nunjucks');
const fs = require('fs');
const path = require('path');

// Configure Nunjucks
const env = nunjucks.configure('src/templates', {
    autoescape: true,
    trimBlocks: true,
    lstripBlocks: true,
});

// Render the template
const html = env.render('index.jinja', {
    title: 'Topology Builder',
});

// Write to src/index.html for Parcel to process
const outputPath = path.join(__dirname, 'src', 'index.html');
fs.writeFileSync(outputPath, html);

console.log('✓ Template rendered successfully to src/index.html');
