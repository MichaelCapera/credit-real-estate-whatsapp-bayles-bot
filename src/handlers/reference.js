// ============================================
// 🔗 REFERENCE HANDLER — Handles advisor links (Ref #XXXaN)
// ============================================

const { log } = require('../logger');
const { formatMainMenu } = require('../formatters/menu');
const { resetUserTimer, userState } = require('../state');

/**
 * Detects and handles a reference link message.
 * Returns true if handled, false otherwise.
 */
async function handleReference(sock, sender, senderName, text) {
    const match = text.match(/Ref[:\s]*#?(\d+)a(\d+)/i);
    if (!match) return false;

    const propertyId = match[1];
    const agentId    = match[2];

    log(`🔗 Reference detected: Property #${propertyId}, Agent #${agentId}`, 'info');

    // Initialize state if this is a new user
    if (!userState[sender]) {
        userState[sender] = {
            step: 'main_menu',
            data: { whatsapp_name: senderName }
        };
    }

    // Store agent and property context
    userState[sender].data = userState[sender].data || {};
    userState[sender].data.agentId    = agentId;
    userState[sender].data.propertyId = propertyId;

    resetUserTimer(sender, sock);

    // Simulated response (advisor API not ready yet)
    const simulatedResponse =
        `🔗 *Has llegado desde un enlace compartido por un asesor*\n\n` +
        `📌 *Referencia:* #${propertyId} (Asesor: ${agentId})\n` +
        `🏠 *APARTAMENTO EN ARRIENDO - LAGOS DE TORCA (LIRIO), BOGOTÁ*\n` +
        `💰 $2.500.000 COP\n` +
        `📐 120 m² | 🚿 2 Baños | 🚗 1 Garaje\n\n` +
        `📌 Un asesor se comunicará contigo pronto.`;

    await sock.sendMessage(sender, { text: simulatedResponse });

    // Show main menu for further navigation
    const menuMessage = `\n¿Qué te gustaría hacer ahora?\n\n${formatMainMenu(senderName)}`;
    await sock.sendMessage(sender, { text: menuMessage });

    userState[sender].step = 'main_menu';
    return true;
}

module.exports = { handleReference };