// ============================================
// 🔑 AGENT ACCESS — Sends magic link via WhatsApp
// ============================================

const { log } = require('../logger');
const { API_BASE_URL } = require('../config');
const { resetUserTimer } = require('../state');

/**
 * Keywords that trigger the agent access flow.
 * Tested case-insensitively against the incoming message.
 */
const AGENT_PATTERNS = [
    /soy\s+asesor/i,
    /quiero\s+ver\s+(el\s+)?cat[aá]logo/i,
    /mi\s+panel\s+de\s+asesor/i,
    /entrar\s+a\s+mi\s+panel/i,
    /acceso\s+(de\s+|para\s+)?asesor/i,
    /^catalogo$/i,
    /^catálogo$/i,
];

function matchesAgentIntent(text) {
    if (!text) return false;
    return AGENT_PATTERNS.some((re) => re.test(text));
}

/**
 * Handle "soy asesor" intent — sends a magic link via WhatsApp.
 * Returns true if handled, false to let the flow continue.
 */
async function handleAgentAccess(sock, sender, senderName, text, msg) {
    log(`[AGENT ACCESS] msg.key = ${JSON.stringify(msg.key)}`, 'debug');
    // Bail out if the message doesn't match any agent pattern
    if (!matchesAgentIntent(text)) {
        return false;
    }

    log(`🔑 Agent access request from ${sender}`, 'info');

    // Extract phone from JID
    // Try to extract the phone from the JID.
    // WhatsApp now sends many chats as "@lid" (Linked Device ID) instead of
    // "@s.whatsapp.net". When that happens, we look for the real phone number
    // in msg.key.senderPn or msg.key.remoteJidAlt (Baileys exposes it there).
    let rawPhone = null;

    if (sender.endsWith('@s.whatsapp.net')) {
        // Classic format: 573153045383:12@s.whatsapp.net
        rawPhone = sender.split('@')[0];
    } else if (sender.endsWith('@lid')) {
        // Restricted format: 228165909754087:3@lid
        // The real phone is exposed in different fields depending on Baileys version.
        // Try them in order of reliability.
        rawPhone =
            (msg && msg.key && msg.key.senderPn) ||
            (msg && msg.key && msg.key.remoteJidAlt && msg.key.remoteJidAlt.includes('@s.whatsapp.net')
                ? msg.key.remoteJidAlt.split('@')[0]
                : null) ||
            null;
    }

    // Strip device suffix if present
    const phone = rawPhone ? rawPhone.split(':')[0].replace(/\D/g, '') : null;

    log(`[AGENT ACCESS] sender=${sender} | rawPhone=${rawPhone} | phone=${phone}`, 'info');

    if (!phone) {
        await sock.sendMessage(sender, {
            text:
                `⚠️ No pudimos identificar tu número de WhatsApp.\n\n` +
                `Este servicio solo funciona desde tu número registrado como asesor.\n\n` +
                `Si aún no eres asesor, regístrate aquí:\n${API_BASE_URL}/agent/welcome`
        });
        return true;
    }

    try {
        const res = await fetch(`${API_BASE_URL}/api/agentmagiclink`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone }),
        });
        const data = await res.json();

        if (!data.success) {
            await sock.sendMessage(sender, {
                text:
                    `⚠️ ${data.message || 'No pudimos generar tu acceso.'}\n\n` +
                    `📱 Tu número de WhatsApp detectado: *${phone}*\n\n` +
                    `Si ese número no es el que registraste, escríbenos para actualizarlo.\n\n` +
                    `Si aún no eres asesor, regístrate aquí:\n${API_BASE_URL}/agent/welcome`
            });
            resetUserTimer(sender, sock);
            return true;
        }

        await sock.sendMessage(sender, {
            text:
                `🔑 *Acceso a tu panel de asesor*\n\n` +
                `Hola ${data.name}, haz click en el siguiente enlace para entrar:\n\n` +
                `${data.url}\n\n` +
                `⏱️ Este enlace expira en 15 minutos.\n` +
                `🔒 Por seguridad, no lo compartas con nadie.`
        });

        log(`✅ Magic link sent to ${data.name} (${phone})`, 'success');

    } catch (err) {
        log(`❌ Error generating magic link: ${err.message}`, 'error');
        await sock.sendMessage(sender, {
            text: '❌ Hubo un error al generar tu acceso. Intenta de nuevo en unos minutos.'
        });
    }

    resetUserTimer(sender, sock);
    return true;
}

module.exports = { handleAgentAccess };