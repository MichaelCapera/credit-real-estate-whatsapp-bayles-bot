const { formatMenu } = require('../data/nav');
const {
    OPERATION_TYPES,
    PROPERTY_TYPES,
    PRICE_RANGES,
    MIAMI_INVESTMENT_TIMES,
    MIAMI_BUDGETS
} = require('../data/menus');
const { COLOMBIA_CITIES } = require('../state');

function formatMainMenu(senderName) {
    return `👋 *¡Hola ${senderName}!* Soy tu asistente de propiedades y crédito.\n\n` +
           `¿Qué te gustaría hacer hoy?\n\n` +
           `1️⃣ Buscar propiedades en Colombia\n` +
           `2️⃣ Invertir en Miami (USA)\n` +
           `3️⃣ Precalificar para tarjeta de crédito\n` +
           `4️⃣ Vender o poner en arriendo una propiedad\n\n` +
           `⏳ Esta conversación terminará en 5 minutos si no hay actividad.`;
}

function formatOperationTypes() {
    const options = OPERATION_TYPES.map(op => ({ id: op.id, label: op.label }));
    return formatMenu('🤔 *¿Qué tipo de operación buscas?*', options);
}

function formatCities(cities) {
    const displayCities = cities.length > 0 ? cities : COLOMBIA_CITIES;
    const topCities = displayCities.slice(0, 15);
    const options = topCities.map((city, index) => ({
        id: index + 1,
        label: city,
        action: 'select_city'
    }));

    const specialOptions = [
        { id: topCities.length + 1, label: 'Otra ciudad (escríbela)', action: 'other_city' },
        { id: topCities.length + 2, label: 'Todas las ciudades', action: 'all_cities' }
    ];

    const allOptions = [...options, ...specialOptions];
    return formatMenu('📍 *¿En qué ciudad buscas?*', allOptions);
}

function formatPropertyTypes() {
    const options = PROPERTY_TYPES.map(type => ({ id: type.id, label: type.label }));
    return formatMenu('🏠 *¿Qué tipo de propiedad te interesa?*', options);
}

function formatPriceRanges() {
    const options = PRICE_RANGES.map(range => ({ id: range.id, label: range.label }));
    return formatMenu('💰 *¿Cuál es tu rango de precio aproximado?*', options);
}

function formatMiamiInvestmentTime() {
    const options = MIAMI_INVESTMENT_TIMES.map(time => ({ id: time.id, label: time.label }));
    return formatMenu('🗓️ *¿En cuánto tiempo planeas invertir en Miami?*', options);
}

function formatMiamiBudget() {
    const options = MIAMI_BUDGETS.map(budget => ({ id: budget.id, label: budget.label }));
    return formatMenu('💰 *¿Cuál es tu presupuesto aproximado para invertir en Miami?*', options);
}

module.exports = {
    formatMainMenu,
    formatOperationTypes,
    formatCities,
    formatPropertyTypes,
    formatPriceRanges,
    formatMiamiInvestmentTime,
    formatMiamiBudget
};