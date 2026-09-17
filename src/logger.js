const fs = require('fs');
const { ENABLE_LOGS, SESSION_FOLDER, LOGS_FOLDER } = require('./config');

function log(message, type = 'info') {
    if (!ENABLE_LOGS) return;
    const timestamp = new Date().toISOString();
    const emoji = { info: 'ℹ️', success: '✅', warn: '⚠️', error: '❌', debug: '🔍' };
    console.log(`${emoji[type] || '📌'} [${timestamp}] ${message}`);
}

function ensureFolders() {
    const folders = [SESSION_FOLDER, LOGS_FOLDER];
    folders.forEach(folder => {
        if (!fs.existsSync(folder)) {
            fs.mkdirSync(folder, { recursive: true });
        }
    });
}

module.exports = { log, ensureFolders };