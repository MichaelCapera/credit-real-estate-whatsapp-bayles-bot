// ============================================
// 📋 CONFIGURATION
// ============================================

const BOT_NUMBER = '573212769477';
const SESSION_FOLDER = 'auth_info_baileys';
const LOGS_FOLDER = 'logs';
const RECONNECT_DELAY = 3000;
const SESSION_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes
const ENABLE_LOGS = true;

// ============================================
// 👥 GROUP CONFIGURATION
// ============================================

const GROUP_CONFIG = {
    // 'ignore' | 'mention' | 'allowed' | 'all'
    mode: 'mention',
    // Lista de grupos permitidos (solo si mode = 'allowed')
    allowedGroups: [],
    // Palabras clave para activar el bot en grupos
    triggerWords: ['@bot', '!bot', 'asistente', 'ayuda', 'hola bot']
};

// ============================================
// 🌐 EXTERNAL APIs
// ============================================
const API_BASE_URL = process.env.API_BASE_URL || 'https://creditofincaraiz.online';
const PROPERTIES_API_URL = process.env.PROPERTIES_API_URL || 'https://8xuawsbnzg.execute-api.us-east-1.amazonaws.com/dev/data-properties';

// Shared secret the web app expects in the X-Bot-Token header. Never log it.
const BOT_API_TOKEN = process.env.BOT_API_TOKEN || '';

/**
 * Headers for calls to the web app API (API_BASE_URL only — not PROPERTIES_API_URL).
 * Adds X-Bot-Token when the token is configured.
 */
function appApiHeaders(extra = {}) {
    return BOT_API_TOKEN ? { ...extra, 'X-Bot-Token': BOT_API_TOKEN } : { ...extra };
}

module.exports = {
    BOT_NUMBER,
    SESSION_FOLDER,
    LOGS_FOLDER,
    RECONNECT_DELAY,
    SESSION_TIMEOUT_MS,
    ENABLE_LOGS,
    GROUP_CONFIG,
    API_BASE_URL,
    PROPERTIES_API_URL,
    BOT_API_TOKEN,
    appApiHeaders,
};