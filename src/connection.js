const { default: makeWASocket, DisconnectReason, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');

const { BOT_NUMBER, SESSION_FOLDER, RECONNECT_DELAY } = require('./config');
const { log, ensureFolders } = require('./logger');
const { handleMessage } = require('./handlers/message');
const { handleFromMeMessage, markAsBotMessage } = require('./handlers/human');

async function connectToWhatsApp() {
    log('🚀 Starting WhatsApp Bot...', 'info');
    ensureFolders();

    try {
        const { state, saveCreds } = await useMultiFileAuthState(SESSION_FOLDER);
        log('Authentication state loaded', 'debug');

        const sock = makeWASocket({ auth: state });

        // ============================================
        // 🔒 Wrap sendMessage to track bot-sent messages
        // ============================================
        const originalSendMessage = sock.sendMessage.bind(sock);
        sock.sendMessage = async (jid, content, options) => {
            const result = await originalSendMessage(jid, content, options);
            if (result?.key?.id) {
                markAsBotMessage(result.key.id);
            }
            return result;
        };

        // Connection events
        sock.ev.on('connection.update', (update) => {
            const { connection, lastDisconnect, qr } = update;

            if (qr) {
                log('📱 Scan this QR:', 'info');
                qrcode.generate(qr, { small: true });
            }

            if (connection === 'close') {
                const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
                if (shouldReconnect) {
                    log('🔄 Reconnecting...', 'warn');
                    setTimeout(() => connectToWhatsApp(), RECONNECT_DELAY);
                }
            } else if (connection === 'open') {
                log('✅ Bot connected successfully!', 'success');
            }
        });

        sock.ev.on('creds.update', saveCreds);

        // ============================================
        // 💬 MESSAGE PROCESSING
        // ============================================
        sock.ev.on('messages.upsert', async ({ messages }) => {
            const msg = messages[0];
            if (!msg.message) return;

            // ============================================
            // 👤 HUMAN TAKEOVER: fromMe messages
            // ============================================
            if (msg.key.fromMe) {
                handleFromMeMessage(msg);
                return;
            }

            // ============================================
            // 🤖 Normal processing (from customer)
            // ============================================
            const botJid = sock.user.id.split(':')[0] + '@s.whatsapp.net';
            await handleMessage(sock, msg, botJid);
        });

        return sock;

    } catch (error) {
        log(`Connection error: ${error.message}`, 'error');
        setTimeout(() => connectToWhatsApp(), RECONNECT_DELAY);
    }
}

module.exports = { connectToWhatsApp };