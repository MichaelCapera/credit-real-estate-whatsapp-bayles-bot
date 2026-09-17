const { getPreviousStep, getStepMessage, addTextNavigation } = require('../navigation');
const { getNavIds } = require('../data/nav');
const {
    formatMainMenu,
    formatOperationTypes,
    formatCities,
    formatPropertyTypes,
    formatPriceRanges
} = require('../formatters/menu');
const {
    userState,
    getAvailableCities,
    setAvailableCities
} = require('../state');
const { callPropertiesAPI, filterProperties, extractCitiesFromProperties } = require('../api');
const { buildPropertyCaption } = require('../formatters/property');
const { MAIN_MENU, OPERATION_TYPES, PROPERTY_TYPES, PRICE_RANGES } = require('../data/menus');
const { handleIntentBasedRouting } = require('../handlers/intent');
const { log } = require('../logger');

// --------------------------------------------
// MAIN MENU
// --------------------------------------------
async function handleMainMenu(sock, sender, senderName, text, state) {
    const intentResponse = handleIntentBasedRouting(text, state, senderName);
    if (intentResponse) return intentResponse;

    const menuOption = parseInt(text);
    const selectedAction = MAIN_MENU.find(m => m.id === menuOption);

    if (!selectedAction) {
        return `❌ Opción no válida.\n\n${formatMainMenu(senderName)}`;
    }

    state.action = selectedAction.action;

    switch (selectedAction.action) {
        case 'colombia':
            state.step = 'awaiting_operation';
            return formatOperationTypes();
        case 'miami':
            state.step = 'awaiting_miami_name';
            return `🌴 *Inversión en Miami*\n\n` +
                   `Excelente elección, ${senderName}! Miami es un mercado muy atractivo.\n\n` +
                   `Para comenzar, ¿cuál es tu *nombre completo*?\n\n` +
                   `📌 *Comandos:*\n` +
                   `• "volver" o *${getNavIds(0).go_back}* → Paso anterior\n` +
                   `• "menú" o *${getNavIds(0).menu}* → Menú principal\n` +
                   `• "cancelar" o *${getNavIds(0).cancel}* → Terminar conversación`;
        case 'credit_card':
            state.step = 'awaiting_credit_card_confirm';
            return require('../formatters/creditCard').formatCreditCardIntro();
        case 'sell_rent':
            state.step = 'awaiting_sell_rent_name';
            return `🔹 Has seleccionado *${selectedAction.label}*.\n\n` +
                   `📌 Un asesor se comunicará contigo en las próximas 24 horas.\n` +
                   `📝 Por favor, déjanos tu *nombre completo*.\n\n` +
                   `📌 *Comandos:*\n` +
                   `• "volver" o *${getNavIds(0).go_back}* → Paso anterior\n` +
                   `• "menú" o *${getNavIds(0).menu}* → Menú principal\n` +
                   `• "cancelar" o *${getNavIds(0).cancel}* → Terminar conversación`;
        default:
            return `❌ Opción no válida.\n\n${formatMainMenu(senderName)}`;
    }
}

// --------------------------------------------
// OPERATION
// --------------------------------------------
async function handleOperation(sock, sender, senderName, text, state) {
    const opOptionsLength = OPERATION_TYPES.length;
    const opNavIds = getNavIds(opOptionsLength);
    const opCmd = parseInt(text);

    if (opCmd === opNavIds.go_back) {
        const prevInfo = getPreviousStep(state.step);
        state.step = prevInfo.prev || 'main_menu';
        if (state.step === 'main_menu') state.filters = {};
        return prevInfo.message + '\n\n' + getStepMessage(state.step, state);
    }
    if (opCmd === opNavIds.menu) {
        state.step = 'main_menu';
        state.filters = {};
        return `📋 *Menú principal*\n\n${formatMainMenu(state.data?.whatsapp_name || 'Usuario')}`;
    }
    if (opCmd === opNavIds.cancel) {
        delete userState[sender];
        return `🗑️ *Conversación cancelada.*\n\n📌 Escribe *hola* para comenzar de nuevo.`;
    }

    const selectedOperation = OPERATION_TYPES.find(op => op.id === opCmd);
    if (selectedOperation) {
        state.filters = state.filters || {};
        state.filters.operation = selectedOperation.label;
        state.step = 'awaiting_city';
        return formatCities(getAvailableCities());
    }
    return `❌ Opción no válida.\n\n${formatOperationTypes()}`;
}

// --------------------------------------------
// CITY
// --------------------------------------------
async function handleCity(sock, sender, senderName, text, state) {
    const displayCities = getAvailableCities().slice(0, 15);
    const totalCityOptions = displayCities.length + 2;
    const cityNavIds = getNavIds(totalCityOptions);
    const cityCmd = parseInt(text);

    if (cityCmd === cityNavIds.go_back) {
        const prevInfo = getPreviousStep(state.step);
        state.step = prevInfo.prev || 'main_menu';
        if (state.step === 'main_menu') state.filters = {};
        return prevInfo.message + '\n\n' + getStepMessage(state.step, state);
    }
    if (cityCmd === cityNavIds.menu) {
        state.step = 'main_menu';
        state.filters = {};
        return `📋 *Menú principal*\n\n${formatMainMenu(state.data?.whatsapp_name || 'Usuario')}`;
    }
    if (cityCmd === cityNavIds.cancel) {
        delete userState[sender];
        return `🗑️ *Conversación cancelada.*\n\n📌 Escribe *hola* para comenzar de nuevo.`;
    }

    if (cityCmd >= 1 && cityCmd <= displayCities.length) {
        state.filters = state.filters || {};
        state.filters.city = displayCities[cityCmd - 1];
        state.step = 'awaiting_property_type';
        return formatPropertyTypes();
    }
    if (cityCmd === displayCities.length + 1) {
        state.step = 'awaiting_city_name';
        return addTextNavigation('✅ Escribe el nombre de la ciudad que buscas.');
    }
    if (cityCmd === displayCities.length + 2 || text.toLowerCase() === 'todas') {
        state.filters = state.filters || {};
        state.filters.city = 'Todas las ciudades';
        state.step = 'awaiting_property_type';
        return formatPropertyTypes();
    }
    return `❌ Opción no válida.\n\n${formatCities(getAvailableCities())}`;
}

// --------------------------------------------
// CITY NAME (custom)
// --------------------------------------------
async function handleCityName(sock, sender, senderName, text, state) {
    if (text.trim().length >= 3) {
        state.filters = state.filters || {};
        state.filters.city = text.trim();
        state.step = 'awaiting_property_type';
        return formatPropertyTypes();
    }
    return `❌ El nombre de la ciudad debe tener al menos 3 caracteres.\n` +
           `Por favor, escribe el nombre de la ciudad.`;
}

// --------------------------------------------
// PROPERTY TYPE
// --------------------------------------------
async function handlePropertyType(sock, sender, senderName, text, state) {
    const typeOptionsLength = PROPERTY_TYPES.length;
    const typeNavIds = getNavIds(typeOptionsLength);
    const typeCmd = parseInt(text);

    if (typeCmd === typeNavIds.go_back) {
        const prevInfo = getPreviousStep(state.step);
        state.step = prevInfo.prev || 'main_menu';
        if (state.step === 'main_menu') state.filters = {};
        return prevInfo.message + '\n\n' + getStepMessage(state.step, state);
    }
    if (typeCmd === typeNavIds.menu) {
        state.step = 'main_menu';
        state.filters = {};
        return `📋 *Menú principal*\n\n${formatMainMenu(state.data?.whatsapp_name || 'Usuario')}`;
    }
    if (typeCmd === typeNavIds.cancel) {
        delete userState[sender];
        return `🗑️ *Conversación cancelada.*\n\n📌 Escribe *hola* para comenzar de nuevo.`;
    }

    const selectedType = PROPERTY_TYPES.find(t => t.id === typeCmd);
    if (selectedType) {
        state.filters = state.filters || {};
        state.filters.property_type = selectedType.label;
        state.step = 'awaiting_price_range';
        return formatPriceRanges();
    }
    return `❌ Opción no válida.\n\n${formatPropertyTypes()}`;
}

// --------------------------------------------
// PRICE RANGE
// --------------------------------------------
async function handlePriceRange(sock, sender, senderName, text, state) {
    const priceOptionsLength = PRICE_RANGES.length;
    const priceNavIds = getNavIds(priceOptionsLength);
    const priceCmd = parseInt(text);

    if (priceCmd === priceNavIds.go_back) {
        const prevInfo = getPreviousStep(state.step);
        state.step = prevInfo.prev || 'main_menu';
        if (state.step === 'main_menu') state.filters = {};
        return prevInfo.message + '\n\n' + getStepMessage(state.step, state);
    }
    if (priceCmd === priceNavIds.menu) {
        state.step = 'main_menu';
        state.filters = {};
        return `📋 *Menú principal*\n\n${formatMainMenu(state.data?.whatsapp_name || 'Usuario')}`;
    }
    if (priceCmd === priceNavIds.cancel) {
        delete userState[sender];
        return `🗑️ *Conversación cancelada.*\n\n📌 Escribe *hola* para comenzar de nuevo.`;
    }

    const selectedPrice = PRICE_RANGES.find(p => p.id === priceCmd);
    if (!selectedPrice) {
        return `❌ Opción no válida.\n\n${formatPriceRanges()}`;
    }

    state.filters = state.filters || {};
    state.filters.price_range = priceCmd;

    await sock.sendMessage(sender, {
        text: `✅ Buscando ${state.filters.property_type || 'propiedades'} en ${state.filters.city || 'Colombia'}...\n⏳ Esto puede tomar unos segundos.`
    });

    const allProperties = await callPropertiesAPI();

    if (!allProperties || allProperties.length === 0) {
        delete userState[sender];
        return `❌ Lo siento, ${senderName}.\n\nNo pude obtener propiedades en este momento.\n📌 Intenta de nuevo más tarde.`;
    }

    const extractedCities = extractCitiesFromProperties(allProperties);
    if (extractedCities.length > 0) setAvailableCities(extractedCities);

    const filtered = filterProperties(allProperties, state.filters);

    if (filtered.length === 0) {
        state.step = 'search_again';
        return `❌ No encontré propiedades con esos criterios, ${senderName}.\n\n` +
               `📌 ¿Quieres intentarlo de nuevo?\n` +
               `1️⃣ Sí, cambiar filtros\n` +
               `2️⃣ No, gracias`;
    }

    state.properties = filtered;
    state.current_index = 0;
    state.step = 'browsing_properties';

    const firstProperty = filtered[0];
    const caption = buildPropertyCaption(firstProperty, 0, filtered.length);

    if (firstProperty.image_url) {
        await sock.sendMessage(sender, {
            image: { url: firstProperty.image_url },
            caption
        });
    } else {
        await sock.sendMessage(sender, { text: caption });
    }
    log(`📸 Primera propiedad mostrada a ${senderName}`, 'info');

    return null; // ya enviamos la imagen
}

module.exports = {
    handleMainMenu,
    handleOperation,
    handleCity,
    handleCityName,
    handlePropertyType,
    handlePriceRange
};