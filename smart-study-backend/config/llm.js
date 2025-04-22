/**
 * LLM Service Configuration
 *
 * This file configures the LLM service with provider details and credentials.
 * Default provider is Gemini, but can be switched to other providers (OpenAI, Claude)
 * by updating this configuration.
 *
 * Environment variables should be set in .env file:
 * - GEMINI_API_KEY: Your Gemini API key
 * - OPENAI_API_KEY: Your OpenAI API key (optional)
 * - ANTHROPIC_API_KEY: Your Anthropic/Claude API key (optional)
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

// Debug environment variables
console.log('Environment variables for LLM:');
console.log('LLM_PROVIDER:', process.env.LLM_PROVIDER);
console.log('GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? 'Set (not showing for security)' : 'Not set');
console.log('OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? 'Set (not showing for security)' : 'Not set');
console.log('ANTHROPIC_API_KEY:', process.env.ANTHROPIC_API_KEY ? 'Set (not showing for security)' : 'Not set');

const config = {
  // Default provider
  provider: process.env.LLM_PROVIDER || 'gemini',

  // Provider configurations
  providers: {
    gemini: {
      apiKey: process.env.GEMINI_API_KEY || 'AIzaSyC9ytYKFD3FkPIc6VhvmsKH7bznQGWFTkM',
      model: process.env.GEMINI_MODEL || 'gemini-1.5-pro',
      maxTokens: parseInt(process.env.GEMINI_MAX_TOKENS || '2048'),
      temperature: parseFloat(process.env.GEMINI_TEMPERATURE || '0.7'),
      topP: parseFloat(process.env.GEMINI_TOP_P || '0.95'),
      topK: parseInt(process.env.GEMINI_TOP_K || '40')
    },
    openai: {
      apiKey: process.env.OPENAI_API_KEY,
      model: process.env.OPENAI_MODEL || 'gpt-4',
      maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS || '2048'),
      temperature: parseFloat(process.env.OPENAI_TEMPERATURE || '0.7')
    },
    anthropic: {
      apiKey: process.env.ANTHROPIC_API_KEY,
      model: process.env.ANTHROPIC_MODEL || 'claude-3-opus-20240229',
      maxTokens: parseInt(process.env.ANTHROPIC_MAX_TOKENS || '2048'),
      temperature: parseFloat(process.env.ANTHROPIC_TEMPERATURE || '0.7')
    }
  },

  // Fallback settings
  fallback: {
    enabled: process.env.LLM_FALLBACK_ENABLED !== 'false',
    logErrors: process.env.LLM_LOG_ERRORS !== 'false'
  },

  // Scheduling rules
  schedulingRules: {
    // Weights for prioritization
    weights: {
      exam: 0.8,
      assignment: 0.5
    },
    // Time slots
    timeSlots: {
      morning: {
        start: 8, // 8 AM
        end: 10   // 10 AM
      },
      evening: {
        weekday: 16, // 4 PM
        saturday: 18 // 6 PM
      }
    },
    // Break durations (in minutes)
    breaks: {
      play: 60,  // 1 hour
      meals: 60  // 1 hour
    }
  }
};

module.exports = config;
