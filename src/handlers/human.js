// ============================================
// 👤 HUMAN TAKEOVER
// When the agent (or any human using the bot's WhatsApp session)
// sends a message to a customer, the bot pauses for that customer.
// ============================================

const { log } = require('../logger');

// Pause duration: 4 hours
const HUMAN_PAUSE_MS = 4 * 60 * 60 * 1000;

// Track message IDs the bot sent, so we can distinguish bot messages
// from human-agent messages (both appear as `fromMe: true`).
const botSentMessageIds = new Set();

// In-memory pauses: { [customerJid]: expiresAtTimestamp }
const pausedChats = {};

/**
 * Mark a message as sent by the bot.
 * Auto-cleans after 10 minutes to avoid memory leak.
 */
function markAsBotMessage(messageId) {
    if (!messageId) return;
    botSentMessageIds.add(messageId);
    setTimeout(() => botSentMessageIds.delete(messageId), 10 * 60 * 1000);
}

/**
 * Pause the bot for a specific chat.
 */
function pauseChat(customerJid) {
    pausedChats[customerJid] = Date.now() + HUMAN_PAUSE_MS;
    log(`⏸️  Bot paused for ${customerJid} until ${new Date(pausedChats[customerJid]).toLocaleString()}`, 'warn');
}

/**
 * Resume the bot for a specific chat.
 */
function resumeChat(customerJid) {
    delete pausedChats[customerJid];
    log(`▶️  Bot resumed for ${customerJid}`, 'success');
}

/**
 * Check if a chat is currently paused.
 */
function isPaused(customerJid) {
    const expiresAt = pausedChats[customerJid];
    if (!expiresAt) return false;

    if (Date.now() >= expiresAt) {
        delete pausedChats[customerJid];
        return false;
    }
    return true;
}

/**
 * Handle an outgoing message (fromMe: true).
 * If it's a human message (not from bot), pause the chat.
 * Supports "/bot resume" to reactivate.
 */
function handleFromMeMessage(msg) {
    const messageId = msg.key.id;

    // If the bot sent this message, ignore
    if (botSentMessageIds.has(messageId)) return;

    const remoteJid = msg.key.remoteJid;

    // Ignore groups, broadcasts, statuses
    if (!remoteJid) return;
    if (remoteJid.endsWith('@g.us')) return;
    if (remoteJid === 'status@broadcast') return;

    // Extract text
    const text = msg.message?.conversation
              || msg.message?.extendedTextMessage?.text
              || '';

    // Check for resume command
    if (text.trim().toLowerCase() === '/bot resume') {
        resumeChat(remoteJid);
        return;
    }

    // Human wrote to a customer → pause
    pauseChat(remoteJid);
}

module.exports = {
    markAsBotMessage,
    handleFromMeMessage,
    pauseChat,
    resumeChat,
    isPaused,
};