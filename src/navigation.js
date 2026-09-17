const { getNavIds } = require('./data/nav');
const {
    formatMainMenu,
    formatOperationTypes,
    formatCities,
    formatPropertyTypes,
    formatPriceRanges,
    formatMiamiInvestmentTime,
    formatMiamiBudget
} = require('./formatters/menu');
const { formatCreditCardIntro } = require('./formatters/creditCard');
const { formatSellRentOperations } = require('./formatters/sellRent');
const { getAvailableCities } = require('./state');

function getPreviousStep(currentStep) {
    const stepHistory = {
        'main_menu': { prev: null, message: '✅ Ya estás en el menú principal.' },
        'awaiting_operation': { prev: 'main_menu', message: '✅ Volviendo al menú principal.' },
        'awaiting_city': { prev: 'awaiting_operation', message: '✅ Volviendo a selección de operación.' },
        'awaiting_city_name': { prev: 'awaiting_city', message: '✅ Volviendo a selección de ciudad.' },
        'awaiting_property_type': { prev: 'awaiting_city', message: '✅ Volviendo a selección de ciudad.' },
        'awaiting_price_range': { prev: 'awaiting_property_type', message: '✅ Volviendo a selección de tipo.' },
        'browsing_properties': { prev: 'main_menu', message: '✅ Volviendo al menú principal.' },
        'awaiting_miami_name': { prev: 'main_menu', message: '✅ Volviendo al menú principal.' },
        'awaiting_miami_time': { prev: 'awaiting_miami_name', message: '✅ Volviendo al paso anterior.' },
        'awaiting_miami_budget': { prev: 'awaiting_miami_time', message: '✅ Volviendo al plazo de inversión.' },
        'awaiting_credit_card_confirm': { prev: 'main_menu', message: '✅ Volviendo al menú principal.' },
        'awaiting_credit_card_name': { prev: 'awaiting_credit_card_confirm', message: '✅ Volviendo a confirmación.' },
        'awaiting_credit_card_id': { prev: 'awaiting_credit_card_name', message: '✅ Volviendo a nombre.' },
        'awaiting_credit_card_income': { prev: 'awaiting_credit_card_id', message: '✅ Volviendo a identificación.' },
        'awaiting_credit_card_cards': { prev: 'awaiting_credit_card_income', message: '✅ Volviendo a ingreso.' },
        'awaiting_sell_rent_name': { prev: 'main_menu', message: '✅ Volviendo al menú principal.' },
        'awaiting_sell_rent_phone': { prev: 'awaiting_sell_rent_name', message: '✅ Volviendo a nombre.' },
        'awaiting_sell_rent_email': { prev: 'awaiting_sell_rent_phone', message: '✅ Volviendo a teléfono.' },
        'awaiting_sell_rent_property_type': { prev: 'awaiting_sell_rent_email', message: '✅ Volviendo a correo electrónico.' },
        'awaiting_sell_rent_custom_type': { prev: 'awaiting_sell_rent_property_type', message: '✅ Volviendo a tipo de propiedad.' },
        'awaiting_sell_rent_city': { prev: 'awaiting_sell_rent_property_type', message: '✅ Volviendo a tipo de propiedad.' },
        'awaiting_sell_rent_area': { prev: 'awaiting_sell_rent_city', message: '✅ Volviendo a ciudad.' },
        'awaiting_sell_rent_price': { prev: 'awaiting_sell_rent_area', message: '✅ Volviendo a área.' },
        'awaiting_sell_rent_operation': { prev: 'awaiting_sell_rent_price', message: '✅ Volviendo a precio.' },
        'miami_done': { prev: 'main_menu', message: '✅ Volviendo al menú principal.' },
        'search_again': { prev: 'main_menu', message: '✅ Volviendo al menú principal.' }
    };

    return stepHistory[currentStep] || { prev: 'main_menu', message: '✅ Volviendo al menú principal.' };
}

function addTextNavigation(text, optionsLength = 0) {
    const navIds = getNavIds(optionsLength);
    return text + '\n\n📌 *Comandos:*\n' +
           `• "volver" o *${navIds.go_back}* → Paso anterior\n` +
           `• "menú" o *${navIds.menu}* → Menú principal\n` +
           `• "cancelar" o *${navIds.cancel}* → Terminar conversación`;
}

function getStepMessage(step, state) {
    switch (step) {
        case 'main_menu':
            return formatMainMenu(state?.data?.whatsapp_name || 'Usuario');
        case 'awaiting_operation':
            return formatOperationTypes();
        case 'awaiting_city':
            return formatCities(getAvailableCities());
        case 'awaiting_property_type':
            return formatPropertyTypes();
        case 'awaiting_price_range':
            return formatPriceRanges();
        case 'awaiting_miami_time':
            return formatMiamiInvestmentTime();
        case 'awaiting_miami_budget':
            return formatMiamiBudget();
        case 'awaiting_credit_card_confirm':
            return formatCreditCardIntro();
        case 'awaiting_sell_rent_name':
            return addTextNavigation('✅ ¿Cuál es tu *nombre completo*?');
        case 'awaiting_sell_rent_phone':
            return addTextNavigation('✅ ¿Cuál es tu *número de teléfono*? (10 dígitos)');
        case 'awaiting_sell_rent_email':
            return addTextNavigation('✅ ¿Cuál es tu *correo electrónico*?');
        case 'awaiting_sell_rent_custom_type':
            return addTextNavigation('✅ Escribe el tipo de propiedad.');
        case 'awaiting_sell_rent_city':
            return addTextNavigation('📍 ¿En qué *ciudad* se encuentra la propiedad?');
        case 'awaiting_sell_rent_area':
            return addTextNavigation('📐 ¿Cuál es el *área construida* en m²?');
        case 'awaiting_sell_rent_price':
            return addTextNavigation('💰 ¿Cuál es el *precio de venta* o *canon de arriendo*?\n📌 Ejemplo: 350000000');
        case 'awaiting_sell_rent_operation':
            return formatSellRentOperations();
        default:
            return '📋 Continuemos...';
    }
}

function handleUniversalCommand(command) {
    const lowerCommand = command.toLowerCase().trim();
    const COMMANDS = {
        'volver': 'go_back',
        'atrás': 'go_back',
        'back': 'go_back',
        'cancelar': 'cancel',
        'cancel': 'cancel',
        'menú': 'menu',
        'menu': 'menu',
        'inicio': 'menu',
        'start': 'menu',
        'hola': 'menu'
    };

    const action = COMMANDS[lowerCommand];
    if (action) return { action };
    return null;
}

module.exports = {
    getPreviousStep,
    addTextNavigation,
    getStepMessage,
    handleUniversalCommand
};