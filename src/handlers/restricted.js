// ============================================
// 🔒 RESTRICTED CHATS (@lid)
// Handles messages from Linked IDs and other non-standard JIDs.
// ============================================

const { log } = require('../logger');

/**
 * Normalize a JID to a canonical form.
 * - @s.whatsapp.net → keep
 * - @lid → keep (Linked ID, no phone number exposed)
 * - @g.us → keep (groups)
 */
function normalizeJid(jid) {
    if (!jid) return null;
    // Strip device suffix (e.g. "123:45@s.whatsapp.net" → "123@s.whatsapp.net")
    return jid.replace(/:\d+@/, '@');
}

/**
 * Check if a chat is a Linked ID (no phone number exposed).
 */
function isRestricted(jid) {
    return jid?.endsWith('@lid');
}

/**
 * Extract a phone number from a JID if possible.
 * For @lid contacts, returns null.
 */
function extractPhone(jid) {
    if (!jid) return null;
    if (jid.endsWith('@s.whatsapp.net')) {
        return jid.split('@')[0];
    }
    return null;
}

/**
 * Log a restricted chat for diagnostics.
 */
function logRestricted(jid, msg) {
    log(`🔒 Restricted chat detected: ${jid}`, 'debug');
    const text = msg.message?.conversation 
              || msg.message?.extendedTextMessage?.text 
              || '(no text)';
    log(`   Text: ${text}`, 'debug');
}

module.exports = {
    normalizeJid,
    isRestricted,
    extractPhone,
    logRestricted,
};