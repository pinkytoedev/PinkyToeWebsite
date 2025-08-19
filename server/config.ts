import * as dotenv from "dotenv";

// Load environment variables as early as possible
dotenv.config();

export const config = {
    airtable: {
        apiKey: process.env.AIRTABLE_API_KEY || '',
        baseId: process.env.AIRTABLE_BASE_ID || ''
    },
    server: {
        port: parseInt(process.env.PORT || '5000', 10),
        host: process.env.HOST || '0.0.0.0'
    },
    isDevelopment: process.env.NODE_ENV !== 'production'
};

// Log basic environment info (safe for logging)
console.log('Environment variables loaded:');
console.log('NODE_ENV:', process.env.NODE_ENV || 'development');
console.log('AIRTABLE_API_KEY:', config.airtable.apiKey ? '✓ Set' : '✗ Not set');
console.log('AIRTABLE_BASE_ID:', config.airtable.baseId ? '✓ Set' : '✗ Not set');
console.log('PORT:', process.env.PORT || '5000 (default)');