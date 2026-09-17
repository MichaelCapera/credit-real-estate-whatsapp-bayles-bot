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

module.exports = {
    BOT_NUMBER,
    SESSION_FOLDER,
    LOGS_FOLDER,
    RECONNECT_DELAY,
    SESSION_TIMEOUT_MS,
    ENABLE_LOGS,
    GROUP_CONFIG
};