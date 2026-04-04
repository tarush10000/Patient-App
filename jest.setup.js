const fs = require('fs');
const path = require('path');

// Load .env.local variables for tests
const envPath = path.resolve(__dirname, '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      const value = valueParts.join('=');
      if (key && value) {
        process.env[key.trim()] = value.trim();
      }
    }
  });
}

// Set the base URL for API tests
// When testing against deployed app, use the production URL
// When testing locally, use localhost
process.env.TEST_BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000'; // Default to localhost so local tests pass
