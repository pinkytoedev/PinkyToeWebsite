// Security utilities for environment validation
import { config } from './config.js';

export interface SecurityValidation {
    isSecure: boolean;
    warnings: string[];
    recommendations: string[];
}

/**
 * Validates the security configuration of the application
 */
export function validateSecurity(): SecurityValidation {
    const warnings: string[] = [];
    const recommendations: string[] = [];

    // Check for .env file exposure (should never happen due to .gitignore)
    if (process.env.NODE_ENV === 'production' && (config.airtable.apiKey || config.airtable.baseId)) {
        warnings.push('⚠️  Airtable credentials detected in production environment');
        recommendations.push('Ensure Airtable credentials are not used in production builds');
    }

    // Check development setup
    if (config.isDevelopment) {
        if (!config.airtable.apiKey && !config.airtable.baseId) {
            console.log('ℹ️  Using sample data mode (no Airtable credentials)');
        } else if (!config.airtable.apiKey || !config.airtable.baseId) {
            warnings.push('⚠️  Incomplete Airtable credentials (need both API key and base ID)');
            recommendations.push('Set both AIRTABLE_API_KEY and AIRTABLE_BASE_ID, or remove both to use sample data');
        }
    }

    // Check for common security issues
    if (config.airtable.apiKey && config.airtable.apiKey.length < 10) {
        warnings.push('⚠️  Airtable API key appears to be invalid or placeholder');
    }

    if (config.airtable.baseId && !config.airtable.baseId.startsWith('app')) {
        warnings.push('⚠️  Airtable base ID should start with "app"');
    }

    const isSecure = warnings.length === 0;

    return {
        isSecure,
        warnings,
        recommendations
    };
}

/**
 * Logs security validation results
 */
export function logSecurityStatus(): void {
    const validation = validateSecurity();
    
    console.log('\n🔒 Security Status:');
    
    if (validation.isSecure) {
        console.log('✅ Configuration is secure');
    } else {
        console.log('❌ Security issues detected');
    }

    if (validation.warnings.length > 0) {
        console.log('\nWarnings:');
        validation.warnings.forEach(warning => console.log(`  ${warning}`));
    }

    if (validation.recommendations.length > 0) {
        console.log('\nRecommendations:');
        validation.recommendations.forEach(rec => console.log(`  • ${rec}`));
    }

    // Provide setup guidance for development
    if (config.isDevelopment && !config.airtable.apiKey && !config.airtable.baseId) {
        console.log('\nℹ️  Development Setup:');
        console.log('  • To use live Airtable data: Copy .env.example to .env and add your credentials');
        console.log('  • To use sample data: No setup needed (current mode)');
    }

    console.log('');
}