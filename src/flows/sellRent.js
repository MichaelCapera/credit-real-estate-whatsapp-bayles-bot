const { addTextNavigation } = require('../navigation');
const { getNavIds } = require('../data/nav');
const { formatMainMenu } = require('../formatters/menu');
const {
    formatSellRentPropertyTypes,
    formatSellRentSummary,
    formatSellRentOperations
} = require('../formatters/sellRent');
const { SELL_RENT_PROPERTY_TYPES } = require('../data/menus');
const { userState } = require('../state');

async function handleName(sock, sender, senderName, text, state) {
    if (text.trim().length >= 3) {
        state.data = state.data || {};
        state.data.full_name = text.trim();
        state.data.whatsapp_name = senderName;
        state.step = 'awaiting_sell_rent_phone';
        return addTextNavigation(`✅ Gracias, ${state.data.full_name}.\n\n¿Cuál es tu *número de teléfono*? (10 dígitos)`);
    }
    return `❌ El nombre debe tener al menos 3 caracteres.\nPor favor, ingresa tu *nombre completo*.`;
}

async function handlePhone(sock, sender, senderName, text, state) {
    const cleanPhone = text.replace(/[^0-9]/g, '');
    if (cleanPhone.length === 10) {
        state.data.phone = cleanPhone;
        state.step = 'awaiting_sell_rent_email';
        return addTextNavigation(`✅ Perfecto, ${state.data.full_name}.\n\n¿Cuál es tu *correo electrónico*?`);
    }
    return `❌ El número debe tener 10 dígitos (ej: 3001234567).\nPor favor, inténtalo de nuevo.`;
}

async function handleEmail(sock, sender, senderName, text, state) {
    if (text.includes('@') && text.includes('.')) {
        state.data.email = text.trim();
        state.step = 'awaiting_sell_rent_property_type';
        return formatSellRentPropertyTypes();
    }
    return `❌ El correo no es válido. Debe contener '@' y '.'\nPor favor, ingresa tu *correo electrónico*.`;
}

async function handlePropertyType(sock, sender, senderName, text, state) {
    const srTypeOptionsLength = SELL_RENT_PROPERTY_TYPES.length;
    const srTypeNavIds = getNavIds(srTypeOptionsLength);
    const srTypeCmd = parseInt(text);

    if (srTypeCmd === srTypeNavIds.go_back) {
        state.step = 'awaiting_sell_rent_email';
        return addTextNavigation(`✅ Volviendo al paso anterior.\n\n¿Cuál es tu *correo electrónico*?`);
    }
    if (srTypeCmd === srTypeNavIds.menu) {
        state.step = 'main_menu';
        state.filters = {};
        return `📋 *Menú principal*\n\n${formatMainMenu(state.data?.whatsapp_name || 'Usuario')}`;
    }
    if (srTypeCmd === srTypeNavIds.cancel) {
        delete userState[sender];
        return `🗑️ *Conversación cancelada.*\n\n📌 Escribe *hola* para comenzar de nuevo.`;
    }

    const selectedSrType = SELL_RENT_PROPERTY_TYPES.find(t => t.id === srTypeCmd);
    if (selectedSrType) {
        state.data.property_type = selectedSrType.label;
        if (selectedSrType.label === 'Otro (escríbelo)') {
            state.step = 'awaiting_sell_rent_custom_type';
            return addTextNavigation('✅ Escribe el tipo de propiedad.');
        }
        state.step = 'awaiting_sell_rent_city';
        return addTextNavigation('📍 ¿En qué *ciudad* se encuentra la propiedad?');
    }
    return `❌ Opción no válida.\n\n${formatSellRentPropertyTypes()}`;
}

async function handleCustomType(sock, sender, senderName, text, state) {
    if (text.trim().length >= 3) {
        state.data.property_type = text.trim();
        state.step = 'awaiting_sell_rent_city';
        return addTextNavigation('📍 ¿En qué *ciudad* se encuentra la propiedad?');
    }
    return `❌ El tipo de propiedad debe tener al menos 3 caracteres.\nPor favor, escribe el tipo de propiedad.`;
}

async function handleCity(sock, sender, senderName, text, state) {
    if (text.trim().length >= 3) {
        state.data.city = text.trim();
        state.step = 'awaiting_sell_rent_area';
        return addTextNavigation('📐 ¿Cuál es el *área construida* en m²?');
    }
    return `❌ La ciudad debe tener al menos 3 caracteres.\nPor favor, escribe la ciudad.`;
}

async function handleArea(sock, sender, senderName, text, state) {
    const area = parseInt(text.replace(/[^0-9]/g, ''));
    if (area > 0) {
        state.data.area = area;
        state.step = 'awaiting_sell_rent_price';
        return addTextNavigation(`💰 ¿Cuál es el *precio de venta* o *canon de arriendo*?\n📌 Ejemplo: 350000000`);
    }
    return `❌ Área no válida. Por favor, ingresa el *área construida* en m².`;
}

async function handlePrice(sock, sender, senderName, text, state) {
    const price = parseInt(text.replace(/[^0-9]/g, ''));
    if (price > 0) {
        state.data.price = price;
        state.step = 'awaiting_sell_rent_operation';
        return formatSellRentOperations();
    }
    return `❌ Precio no válido. Por favor, ingresa el *precio* o *canon de arriendo*.`;
}

async function handleOperation(sock, sender, senderName, text, state) {
    const srOpOptionsLength = 3;
    const srOpNavIds = getNavIds(srOpOptionsLength);
    const srOpCmd = parseInt(text);

    if (srOpCmd === srOpNavIds.go_back) {
        state.step = 'awaiting_sell_rent_price';
        return addTextNavigation(`✅ Volviendo al paso anterior.\n\n💰 ¿Cuál es el *precio de venta* o *canon de arriendo*?\n📌 Ejemplo: 350000000`);
    }
    if (srOpCmd === srOpNavIds.menu) {
        state.step = 'main_menu';
        state.filters = {};
        return `📋 *Menú principal*\n\n${formatMainMenu(state.data?.whatsapp_name || 'Usuario')}`;
    }
    if (srOpCmd === srOpNavIds.cancel) {
        delete userState[sender];
        return `🗑️ *Conversación cancelada.*\n\n📌 Escribe *hola* para comenzar de nuevo.`;
    }

    const options = [
        { id: 1, label: 'Vender' },
        { id: 2, label: 'Arrendar' },
        { id: 3, label: 'Ambos' }
    ];
    const selectedSrOp = options.find(op => op.id === srOpCmd);

    if (selectedSrOp) {
        state.data.operation = selectedSrOp.label;
        const response = formatSellRentSummary(state.data);
        delete userState[sender];
        return response;
    }
    return `❌ Opción no válida.\n\n${formatSellRentOperations()}`;
}

module.exports = {
    handleName,
    handlePhone,
    handleEmail,
    handlePropertyType,
    handleCustomType,
    handleCity,
    handleArea,
    handlePrice,
    handleOperation
};