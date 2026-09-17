const { getPreviousStep, getStepMessage } = require('../navigation');
const { getNavIds } = require('../data/nav');
const { formatMainMenu, formatOperationTypes } = require('../formatters/menu');
const { formatCreditCardIntro, formatCreditCardApproved } = require('../formatters/creditCard');
const { userState } = require('../state');

async function handleConfirm(sock, sender, senderName, text, state) {
    const ccOptionsLength = 2;
    const ccNavIds = getNavIds(ccOptionsLength);
    const ccCmd = parseInt(text);

    if (ccCmd === ccNavIds.go_back) {
        const prevInfo = getPreviousStep(state.step);
        state.step = prevInfo.prev || 'main_menu';
        if (state.step === 'main_menu') state.filters = {};
        return prevInfo.message + '\n\n' + getStepMessage(state.step, state);
    }
    if (ccCmd === ccNavIds.menu) {
        state.step = 'main_menu';
        state.filters = {};
        return `📋 *Menú principal*\n\n${formatMainMenu(state.data?.whatsapp_name || 'Usuario')}`;
    }
    if (ccCmd === ccNavIds.cancel) {
        delete userState[sender];
        return `🗑️ *Conversación cancelada.*\n\n📌 Escribe *hola* para comenzar de nuevo.`;
    }

    if (ccCmd === 1) {
        state.step = 'awaiting_credit_card_name';
        return `✅ Excelente, ${senderName}.\n\nPara comenzar, ¿cuál es tu *nombre completo*?`;
    }
    if (ccCmd === 2) {
        state.step = 'credit_card_declined';
        return `✅ Entendido, ${senderName}.\n\n` +
               `¿Te gustaría ver propiedades?\n` +
               `1️⃣ Sí, buscar propiedades\n` +
               `2️⃣ No, gracias`;
    }
    return `❌ Opción no válida.\n\n${formatCreditCardIntro()}`;
}

async function handleDeclined(sock, sender, senderName, text, state) {
    if (text === '1') {
        state.action = 'colombia';
        state.step = 'awaiting_operation';
        return formatOperationTypes();
    }
    delete userState[sender];
    return `✅ ¡Gracias, ${senderName}!\n\n👋 ¡Que tengas un excelente día!`;
}

async function handleName(sock, sender, senderName, text, state) {
    if (text.trim().length >= 3) {
        state.data = state.data || {};
        state.data.full_name = text.trim();
        state.step = 'awaiting_credit_card_id';
        return `✅ Gracias, ${state.data.full_name}.\n\n¿Cuál es tu *número de identificación*?`;
    }
    return `❌ El nombre debe tener al menos 3 caracteres.\nPor favor, ingresa tu *nombre completo*.`;
}

async function handleId(sock, sender, senderName, text, state) {
    if (text.trim().length >= 5) {
        state.data.identification = text.trim();
        state.step = 'awaiting_credit_card_income';
        return `✅ Identificación registrada.\n\n¿Cuál es tu *ingreso mensual* aproximado?\n📌 Ejemplo: 3500000`;
    }
    return `❌ Identificación no válida. Debe tener al menos 5 caracteres.\nPor favor, ingresa tu *número de identificación*.`;
}

async function handleIncome(sock, sender, senderName, text, state) {
    const income = parseInt(text.replace(/[^0-9]/g, ''));
    if (income > 0) {
        state.data.income = income;
        state.step = 'awaiting_credit_card_cards';
        return `✅ Ingreso registrado.\n\n¿Tienes otras tarjetas de crédito activas?\n1️⃣ Sí\n2️⃣ No`;
    }
    return `❌ Ingreso no válido. Por favor, ingresa tu *ingreso mensual*.`;
}

async function handleCards(sock, sender, senderName, text, state) {
    const otherCards = parseInt(text);
    if (otherCards === 1 || otherCards === 2) {
        state.data.has_other_cards = (otherCards === 1);
        const response = formatCreditCardApproved(state.data);
        delete userState[sender];
        return response;
    }
    return `❌ Opción no válida.\n\n¿Tienes otras tarjetas de crédito activas?\n1️⃣ Sí\n2️⃣ No`;
}

module.exports = {
    handleConfirm,
    handleDeclined,
    handleName,
    handleId,
    handleIncome,
    handleCards
};