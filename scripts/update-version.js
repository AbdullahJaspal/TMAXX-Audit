#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Read the new version from command line argument
const newVersion = process.argv[2];

if (!newVersion) {
  console.error('Usage: node scripts/update-version.js <new-version>');
  console.error('Example: node scripts/update-version.js 1.1.0');
  process.exit(1);
}

// Validate version format (simple check)
if (!/^\d+\.\d+\.\d+$/.test(newVersion)) {
  console.error('Invalid version format. Please use semantic versioning (e.g., 1.1.0)');
  process.exit(1);
}

console.log(`Updating version to ${newVersion}...`);

// Update package.json
const packageJsonPath = path.join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
packageJson.version = newVersion;
fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');

console.log('✅ Updated package.json');

// Update app.json (if it exists and has version)
const appJsonPath = path.join(__dirname, '..', 'app.json');
if (fs.existsSync(appJsonPath)) {
  const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
  if (appJson.expo && appJson.expo.version) {
    appJson.expo.version = newVersion;
    fs.writeFileSync(appJsonPath, JSON.stringify(appJson, null, 2) + '\n');
    console.log('✅ Updated app.json');
  }
}

console.log(`🎉 Version updated to ${newVersion} successfully!`);
console.log('\nNote: app.config.js automatically reads from package.json, so no manual update needed there.'); 