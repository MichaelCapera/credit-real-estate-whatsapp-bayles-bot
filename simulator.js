// ============================================
// 🧪 SIMULADOR LOCAL — LOCAL SIMULATOR — Test the logic WITHOUT WhatsApp
// Run: node simulator.js
// ============================================

const readline = require('readline');
const { handleMessage } = require('./src/handlers/message');
const { userState } = require('./src/state');

// ────────────────────────────────────────────
// 🎭 Mock sock: prints to the console instead of sending
// ────────────────────────────────────────────
const mockSock = {
    sendMessage: async (jid, content) => {
        console.log('\n' + '─'.repeat(60));
        if (content.text) {
            console.log('🤖 BOT:\n' + content.text);
        } else if (content.image) {
            console.log(`🤖 BOT: [IMAGEN] ${content.image.url}`);
            console.log('📝 ' + content.caption);
        } else {
            console.log('🤖 BOT:', JSON.stringify(content));
        }
        console.log('─'.repeat(60) + '\n');
        return { key: { id: 'sim-' + Date.now() } };
    },
    user: { id: '573212769477:1@s.whatsapp.net' }
};

const BOT_JID = '573212769477@s.whatsapp.net';
const CLIENTE_JID = '573001234567@s.whatsapp.net';
const CLIENTE_NOMBRE = 'Cliente Simulado';

// ────────────────────────────────────────────
// ⌨️  Readline
// ────────────────────────────────────────────
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: '👤 TÚ:'
});

async function simulateIncomingMessage(text) {
    const msg = {
        key: { remoteJid: CLIENTE_JID, fromMe: false, id: 'sim-' + Date.now() },
        pushName: CLIENTE_NOMBRE,
        message: { conversation: text }
    };

    try {
        await handleMessage(mockSock, msg, BOT_JID);
    } catch (err) {
        console.error('❌ Error:', err.message);
        console.error(err.stack);
    }
}

// ────────────────────────────────────────────
// 🚀 Banner
// ────────────────────────────────────────────
console.log('='.repeat(60));
console.log('🧪 SIMULADOR LOCAL — WhatsApp Bot');
console.log('='.repeat(60));
console.log('Sin QR, sin WhatsApp, sin afectar producción.\n');
console.log('Comandos: /reset  /state  /exit\n');
console.log('='.repeat(60) + '\n');

rl.prompt();

rl.on('line', async (line) => {
    const text = line.trim();
    if (!text) return rl.prompt();

    if (text === '/exit') { console.log('👋 Bye'); process.exit(0); }
    if (text === '/reset') {
        delete userState[CLIENTE_JID];
        console.log('🔄 Estado borrado\n');
        return rl.prompt();
    }
    if (text === '/state') {
        console.log('\n📦 Estado:');
        console.log(JSON.stringify(userState[CLIENTE_JID] || {}, null, 2));
        console.log('');
        return rl.prompt();
    }

    await simulateIncomingMessage(text);
    rl.prompt();
});