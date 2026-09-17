// ============================================
// 🚀 WHATSAPP BOT — Entry Point
// ============================================

const { log } = require('./src/logger');
const { connectToWhatsApp } = require('./src/connection');

process.on('uncaughtException', (error) => {
    log(`Uncaught error: ${error.message}`, 'error');
});

process.on('unhandledRejection', (reason) => {
    log(`Unhandled rejection: ${reason}`, 'error');
});

log('🚀 Starting WhatsApp Bot...', 'info');

connectToWhatsApp();

console.log('\n' + '='.repeat(60));
console.log('🤖 *WHATSAPP BOT - PROPERTY ASSISTANT*');
console.log('='.repeat(60));
console.log('💡 FEATURES:');
console.log('  1️⃣ Main menu with 4 options');
console.log('  2️⃣ Colombia property search with filters');
console.log('  3️⃣ Miami investment flow');
console.log('  4️⃣ Credit card pre-qualification');
console.log('  5️⃣ Sell/rent property flow (with email)');
console.log('  6️⃣ Dynamic navigation IDs (auto-calculated)');
console.log('  7️⃣ Session timeout: 5 minutes');
console.log('  8️⃣ Voice message handling');
console.log('  9️⃣ 🖼️ Property images with captions');
console.log('='.repeat(60));
console.log('📌 GLOBAL COMMANDS:');
console.log('  "volver" → Go back one step');
console.log('  "cancelar" → Cancel conversation');
console.log('  "menú" → Go to main menu');
console.log('='.repeat(60));
console.log('📱 Waiting for connection...\n');