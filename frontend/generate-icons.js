#!/usr/bin/env node
/**
 * Run once: node generate-icons.js
 * Produces public/icons/icon-192.svg and icon-512.svg
 * For real PNGs, run through: npx sharp-cli or use a real image.
 * These SVGs work as PWA icons in most browsers.
 */
const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'public', 'icons');
fs.mkdirSync(dir, { recursive: true });

const svg = (size) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
  <rect width="${size}" height="${size}" rx="${size * 0.18}" fill="#0d1117"/>
  <rect width="${size}" height="${size}" rx="${size * 0.18}" fill="url(#g)"/>
  <defs>
    <radialGradient id="g" cx="50%" cy="30%" r="70%">
      <stop offset="0%" stop-color="#1a7a3c" stop-opacity="0.4"/>
      <stop offset="100%" stop-color="#0d1117" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <text x="50%" y="57%" font-size="${size * 0.52}" text-anchor="middle" dominant-baseline="middle">🏏</text>
</svg>`;

fs.writeFileSync(path.join(dir, 'icon-192.svg'), svg(192));
fs.writeFileSync(path.join(dir, 'icon-512.svg'), svg(512));
console.log('Icons written to public/icons/');
