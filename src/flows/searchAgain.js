const { formatCities } = require('../formatters/menu');
const { userState, getAvailableCities } = require('../state');

async function handleSearchAgain(sock, sender, senderName, text, state) {
    if (text === '1') {
        state.step = 'awaiting_city';
        return formatCities(getAvailableCities());
    }
    delete userState[sender];
    return `✅ ¡Gracias, ${senderName}!\n\n👋 ¡Que tengas un excelente día!`;
}

module.exports = { handleSearchAgain };