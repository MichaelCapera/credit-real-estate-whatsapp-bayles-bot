const { INTENT_PATTERNS } = require('../data/intents');
const { formatOperationTypes } = require('../formatters/menu');
const { formatCreditCardIntro } = require('../formatters/creditCard');
const { getNavIds } = require('../data/nav');

function detectIntent(message) {
    const lowerMessage = message.toLowerCase().trim();
    const sortedPatterns = [...INTENT_PATTERNS].sort((a, b) => a.priority - b.priority);

    for (const pattern of sortedPatterns) {
        const matched = pattern.keywords.some(keyword =>
            lowerMessage.includes(keyword.toLowerCase())
        );

        if (matched) {
            return {
                intent: pattern.id,
                action: pattern.action,
                description: pattern.description,
                matched: true
            };
        }
    }

    return {
        intent: 'unknown',
        action: null,
        description: 'Unknown intent',
        matched: false
    };
}

function handleIntentBasedRouting(text, state, senderName) {
    const intentResult = detectIntent(text);

    if (!intentResult.matched) {
        return null;
    }

    if (intentResult.action === 'credit_card') {
        state.action = 'credit_card';
        state.step = 'awaiting_credit_card_confirm';
        return formatCreditCardIntro();
    }

    switch (intentResult.action) {
        case 'colombia':
            state.action = 'colombia';
            state.step = 'awaiting_operation';
            return formatOperationTypes();

        case 'miami':
            state.action = 'miami';
            state.step = 'awaiting_miami_name';
            return `🌴 *Inversión en Miami*\n\n` +
                   `Excelente elección, ${senderName}! Miami es un mercado muy atractivo.\n\n` +
                   `Para comenzar, ¿cuál es tu *nombre completo*?\n\n` +
                   `📌 *Comandos:*\n` +
                   `• "volver" o *${getNavIds(0).go_back}* → Paso anterior\n` +
                   `• "menú" o *${getNavIds(0).menu}* → Menú principal\n` +
                   `• "cancelar" o *${getNavIds(0).cancel}* → Terminar conversación`;

        case 'sell_rent':
            state.action = 'sell_rent';
            state.step = 'awaiting_sell_rent_name';
            return `🔹 Has seleccionado *Vender o poner en arriendo una propiedad*.\n\n` +
                   `📌 Un asesor se comunicará contigo en las próximas 24 horas.\n` +
                   `📝 Por favor, déjanos tu *nombre completo*.\n\n` +
                   `📌 *Comandos:*\n` +
                   `• "volver" o *${getNavIds(0).go_back}* → Paso anterior\n` +
                   `• "menú" o *${getNavIds(0).menu}* → Menú principal\n` +
                   `• "cancelar" o *${getNavIds(0).cancel}* → Terminar conversación`;

        default:
            return null;
    }
}

module.exports = { detectIntent, handleIntentBasedRouting };