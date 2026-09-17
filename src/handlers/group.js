const { log } = require('../logger');
const { GROUP_CONFIG } = require('../config');

async function handleGroupMessage(sock, msg, sender, senderName, botJid) {
    try {
        const isGroup = sender.endsWith('@g.us');
        if (!isGroup) return null;

        const text = msg.message.conversation ||
                     msg.message?.extendedTextMessage?.text || '';

        const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
        const isMentioned = mentioned.includes(botJid);

        const hasTrigger = GROUP_CONFIG.triggerWords.some(word =>
            text.toLowerCase().includes(word.toLowerCase())
        );

        let shouldRespond = false;

        switch (GROUP_CONFIG.mode) {
            case 'ignore':
                shouldRespond = false;
                break;
            case 'mention':
                shouldRespond = isMentioned || hasTrigger;
                break;
            case 'allowed':
                shouldRespond = GROUP_CONFIG.allowedGroups.includes(sender);
                break;
            case 'all':
                shouldRespond = true;
                break;
            default:
                shouldRespond = false;
        }

        if (!shouldRespond) {
            log(`📩 Group message from ${sender} ignored`, 'debug');
            return { shouldProcess: false };
        }

        await sock.sendMessage(sender, {
            text: `👋 *¡Hola ${senderName}!* Me activaste en el grupo.\n\n` +
                  `📌 Para una atención personalizada, escríbeme al *privado*.\n` +
                  `📌 O puedes continuar aquí usando *!bot ayuda* para ver comandos.`,
            mentions: [sender]
        });

        log(`🤖 Responded in group ${sender} by mention/trigger`, 'info');
        return { shouldProcess: false };

    } catch (error) {
        log(`Error in handleGroupMessage: ${error.message}`, 'error');
        return { shouldProcess: false };
    }
}

module.exports = { handleGroupMessage };