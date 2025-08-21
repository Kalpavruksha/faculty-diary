const fs = require('fs');
const path = require('path');

// Paths to the .env files
const rootEnvPath = path.resolve(__dirname, '../../.env');
const projectEnvPath = path.resolve(__dirname, '../.env.local');

console.log('Setting up environment variables...');

if (!fs.existsSync(rootEnvPath)) {
  console.error('Root .env file not found at:', rootEnvPath);
  process.exit(1);
}

// Read the root .env file
const rootEnvContent = fs.readFileSync(rootEnvPath, 'utf8');
const rootEnvLines = rootEnvContent.split('\n').filter(line => {
  // Keep only non-empty lines that are not comments and have an equals sign
  return line.trim() !== '' && !line.trim().startsWith('#') && line.includes('=');
});

// Parse the variables into a map
const envVars = {};
rootEnvLines.forEach(line => {
  const [key, ...valueParts] = line.split('=');
  const value = valueParts.join('='); // Handle values that might contain = signs
  if (key && value) {
    envVars[key.trim()] = value.trim();
  }
});

console.log('Found environment variables:', Object.keys(envVars).join(', '));

// Create or update the .env.local file with the necessary variables
let envLocalContent = '';

// Add important variables
const variablesToCopy = [
  'MONGODB_URI',
  'JWT_SECRET',
  'EMAIL_USER',
  'EMAIL_PASSWORD',
  'NEXT_PUBLIC_APP_URL'
];

variablesToCopy.forEach(key => {
  if (envVars[key]) {
    envLocalContent += `${key}=${envVars[key]}\n`;
    console.log(`Added ${key} to .env.local`);
  } else {
    console.warn(`Warning: ${key} not found in root .env file`);
  }
});

// Write the content to .env.local
fs.writeFileSync(projectEnvPath, envLocalContent);
console.log('Environment variables setup complete!');
console.log('.env.local file created at:', projectEnvPath); 