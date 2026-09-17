const { getPreviousStep, getStepMessage, addTextNavigation } = require('../navigation');
const { getNavIds } = require('../data/nav');
const { formatMainMenu, formatMiamiInvestmentTime, formatMiamiBudget, formatOperationTypes } = require('../formatters/menu');
const { MIAMI_INVESTMENT_TIMES, MIAMI_BUDGETS } = require('../data/menus');
const { userState } = require('../state');

async function handleName(sock, sender, senderName, text, state) {
    if (text.trim().length >= 3) {
        state.data = state.data || {};
        state.data.full_name = text.trim();
        state.step = 'awaiting_miami_time';
        return formatMiamiInvestmentTime();
    }
    return `❌ El nombre debe tener al menos 3 caracteres.\nPor favor, ingresa tu *nombre completo*.`;
}

async function handleTime(sock, sender, senderName, text, state) {
    const timeOptionsLength = MIAMI_INVESTMENT_TIMES.length;
    const timeNavIds = getNavIds(timeOptionsLength);
    const timeCmd = parseInt(text);

    if (timeCmd === timeNavIds.go_back) {
        state.step = 'awaiting_miami_name';
        return `✅ Volviendo al paso anterior.\n\n` +
               `🌴 Para comenzar, ¿cuál es tu *nombre completo*?\n\n` +
               `📌 *Comandos:*\n` +
               `• "volver" o *${getNavIds(0).go_back}* → Paso anterior\n` +
               `• "menú" o *${getNavIds(0).menu}* → Menú principal\n` +
               `• "cancelar" o *${getNavIds(0).cancel}* → Terminar conversación`;
    }
    if (timeCmd === timeNavIds.menu) {
        state.step = 'main_menu';
        state.filters = {};
        return `📋 *Menú principal*\n\n${formatMainMenu(state.data?.whatsapp_name || 'Usuario')}`;
    }
    if (timeCmd === timeNavIds.cancel) {
        delete userState[sender];
        return `🗑️ *Conversación cancelada.*\n\n📌 Escribe *hola* para comenzar de nuevo.`;
    }

    const selectedTime = MIAMI_INVESTMENT_TIMES.find(t => t.id === timeCmd);
    if (selectedTime) {
        state.data.investment_time = selectedTime.label;
        state.step = 'awaiting_miami_budget';
        return formatMiamiBudget();
    }
    return `❌ Opción no válida.\n\n${formatMiamiInvestmentTime()}`;
}

async function handleBudget(sock, sender, senderName, text, state) {
    const budgetOptionsLength = MIAMI_BUDGETS.length;
    const budgetNavIds = getNavIds(budgetOptionsLength);
    const budgetCmd = parseInt(text);

    if (budgetCmd === budgetNavIds.go_back) {
        state.step = 'awaiting_miami_time';
        return `✅ Volviendo al paso anterior.\n\n${formatMiamiInvestmentTime()}`;
    }
    if (budgetCmd === budgetNavIds.menu) {
        state.step = 'main_menu';
        state.filters = {};
        return `📋 *Menú principal*\n\n${formatMainMenu(state.data?.whatsapp_name || 'Usuario')}`;
    }
    if (budgetCmd === budgetNavIds.cancel) {
        delete userState[sender];
        return `🗑️ *Conversación cancelada.*\n\n📌 Escribe *hola* para comenzar de nuevo.`;
    }

    const selectedBudget = MIAMI_BUDGETS.find(b => b.id === budgetCmd);
    if (selectedBudget) {
        state.data.budget = selectedBudget.label;
        state.step = 'miami_done';
        return `🌴 *Inversión en Miami - Resumen*\n\n` +
               `👤 Nombre: ${state.data.full_name}\n` +
               `🗓️ Plazo: ${state.data.investment_time}\n` +
               `💰 Presupuesto: ${state.data.budget}\n\n` +
               `📌 Un asesor especializado en Miami se comunicará contigo en las próximas 24 horas.\n\n` +
               `¿Te gustaría ver propiedades en Colombia también?\n` +
               `1️⃣ Sí, buscar propiedades en Colombia\n` +
               `2️⃣ No, gracias`;
    }
    return `❌ Opción no válida.\n\n${formatMiamiBudget()}`;
}

async function handleDone(sock, sender, senderName, text, state) {
    if (text === '1') {
        state.action = 'colombia';
        state.step = 'awaiting_operation';
        return formatOperationTypes();
    }
    delete userState[sender];
    return `✅ ¡Gracias, ${state.data?.full_name || senderName}!\n\n` +
           `📌 Un asesor te contactará pronto.\n👋 ¡Que tengas un excelente día!`;
}

module.exports = { handleName, handleTime, handleBudget, handleDone };