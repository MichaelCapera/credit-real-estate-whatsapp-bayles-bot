// ============================================
// 📋 CONFIGURATION
// ============================================

const BOT_NUMBER = '573212769477'; // ⚠️ CHANGE THIS TO YOUR NUMBER
const SESSION_FOLDER = 'auth_info_baileys';
const LOGS_FOLDER = 'logs';
const RECONNECT_DELAY = 3000;
const SESSION_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes
const ENABLE_LOGS = true;

// ============================================
// 📦 DEPENDENCIES
// ============================================

const { default: makeWASocket, DisconnectReason, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const path = require('path');

// ============================================
// 🧠 USER STATE & TIMERS
// ============================================

const userState = {};
const userTimers = {};

// ============================================
// 📋 COLOMBIA CITIES DATABASE
// ============================================

const COLOMBIA_CITIES = [
    'Bogotá', 'Medellín', 'Cali', 'Barranquilla', 'Cartagena',
    'Cúcuta', 'Bucaramanga', 'Pereira', 'Manizales', 'Ibagué',
    'Neiva', 'Santa Marta', 'Villavicencio', 'Sincelejo', 'Valledupar',
    'Montería', 'Riohacha', 'Quibdó', 'Arauca', 'Yopal',
    'Soacha', 'Chía', 'Cajicá', 'Zipaquirá', 'Mosquera',
    'Buga', 'Tuluá', 'Palmira', 'Yumbo', 'Florida',
    'Armenia', 'Dosquebradas', 'La Dorada', 'Chinchiná',
    'Sabaneta', 'Envigado', 'Itagüí', 'Bello', 'Copacabana',
    'Floridablanca', 'Girón', 'Piedecuesta', 'Barrancabermeja',
    'Tunja', 'Sogamoso', 'Duitama', 'Paipa', 'Villa de Leyva',
    'Fusagasugá', 'Silvania', 'Campoalegre', 'Rivera', 'Palermo',
    'Garzón', 'Pitalito', 'Andes', 'Jardín', 'Santa Fe de Antioquia'
];

let AVAILABLE_CITIES = [...COLOMBIA_CITIES];

// ============================================
// 📋 MENU OPTIONS
// ============================================

const MAIN_MENU = [
    { id: 1, label: 'Buscar propiedades en Colombia', action: 'colombia' },
    { id: 2, label: 'Invertir en Miami (USA)', action: 'miami' },
    { id: 3, label: 'Precalificar para tarjeta de crédito', action: 'credit_card' },
    { id: 4, label: 'Vender o poner en arriendo una propiedad', action: 'sell_rent' }
];

const OPERATION_TYPES = [
    { id: 1, label: 'Comprar', keyword: 'VENTA' },
    { id: 2, label: 'Arrendar', keyword: 'ARRIENDO' },
    { id: 3, label: 'Ambos (compra y arriendo)', keyword: null }
];

const PROPERTY_TYPES = [
    { id: 1, label: 'Apartamento' },
    { id: 2, label: 'Casa' },
    { id: 3, label: 'Casa Campestre' },
    { id: 4, label: 'Lote / Terreno' },
    { id: 5, label: 'Finca' },
    { id: 6, label: 'Oficina' },
    { id: 7, label: 'Todos los tipos' }
];

const PRICE_RANGES = [
    { id: 1, label: 'Menos de $200M', min: 0, max: 200000000 },
    { id: 2, label: '$200M - $400M', min: 200000000, max: 400000000 },
    { id: 3, label: '$400M - $600M', min: 400000000, max: 600000000 },
    { id: 4, label: '$600M - $1.000M', min: 600000000, max: 1000000000 },
    { id: 5, label: 'Más de $1.000M', min: 1000000000, max: Infinity },
    { id: 6, label: 'Sin límite', min: 0, max: Infinity }
];

const MIAMI_INVESTMENT_TIMES = [
    { id: 1, label: 'Menos de 6 meses', months: 6 },
    { id: 2, label: '6 meses - 1 año', months: 12 },
    { id: 3, label: '1 - 2 años', months: 24 },
    { id: 4, label: 'Más de 2 años', months: 36 }
];

const MIAMI_BUDGETS = [
    { id: 1, label: 'Menos de $100,000 USD' },
    { id: 2, label: '$100,000 - $300,000 USD' },
    { id: 3, label: '$300,000 - $500,000 USD' },
    { id: 4, label: '$500,000 - $1,000,000 USD' },
    { id: 5, label: 'Más de $1,000,000 USD' },
    { id: 6, label: 'Sin límite' }
];

// ============================================
// 📋 SELL/RENT PROPERTY OPTIONS
// ============================================

const SELL_RENT_PROPERTY_TYPES = [
    { id: 1, label: 'Apartamento' },
    { id: 2, label: 'Casa' },
    { id: 3, label: 'Casa Campestre' },
    { id: 4, label: 'Lote / Terreno' },
    { id: 5, label: 'Finca' },
    { id: 6, label: 'Oficina' },
    { id: 7, label: 'Otro (escríbelo)' }
];

// ============================================
// 📋 NAVIGATION HELPERS (Dynamic IDs)
// ============================================

const NAV_LABELS = [
    { action: 'go_back', label: 'Volver atrás' },
    { action: 'menu', label: 'Menú principal' },
    { action: 'cancel', label: 'Cancelar' }
];

function addNavigationOptions(options) {
    const result = [...options];
    const startId = options.length + 1;
    
    NAV_LABELS.forEach((nav, index) => {
        result.push({
            id: startId + index,
            label: nav.label,
            action: nav.action
        });
    });
    
    return result;
}

function getNavIds(optionsLength) {
    return {
        go_back: optionsLength + 1,
        menu: optionsLength + 2,
        cancel: optionsLength + 3
    };
}

function formatMenu(title, options, showTimeout = true) {
    const allOptions = addNavigationOptions(options);
    let message = title + '\n\n';
    
    allOptions.forEach(opt => {
        message += `*${opt.id}.* ${opt.label}\n`;
    });
    
    if (showTimeout) {
        message += `\n⏳ Esta conversación terminará en 5 minutos si no hay actividad.`;
    }
    
    return message;
}

// ============================================
// 🛠️ UTILITIES
// ============================================

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

function formatPrice(price) {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(price);
}

function isVoiceMessage(msg) {
    return !!(msg.message?.audioMessage?.ptt === true);
}

function getVoiceDuration(msg) {
    return msg.message?.audioMessage?.seconds || 0;
}

// ============================================
// ⏰ TIMEOUT FUNCTIONS
// ============================================

function resetUserTimer(sender, sock) {
    if (userTimers[sender]) {
        clearTimeout(userTimers[sender]);
        delete userTimers[sender];
    }
    
    userTimers[sender] = setTimeout(async () => {
        if (userState[sender]) {
            try {
                const name = userState[sender]?.data?.full_name || userState[sender]?.data?.whatsapp_name || 'Usuario';
                await sock.sendMessage(sender, {
                    text: `⏰ *Conversación finalizada por inactividad.*\n\n` +
                          `📌 ${name}, si necesitas ayuda, escribe *hola* para comenzar de nuevo.\n` +
                          `👋 ¡Que tengas un excelente día!`
                });
            } catch (error) {
                log(`Error sending timeout message: ${error.message}`, 'error');
            }
            delete userState[sender];
            delete userTimers[sender];
        }
    }, SESSION_TIMEOUT_MS);
}

// ============================================
// 📋 MENU FORMATTING FUNCTIONS
// ============================================

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

// ============================================
// 📋 FUNCIONES PARA MOSTRAR PROPIEDADES CON IMÁGENES
// ============================================

function buildPropertyCaption(property, index, total) {
    const priceFormatted = formatPrice(property.price);
    const navIds = getNavIds(6); // 6 opciones de navegación de propiedades
    
    let caption = `🔍 *Propiedad ${index + 1} de ${total}*\n\n`;
    caption += `🏠 ${property.title}\n`;
    caption += `📍 ${property.description || 'Ubicación no especificada'}\n`;
    caption += `📐 Área: ${property.area_built || 'No especificada'}\n`;
    caption += `💰 ${priceFormatted}\n\n`;
    caption += `📌 *Comandos:*\n`;
    caption += `1️⃣ Siguiente propiedad\n`;
    caption += `2️⃣ Propiedad anterior\n`;
    caption += `3️⃣ Ver más información\n`;
    caption += `4️⃣ Ver ubicación en mapa\n`;
    caption += `5️⃣ Ver enlace de la propiedad\n`;
    caption += `6️⃣ Salir de búsqueda\n`;
    caption += `${navIds.go_back}️⃣ Volver atrás\n`;
    caption += `${navIds.menu}️⃣ Menú principal\n`;
    caption += `${navIds.cancel}️⃣ Cancelar`;
    
    return caption;
}

async function sendPropertyWithImage(sock, sender, property, index, total) {
    const caption = buildPropertyCaption(property, index, total);
    
    try {
        // Si la propiedad tiene imagen, enviar con imagen
        if (property.image_url) {
            await sock.sendMessage(sender, {
                image: { url: property.image_url },
                caption: caption
            });
            log(`📸 Imagen enviada para propiedad ${index + 1}`, 'info');
        } else {
            // Si no tiene imagen, enviar solo texto
            await sock.sendMessage(sender, { text: caption });
            log(`📝 Texto enviado para propiedad ${index + 1} (sin imagen)`, 'info');
        }
    } catch (error) {
        log(`Error enviando imagen: ${error.message}`, 'error');
        // Fallback: enviar solo texto
        await sock.sendMessage(sender, { text: caption });
    }
}

function formatPropertyDetailText(property) {
    const priceFormatted = formatPrice(property.price);
    const navIds = getNavIds(5); // 5 opciones en detalle
    
    let message = `📋 *Detalles completos*\n\n`;
    message += `🏠 ${property.title}\n`;
    message += `📍 ${property.description || 'Ubicación no especificada'}\n`;
    message += `📐 Área: ${property.area_built || 'No especificada'}\n`;
    message += `💰 ${priceFormatted}\n`;
    message += `🆔 ID: ${property.id || 'N/A'}\n\n`;
    message += `🔗 *Link:*\n${property.target_url || 'No disponible'}\n\n`;
    message += `📌 *Comandos:*\n`;
    message += `1️⃣ Siguiente propiedad\n`;
    message += `2️⃣ Propiedad anterior\n`;
    message += `3️⃣ Ver ubicación en mapa\n`;
    message += `4️⃣ Ver enlace de la propiedad\n`;
    message += `5️⃣ Salir de búsqueda\n`;
    message += `${navIds.go_back}️⃣ Volver atrás\n`;
    message += `${navIds.menu}️⃣ Menú principal\n`;
    message += `${navIds.cancel}️⃣ Cancelar`;
    
    return message;
}

function formatLocationText(property) {
    const location = property.description || 'Ubicación no especificada';
    const searchQuery = encodeURIComponent(location);
    const navIds = getNavIds(5);
    
    let message = `📍 *Ubicación*\n\n`;
    message += `🏠 ${property.title}\n`;
    message += `📍 ${location}\n\n`;
    message += `🌐 *Google Maps:*\n`;
    message += `https://www.google.com/maps/search/?api=1&query=${searchQuery}\n\n`;
    message += `📌 *Comandos:*\n`;
    message += `1️⃣ Siguiente propiedad\n`;
    message += `2️⃣ Propiedad anterior\n`;
    message += `3️⃣ Ver más información\n`;
    message += `4️⃣ Ver enlace de la propiedad\n`;
    message += `5️⃣ Salir de búsqueda\n`;
    message += `${navIds.go_back}️⃣ Volver atrás\n`;
    message += `${navIds.menu}️⃣ Menú principal\n`;
    message += `${navIds.cancel}️⃣ Cancelar`;
    
    return message;
}

// ============================================
// 📋 SELL/RENT FORMATTING FUNCTIONS
// ============================================

function formatSellRentPropertyTypes() {
    const options = SELL_RENT_PROPERTY_TYPES.map(type => ({ 
        id: type.id, 
        label: type.label 
    }));
    return formatMenu('🏠 *¿Qué tipo de propiedad deseas vender o arrendar?*', options);
}

function formatSellRentSummary(data) {
    return `📋 *Resumen de tu propiedad*\n\n` +
           `👤 Nombre: ${data.full_name}\n` +
           `📱 Teléfono: ${data.phone}\n` +
           `📧 Correo: ${data.email}\n` +
           `🏠 Tipo: ${data.property_type}\n` +
           `📍 Ciudad: ${data.city}\n` +
           `📐 Área: ${data.area} m²\n` +
           `💰 Precio: ${formatPrice(data.price)}\n` +
           `📌 Operación: ${data.operation}\n\n` +
           `📌 Un asesor especializado se comunicará contigo en las próximas 24 horas.\n` +
           `👋 ¡Gracias por confiar en nosotros!`;
}

function formatSellRentOperations() {
    const options = [
        { id: 1, label: 'Vender' },
        { id: 2, label: 'Arrendar' },
        { id: 3, label: 'Ambos' }
    ];
    return formatMenu('📌 *¿Deseas vender o arrendar la propiedad?*', options);
}

// ============================================
// 🔧 FUNCIÓN PARA AGREGAR NAVEGACIÓN A PASOS DE TEXTO
// ============================================

function addTextNavigation(text, optionsLength = 0) {
    const navIds = getNavIds(optionsLength);
    return text + '\n\n📌 *Comandos:*\n' +
           `• "volver" o *${navIds.go_back}* → Paso anterior\n` +
           `• "menú" o *${navIds.menu}* → Menú principal\n` +
           `• "cancelar" o *${navIds.cancel}* → Terminar conversación`;
}

// ============================================
// 📋 CREDIT CARD FORMATTING FUNCTIONS
// ============================================

function formatCreditCardIntro() {
    const options = [
        { id: 1, label: 'Sí, quiero precalificar', action: 'yes' },
        { id: 2, label: 'No, gracias', action: 'no' }
    ];
    
    return formatMenu(
        `💳 *Precalificación Tarjeta de Crédito*\n\n` +
        `Te ayudaré a conocer si puedes acceder a una tarjeta de crédito.\n` +
        `Solo necesito algunos datos básicos para darte una respuesta rápida.\n\n` +
        `📌 Este proceso toma menos de 2 minutos.\n\n` +
        `¿Quieres continuar?`,
        options
    );
}

function formatCreditCardApproved(data) {
    const incomeFormatted = formatPrice(data.income);
    const creditLimit = data.income * 1.5;
    const creditLimitFormatted = formatPrice(creditLimit);
    
    return `🎉 *¡Precalificación aprobada!*\n\n` +
           `📋 *Datos registrados:*\n` +
           `👤 Nombre: ${data.full_name}\n` +
           `🆔 Identificación: ${data.identification}\n` +
           `💰 Ingreso: ${incomeFormatted}\n` +
           `💳 Otras tarjetas: ${data.has_other_cards ? 'Sí' : 'No'}\n\n` +
           `💳 Puedes acceder a una tarjeta con cupo de hasta *${creditLimitFormatted}*\n\n` +
           `📌 Un asesor se comunicará contigo en las próximas 24 horas.\n\n` +
           `¿Te gustaría ver propiedades también? Responde *"propiedades"*.`;
}

// ============================================
// 🔙 STEP NAVIGATION
// ============================================

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

function getStepMessage(step, state) {
    switch (step) {
        case 'main_menu':
            return formatMainMenu(state?.data?.whatsapp_name || 'Usuario');
        case 'awaiting_operation':
            return formatOperationTypes();
        case 'awaiting_city':
            return formatCities(AVAILABLE_CITIES);
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

// ============================================
// 🔍 COMMAND PARSER
// ============================================

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

// ============================================
// 🌐 API FUNCTIONS
// ============================================

async function callPropertiesAPI() {
    try {
        const API_URL = 'https://8xuawsbnzg.execute-api.us-east-1.amazonaws.com/dev/data-properties';
        
        const response = await fetch(API_URL, {
            method: 'GET',
            headers: {
                'accept': 'application/json, text/plain, */*',
                'content-type': 'application/json',
                'user-agent': 'WhatsApp-Bot/1.0'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP Error: ${response.status}`);
        }

        const data = await response.json();
        log(`📥 API returned ${data.length} properties`, 'info');
        return data;
    } catch (error) {
        log(`Error calling API: ${error.message}`, 'error');
        return null;
    }
}

function filterProperties(properties, filters) {
    if (!properties || properties.length === 0) return [];
    
    return properties.filter(prop => {
        // Filter by operation (buy/rent)
        if (filters.operation && filters.operation !== 'Ambos (compra y arriendo)') {
            const operationKeyword = OPERATION_TYPES.find(op => op.label === filters.operation)?.keyword;
            if (operationKeyword) {
                const title = (prop.title || '').toUpperCase();
                const desc = (prop.description || '').toUpperCase();
                const combined = title + ' ' + desc;
                if (!combined.includes(operationKeyword)) {
                    return false;
                }
            }
        }
        
        // Filter by city
        if (filters.city && filters.city !== 'Todas las ciudades') {
            const cityMatch = prop.description?.toLowerCase().includes(filters.city.toLowerCase());
            if (!cityMatch) return false;
        }
        
        // Filter by property type
        if (filters.property_type && filters.property_type !== 'Todos los tipos') {
            const typeMatch = prop.property_type?.toLowerCase() === filters.property_type.toLowerCase();
            if (!typeMatch) return false;
        }
        
        // Filter by price range
        if (filters.price_range) {
            const range = PRICE_RANGES.find(r => r.id === filters.price_range);
            if (range) {
                const price = prop.price || 0;
                if (price < range.min || price > range.max) return false;
            }
        }
        
        return true;
    });
}

function extractCitiesFromProperties(properties) {
    if (!properties || properties.length === 0) return COLOMBIA_CITIES;
    
    const cities = new Set();
    
    properties.forEach(prop => {
        const text = (prop.description || '') + ' ' + (prop.title || '');
        COLOMBIA_CITIES.forEach(city => {
            if (text.toLowerCase().includes(city.toLowerCase())) {
                cities.add(city);
            }
        });
    });
    
    const result = Array.from(cities).sort();
    return result.length > 0 ? result : COLOMBIA_CITIES;
}

// ============================================
// 🔌 MAIN WHATSAPP CONNECTION
// ============================================

// ============================================
// 👥 GROUP CONFIGURATION
// ============================================

const GROUP_CONFIG = {
    // 'ignore' | 'mention' | 'allowed' | 'all'
    mode: 'mention',
    // Lista de grupos permitidos (solo si mode = 'allowed')
    allowedGroups: [],
    // Palabras clave para activar el bot en grupos
    triggerWords: ['@bot', '!bot', 'asistente', 'ayuda', 'hola bot']
};

// ============================================
// 👥 GROUP MESSAGE HANDLER
// ============================================

async function handleGroupMessage(sock, msg, sender, senderName, botJid) {
    try {
        const isGroup = sender.endsWith('@g.us');
        if (!isGroup) return null;
        
        // Extract text from message
        const text = msg.message.conversation || 
                     msg.message?.extendedTextMessage?.text || '';
        
        // Check if bot was mentioned
        const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
        const isMentioned = mentioned.includes(botJid);
        
        // Check for trigger words
        const hasTrigger = GROUP_CONFIG.triggerWords.some(word => 
            text.toLowerCase().includes(word.toLowerCase())
        );
        
        // Determine if should respond
        let shouldRespond = false;
        
        switch (GROUP_CONFIG.mode) {
            case 'ignore':
                shouldRespond = false;
                break;
            case 'mention':
                shouldRespond = isMentioned || hasTrigger;
                break;
            case 'allowed':
                shouldRespond = GROUP_CONFIG.allowedGroups.includes(sender);
                break;
            case 'all':
                shouldRespond = true;
                break;
            default:
                shouldRespond = false;
        }
        
        if (!shouldRespond) {
            log(`📩 Group message from ${sender} ignored`, 'debug');
            return { shouldProcess: false };
        }
        
        // Send activation message
        await sock.sendMessage(sender, {
            text: `👋 *¡Hola ${senderName}!* Me activaste en el grupo.\n\n` +
                  `📌 Para una atención personalizada, escríbeme al *privado*.\n` +
                  `📌 O puedes continuar aquí usando *!bot ayuda* para ver comandos.`,
            mentions: [sender]
        });
        
        log(`🤖 Responded in group ${sender} by mention/trigger`, 'info');
        return { shouldProcess: false };
        
    } catch (error) {
        log(`Error in handleGroupMessage: ${error.message}`, 'error');
        return { shouldProcess: false };
    }
}

async function connectToWhatsApp() {
    log('🚀 Starting WhatsApp Bot...', 'info');
    ensureFolders();

    try {
        const { state, saveCreds } = await useMultiFileAuthState(SESSION_FOLDER);
        log('Authentication state loaded', 'debug');

        const sock = makeWASocket({
            auth: state,
        });

        // Pairing Code
        // if (BOT_NUMBER && BOT_NUMBER !== '573001234567') {
        //     try {
        //         const code = await sock.requestPairingCode(BOT_NUMBER);
        //         log(`🔑 Pairing code: ${code}`, 'success');
        //     } catch (error) {
        //         log('⚠️ Using QR as fallback', 'warn');
        //     }
        // }

        // Connection events
        sock.ev.on('connection.update', (update) => {
            const { connection, lastDisconnect, qr } = update;

            if (qr) {
                log('📱 Scan this QR:', 'info');
                qrcode.generate(qr, { small: true });
            }

            if (connection === 'close') {
                const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
                if (shouldReconnect) {
                    log('🔄 Reconnecting...', 'warn');
                    setTimeout(() => connectToWhatsApp(), RECONNECT_DELAY);
                }
            } else if (connection === 'open') {
                log('✅ Bot connected successfully!', 'success');
            }
        });

        sock.ev.on('creds.update', saveCreds);

        // ============================================
        // 💬 MESSAGE PROCESSING
        // ============================================

        sock.ev.on('messages.upsert', async ({ messages }) => {
            try {
                const msg = messages[0];
                if (!msg.message || msg.key.fromMe) return;

                const sender = msg.key.remoteJid;
                const senderName = msg.pushName || 'Usuario';

                 const botJid = sock.user.id.split(':')[0] + '@s.whatsapp.net';

                // ============================================
                // 👥 GROUP MESSAGE HANDLING
                // ============================================

                if (sender.endsWith('@g.us')) {
                    const groupResult = await handleGroupMessage(sock, msg, sender, senderName, botJid);
                    if (groupResult && groupResult.shouldProcess === false) {
                        return; // Message was handled by group handler
                    }
                }

                // ============================================
                // 🎤 VOICE MESSAGE HANDLING
                // ============================================

                if (isVoiceMessage(msg)) {
                    const duration = getVoiceDuration(msg);
                    log(`🎤 Voice message from ${senderName} (${duration}s)`, 'info');

                    await sock.sendMessage(sender, {
                        text: `🎤 *¡Hola ${senderName}!* Recibí tu mensaje de voz.\n\n` +
                              `😊 Para poder ayudarte mejor, te recomiendo escribir tu consulta.\n` +
                              `Así puedo procesarla más rápido y darte una respuesta precisa.\n\n` +
                              `📌 ¿Qué te gustaría hacer hoy?\n\n` +
                              `1️⃣ Buscar propiedades en Colombia\n` +
                              `2️⃣ Invertir en Miami (USA)\n` +
                              `3️⃣ Precalificar para tarjeta de crédito\n` +
                              `4️⃣ Vender o poner en arriendo una propiedad\n\n` +
                              `⏳ Esta conversación terminará en 5 minutos si no hay actividad.`
                    });

                    if (!userState[sender]) {
                        userState[sender] = {
                            step: 'main_menu',
                            data: { whatsapp_name: senderName }
                        };
                        resetUserTimer(sender, sock);
                    }
                    return;
                }

                // ============================================
                // 📝 TEXT MESSAGE PROCESSING
                // ============================================

                const text = msg.message.conversation || '';
                if (!text) return;

                log(`📩 ${senderName}: ${text}`, 'info');

                // ============================================
                // 🧠 INITIALIZE STATE IF NOT EXISTS
                // ============================================

                if (!userState[sender]) {
                    userState[sender] = {
                        step: 'main_menu',
                        data: { whatsapp_name: senderName }
                    };
                    resetUserTimer(sender, sock);

                    const welcomeMessage = formatMainMenu(senderName);
                    await sock.sendMessage(sender, { text: welcomeMessage });
                    log(`📝 Main menu shown to ${senderName}`, 'info');
                    return;
                }

                // ============================================
                // 🔄 RESET TIMER ON EACH INTERACTION
                // ============================================

                resetUserTimer(sender, sock);

                const state = userState[sender];
                let response = '';

                // ============================================
                // 🧠 UNIVERSAL COMMANDS (text-based)
                // ============================================

                const universalResult = handleUniversalCommand(text);

                if (universalResult) {
                    if (universalResult.action === 'cancel') {
                        delete userState[sender];
                        if (userTimers[sender]) {
                            clearTimeout(userTimers[sender]);
                            delete userTimers[sender];
                        }
                        response = `🗑️ *Conversación cancelada.*\n\n` +
                                  `📌 Si necesitas ayuda, escribe *hola* para comenzar de nuevo.\n` +
                                  `👋 ¡Que tengas un excelente día!`;
                    } else if (universalResult.action === 'menu') {
                        state.step = 'main_menu';
                        state.filters = {};
                        response = `📋 *Menú principal*\n\n${formatMainMenu(state.data?.whatsapp_name || 'Usuario')}`;
                    } else if (universalResult.action === 'go_back') {
                        const prevInfo = getPreviousStep(state.step);
                        if (prevInfo.prev) {
                            state.step = prevInfo.prev;
                            if (state.step === 'main_menu') {
                                state.filters = {};
                            }
                            response = prevInfo.message + '\n\n' + getStepMessage(state.step, state);
                        } else {
                            response = prevInfo.message;
                        }
                    }

                    if (response) {
                        await sock.sendMessage(sender, { text: response });
                        log(`📤 Response sent to ${senderName}`, 'info');
                    }
                    return;
                }

                // ============================================
                // 🧠 MAIN STATE MACHINE
                // ============================================

                switch (state.step) {
                    // ============================================
                    // 📋 MAIN MENU
                    // ============================================

                    case 'main_menu':
                        const menuOption = parseInt(text);
                        const selectedAction = MAIN_MENU.find(m => m.id === menuOption);

                        if (!selectedAction) {
                            response = `❌ Opción no válida.\n\n${formatMainMenu(senderName)}`;
                            break;
                        }

                        state.action = selectedAction.action;

                        switch (selectedAction.action) {
                            case 'colombia':
                                state.step = 'awaiting_operation';
                                response = formatOperationTypes();
                                break;
                            case 'miami':
                                state.step = 'awaiting_miami_name';
                                response = `🌴 *Inversión en Miami*\n\n` +
                                           `Excelente elección, ${senderName}! Miami es un mercado muy atractivo.\n\n` +
                                           `Para comenzar, ¿cuál es tu *nombre completo*?\n\n` +
                                           `📌 *Comandos:*\n` +
                                           `• "volver" o *${getNavIds(0).go_back}* → Paso anterior\n` +
                                           `• "menú" o *${getNavIds(0).menu}* → Menú principal\n` +
                                           `• "cancelar" o *${getNavIds(0).cancel}* → Terminar conversación`;
                                break;
                            case 'credit_card':
                                state.step = 'awaiting_credit_card_confirm';
                                response = formatCreditCardIntro();
                                break;
                            case 'sell_rent':
                                state.step = 'awaiting_sell_rent_name';
                                response = `🔹 Has seleccionado *${selectedAction.label}*.\n\n` +
                                           `📌 Un asesor se comunicará contigo en las próximas 24 horas.\n` +
                                           `📝 Por favor, déjanos tu *nombre completo*.\n\n` +
                                           `📌 *Comandos:*\n` +
                                           `• "volver" o *${getNavIds(0).go_back}* → Paso anterior\n` +
                                           `• "menú" o *${getNavIds(0).menu}* → Menú principal\n` +
                                           `• "cancelar" o *${getNavIds(0).cancel}* → Terminar conversación`;
                                break;
                            default:
                                response = `❌ Opción no válida.\n\n${formatMainMenu(senderName)}`;
                        }
                        break;

                    // ============================================
                    // 🏙️ OPERATION SELECTION
                    // ============================================

                    case 'awaiting_operation':
                        const opOptionsLength = OPERATION_TYPES.length;
                        const opNavIds = getNavIds(opOptionsLength);
                        const opCmd = parseInt(text);

                        if (opCmd === opNavIds.go_back) {
                            const prevInfo = getPreviousStep(state.step);
                            state.step = prevInfo.prev || 'main_menu';
                            if (state.step === 'main_menu') {
                                state.filters = {};
                            }
                            response = prevInfo.message + '\n\n' + getStepMessage(state.step, state);
                            break;
                        } else if (opCmd === opNavIds.menu) {
                            state.step = 'main_menu';
                            state.filters = {};
                            response = `📋 *Menú principal*\n\n${formatMainMenu(state.data?.whatsapp_name || 'Usuario')}`;
                            break;
                        } else if (opCmd === opNavIds.cancel) {
                            delete userState[sender];
                            if (userTimers[sender]) {
                                clearTimeout(userTimers[sender]);
                                delete userTimers[sender];
                            }
                            response = `🗑️ *Conversación cancelada.*\n\n` +
                                      `📌 Si necesitas ayuda, escribe *hola* para comenzar de nuevo.\n` +
                                      `👋 ¡Que tengas un excelente día!`;
                            break;
                        }

                        const selectedOperation = OPERATION_TYPES.find(op => op.id === opCmd);
                        if (selectedOperation) {
                            state.filters = state.filters || {};
                            state.filters.operation = selectedOperation.label;
                            state.step = 'awaiting_city';
                            response = formatCities(AVAILABLE_CITIES);
                        } else {
                            response = `❌ Opción no válida.\n\n${formatOperationTypes()}`;
                        }
                        break;

                    // ============================================
                    // 📍 CITY SELECTION
                    // ============================================

                    case 'awaiting_city':
                        const displayCities = AVAILABLE_CITIES.slice(0, 15);
                        const totalCityOptions = displayCities.length + 2;
                        const cityNavIds = getNavIds(totalCityOptions);
                        const cityCmd = parseInt(text);

                        if (cityCmd === cityNavIds.go_back) {
                            const prevInfo = getPreviousStep(state.step);
                            state.step = prevInfo.prev || 'main_menu';
                            if (state.step === 'main_menu') {
                                state.filters = {};
                            }
                            response = prevInfo.message + '\n\n' + getStepMessage(state.step, state);
                            break;
                        } else if (cityCmd === cityNavIds.menu) {
                            state.step = 'main_menu';
                            state.filters = {};
                            response = `📋 *Menú principal*\n\n${formatMainMenu(state.data?.whatsapp_name || 'Usuario')}`;
                            break;
                        } else if (cityCmd === cityNavIds.cancel) {
                            delete userState[sender];
                            if (userTimers[sender]) {
                                clearTimeout(userTimers[sender]);
                                delete userTimers[sender];
                            }
                            response = `🗑️ *Conversación cancelada.*\n\n` +
                                      `📌 Si necesitas ayuda, escribe *hola* para comenzar de nuevo.\n` +
                                      `👋 ¡Que tengas un excelente día!`;
                            break;
                        }

                        if (cityCmd >= 1 && cityCmd <= displayCities.length) {
                            state.filters = state.filters || {};
                            state.filters.city = displayCities[cityCmd - 1];
                            state.step = 'awaiting_property_type';
                            response = formatPropertyTypes();
                        } else if (cityCmd === displayCities.length + 1) {
                            response = addTextNavigation('✅ Escribe el nombre de la ciudad que buscas.');
                            state.step = 'awaiting_city_name';
                        } else if (cityCmd === displayCities.length + 2 || text.toLowerCase() === 'todas') {
                            state.filters = state.filters || {};
                            state.filters.city = 'Todas las ciudades';
                            state.step = 'awaiting_property_type';
                            response = formatPropertyTypes();
                        } else {
                            response = `❌ Opción no válida.\n\n${formatCities(AVAILABLE_CITIES)}`;
                        }
                        break;

                    case 'awaiting_city_name':
                        if (text.trim().length >= 3) {
                            state.filters = state.filters || {};
                            state.filters.city = text.trim();
                            state.step = 'awaiting_property_type';
                            response = formatPropertyTypes();
                        } else {
                            response = `❌ El nombre de la ciudad debe tener al menos 3 caracteres.\n` +
                                       `Por favor, escribe el nombre de la ciudad.`;
                        }
                        break;

                    // ============================================
                    // 🏠 PROPERTY TYPE SELECTION
                    // ============================================

                    case 'awaiting_property_type':
                        const typeOptionsLength = PROPERTY_TYPES.length;
                        const typeNavIds = getNavIds(typeOptionsLength);
                        const typeCmd = parseInt(text);

                        if (typeCmd === typeNavIds.go_back) {
                            const prevInfo = getPreviousStep(state.step);
                            state.step = prevInfo.prev || 'main_menu';
                            if (state.step === 'main_menu') {
                                state.filters = {};
                            }
                            response = prevInfo.message + '\n\n' + getStepMessage(state.step, state);
                            break;
                        } else if (typeCmd === typeNavIds.menu) {
                            state.step = 'main_menu';
                            state.filters = {};
                            response = `📋 *Menú principal*\n\n${formatMainMenu(state.data?.whatsapp_name || 'Usuario')}`;
                            break;
                        } else if (typeCmd === typeNavIds.cancel) {
                            delete userState[sender];
                            if (userTimers[sender]) {
                                clearTimeout(userTimers[sender]);
                                delete userTimers[sender];
                            }
                            response = `🗑️ *Conversación cancelada.*\n\n` +
                                      `📌 Si necesitas ayuda, escribe *hola* para comenzar de nuevo.\n` +
                                      `👋 ¡Que tengas un excelente día!`;
                            break;
                        }

                        const selectedType = PROPERTY_TYPES.find(t => t.id === typeCmd);
                        if (selectedType) {
                            state.filters = state.filters || {};
                            state.filters.property_type = selectedType.label;
                            state.step = 'awaiting_price_range';
                            response = formatPriceRanges();
                        } else {
                            response = `❌ Opción no válida.\n\n${formatPropertyTypes()}`;
                        }
                        break;

                    // ============================================
                    // 💰 PRICE RANGE SELECTION
                    // ============================================

                    case 'awaiting_price_range':
                        const priceOptionsLength = PRICE_RANGES.length;
                        const priceNavIds = getNavIds(priceOptionsLength);
                        const priceCmd = parseInt(text);

                        if (priceCmd === priceNavIds.go_back) {
                            const prevInfo = getPreviousStep(state.step);
                            state.step = prevInfo.prev || 'main_menu';
                            if (state.step === 'main_menu') {
                                state.filters = {};
                            }
                            response = prevInfo.message + '\n\n' + getStepMessage(state.step, state);
                            break;
                        } else if (priceCmd === priceNavIds.menu) {
                            state.step = 'main_menu';
                            state.filters = {};
                            response = `📋 *Menú principal*\n\n${formatMainMenu(state.data?.whatsapp_name || 'Usuario')}`;
                            break;
                        } else if (priceCmd === priceNavIds.cancel) {
                            delete userState[sender];
                            if (userTimers[sender]) {
                                clearTimeout(userTimers[sender]);
                                delete userTimers[sender];
                            }
                            response = `🗑️ *Conversación cancelada.*\n\n` +
                                      `📌 Si necesitas ayuda, escribe *hola* para comenzar de nuevo.\n` +
                                      `👋 ¡Que tengas un excelente día!`;
                            break;
                        }

                        const selectedPrice = PRICE_RANGES.find(p => p.id === priceCmd);
                        if (selectedPrice) {
                            state.filters = state.filters || {};
                            state.filters.price_range = priceCmd;

                            await sock.sendMessage(sender, {
                                text: `✅ Buscando ${state.filters.property_type || 'propiedades'} en ${state.filters.city || 'Colombia'}...\n⏳ Esto puede tomar unos segundos.`
                            });

                            const allProperties = await callPropertiesAPI();

                            if (allProperties && allProperties.length > 0) {
                                const extractedCities = extractCitiesFromProperties(allProperties);
                                if (extractedCities.length > 0) {
                                    AVAILABLE_CITIES = extractedCities;
                                }

                                const filtered = filterProperties(allProperties, state.filters);

                                if (filtered.length > 0) {
                                    state.properties = filtered;
                                    state.current_index = 0;
                                    state.step = 'browsing_properties';
                                    
                                    // Mostrar primera propiedad con imagen
                                    const firstProperty = filtered[0];
                                    const caption = buildPropertyCaption(firstProperty, 0, filtered.length);
                                    
                                    if (firstProperty.image_url) {
                                        await sock.sendMessage(sender, {
                                            image: { url: firstProperty.image_url },
                                            caption: caption
                                        });
                                    } else {
                                        await sock.sendMessage(sender, { text: caption });
                                    }
                                    log(`📸 Primera propiedad mostrada a ${senderName}`, 'info');
                                    
                                    // No enviar response adicional porque ya enviamos la imagen
                                    response = null;
                                } else {
                                    response = `❌ No encontré propiedades con esos criterios, ${senderName}.\n\n` +
                                               `📌 ¿Quieres intentarlo de nuevo?\n` +
                                               `1️⃣ Sí, cambiar filtros\n` +
                                               `2️⃣ No, gracias`;
                                    state.step = 'search_again';
                                }
                            } else {
                                response = `❌ Lo siento, ${senderName}.\n\n` +
                                           `No pude obtener propiedades en este momento.\n` +
                                           `📌 Intenta de nuevo más tarde.`;
                                delete userState[sender];
                            }
                        } else {
                            response = `❌ Opción no válida.\n\n${formatPriceRanges()}`;
                        }
                        break;

                    // ============================================
                    // 🔍 BROWSING PROPERTIES (WITH IMAGES)
                    // ============================================

                    case 'browsing_properties':
                        const properties = state.properties || [];
                        const currentIndex = state.current_index || 0;
                        const totalProperties = properties.length;

                        if (totalProperties === 0) {
                            response = `❌ No hay propiedades disponibles.\n\n📌 Escribe *hola* para comenzar de nuevo.`;
                            delete userState[sender];
                            break;
                        }

                        const propOptionsLength = 6;
                        const propNavIds = getNavIds(propOptionsLength);
                        const propCmd = parseInt(text);

                        if (propCmd === propNavIds.go_back) {
                            const prevInfo = getPreviousStep(state.step);
                            state.step = prevInfo.prev || 'main_menu';
                            if (state.step === 'main_menu') {
                                state.filters = {};
                            }
                            response = prevInfo.message + '\n\n' + getStepMessage(state.step, state);
                            break;
                        } else if (propCmd === propNavIds.menu) {
                            state.step = 'main_menu';
                            state.filters = {};
                            response = `📋 *Menú principal*\n\n${formatMainMenu(state.data?.whatsapp_name || 'Usuario')}`;
                            break;
                        } else if (propCmd === propNavIds.cancel) {
                            delete userState[sender];
                            if (userTimers[sender]) {
                                clearTimeout(userTimers[sender]);
                                delete userTimers[sender];
                            }
                            response = `🗑️ *Conversación cancelada.*\n\n` +
                                      `📌 Si necesitas ayuda, escribe *hola* para comenzar de nuevo.\n` +
                                      `👋 ¡Que tengas un excelente día!`;
                            break;
                        }

                        let newIndex = currentIndex;
                        let action = 'view';

                        if (propCmd === 1) {
                            newIndex = (currentIndex + 1) % totalProperties;
                            action = 'view';
                        } else if (propCmd === 2) {
                            newIndex = (currentIndex - 1 + totalProperties) % totalProperties;
                            action = 'view';
                        } else if (propCmd === 3) {
                            action = 'detail';
                        } else if (propCmd === 4) {
                            action = 'location';
                        } else if (propCmd === 5) {
                            action = 'link';
                        } else if (propCmd === 6) {
                            response = `✅ ¡Gracias por usar el asistente, ${state.data?.full_name || senderName}!\n\n` +
                                       `📌 Si necesitas más información, escribe *hola*.\n` +
                                       `👋 ¡Que tengas un excelente día!`;
                            delete userState[sender];
                            break;
                        } else if (!isNaN(propCmd) && propCmd > 0 && propCmd <= totalProperties) {
                            newIndex = propCmd - 1;
                            action = 'view';
                        } else {
                            response = `❌ No entendí tu comando.\n\n` +
                                       `📌 *Comandos disponibles:*\n` +
                                       `1️⃣ Siguiente propiedad\n` +
                                       `2️⃣ Propiedad anterior\n` +
                                       `3️⃣ Ver más información\n` +
                                       `4️⃣ Ver ubicación en mapa\n` +
                                       `5️⃣ Ver enlace de la propiedad\n` +
                                       `6️⃣ Salir de búsqueda\n` +
                                       `${propNavIds.go_back}️⃣ Volver atrás\n` +
                                       `${propNavIds.menu}️⃣ Menú principal\n` +
                                       `${propNavIds.cancel}️⃣ Cancelar\n\n` +
                                       `🔍 También puedes escribir un *número* para ir directamente a esa propiedad.`;
                            break;
                        }

                        if (newIndex !== currentIndex) {
                            state.current_index = newIndex;
                        }

                        const currentProperty = properties[newIndex];

                        switch (action) {
                            case 'view':
                                await sendPropertyWithImage(sock, sender, currentProperty, newIndex, totalProperties);
                                response = null;
                                break;
                            case 'detail':
                                const detailText = formatPropertyDetailText(currentProperty);
                                if (currentProperty.image_url) {
                                    await sock.sendMessage(sender, {
                                        image: { url: currentProperty.image_url },
                                        caption: detailText
                                    });
                                } else {
                                    await sock.sendMessage(sender, { text: detailText });
                                }
                                response = null;
                                break;
                            case 'location':
                                const locationText = formatLocationText(currentProperty);
                                if (currentProperty.image_url) {
                                    await sock.sendMessage(sender, {
                                        image: { url: currentProperty.image_url },
                                        caption: locationText
                                    });
                                } else {
                                    await sock.sendMessage(sender, { text: locationText });
                                }
                                response = null;
                                break;
                            case 'link':
                                response = `🔗 *Enlace de la propiedad #${newIndex + 1}*\n\n` +
                                           `${currentProperty.target_url || 'No disponible'}\n\n` +
                                           `📌 ¿Quieres ver la ubicación? Escribe "ubicación"`;
                                break;
                        }
                        break;

                    // ============================================
                    // 🌴 MIAMI FLOW
                    // ============================================

                    case 'awaiting_miami_name':
                        if (text.trim().length >= 3) {
                            state.data = state.data || {};
                            state.data.full_name = text.trim();
                            state.step = 'awaiting_miami_time';
                            response = formatMiamiInvestmentTime();
                        } else {
                            response = `❌ El nombre debe tener al menos 3 caracteres.\n` +
                                       `Por favor, ingresa tu *nombre completo*.`;
                        }
                        break;

                    case 'awaiting_miami_time':
                        const timeOptionsLength = MIAMI_INVESTMENT_TIMES.length;
                        const timeNavIds = getNavIds(timeOptionsLength);
                        const timeCmd = parseInt(text);

                        if (timeCmd === timeNavIds.go_back) {
                            state.step = 'awaiting_miami_name';
                            response = `✅ Volviendo al paso anterior.\n\n` +
                                       `🌴 Para comenzar, ¿cuál es tu *nombre completo*?\n\n` +
                                       `📌 *Comandos:*\n` +
                                       `• "volver" o *${getNavIds(0).go_back}* → Paso anterior\n` +
                                       `• "menú" o *${getNavIds(0).menu}* → Menú principal\n` +
                                       `• "cancelar" o *${getNavIds(0).cancel}* → Terminar conversación`;
                            break;
                        } else if (timeCmd === timeNavIds.menu) {
                            state.step = 'main_menu';
                            state.filters = {};
                            response = `📋 *Menú principal*\n\n${formatMainMenu(state.data?.whatsapp_name || 'Usuario')}`;
                            break;
                        } else if (timeCmd === timeNavIds.cancel) {
                            delete userState[sender];
                            if (userTimers[sender]) {
                                clearTimeout(userTimers[sender]);
                                delete userTimers[sender];
                            }
                            response = `🗑️ *Conversación cancelada.*\n\n` +
                                      `📌 Si necesitas ayuda, escribe *hola* para comenzar de nuevo.\n` +
                                      `👋 ¡Que tengas un excelente día!`;
                            break;
                        }

                        const selectedTime = MIAMI_INVESTMENT_TIMES.find(t => t.id === timeCmd);
                        if (selectedTime) {
                            state.data.investment_time = selectedTime.label;
                            state.step = 'awaiting_miami_budget';
                            response = formatMiamiBudget();
                        } else {
                            response = `❌ Opción no válida.\n\n${formatMiamiInvestmentTime()}`;
                        }
                        break;

                    case 'awaiting_miami_budget':
                        const budgetOptionsLength = MIAMI_BUDGETS.length;
                        const budgetNavIds = getNavIds(budgetOptionsLength);
                        const budgetCmd = parseInt(text);

                        if (budgetCmd === budgetNavIds.go_back) {
                            state.step = 'awaiting_miami_time';
                            response = `✅ Volviendo al paso anterior.\n\n${formatMiamiInvestmentTime()}`;
                            break;
                        } else if (budgetCmd === budgetNavIds.menu) {
                            state.step = 'main_menu';
                            state.filters = {};
                            response = `📋 *Menú principal*\n\n${formatMainMenu(state.data?.whatsapp_name || 'Usuario')}`;
                            break;
                        } else if (budgetCmd === budgetNavIds.cancel) {
                            delete userState[sender];
                            if (userTimers[sender]) {
                                clearTimeout(userTimers[sender]);
                                delete userTimers[sender];
                            }
                            response = `🗑️ *Conversación cancelada.*\n\n` +
                                      `📌 Si necesitas ayuda, escribe *hola* para comenzar de nuevo.\n` +
                                      `👋 ¡Que tengas un excelente día!`;
                            break;
                        }

                        const selectedBudget = MIAMI_BUDGETS.find(b => b.id === budgetCmd);
                        if (selectedBudget) {
                            state.data.budget = selectedBudget.label;

                            response = `🌴 *Inversión en Miami - Resumen*\n\n` +
                                       `👤 Nombre: ${state.data.full_name}\n` +
                                       `🗓️ Plazo: ${state.data.investment_time}\n` +
                                       `💰 Presupuesto: ${state.data.budget}\n\n` +
                                       `📌 Un asesor especializado en Miami se comunicará contigo en las próximas 24 horas.\n\n` +
                                       `¿Te gustaría ver propiedades en Colombia también?\n` +
                                       `1️⃣ Sí, buscar propiedades en Colombia\n` +
                                       `2️⃣ No, gracias`;
                            state.step = 'miami_done';
                        } else {
                            response = `❌ Opción no válida.\n\n${formatMiamiBudget()}`;
                        }
                        break;

                    case 'miami_done':
                        if (text === '1') {
                            state.action = 'colombia';
                            state.step = 'awaiting_operation';
                            response = formatOperationTypes();
                        } else {
                            response = `✅ ¡Gracias, ${state.data?.full_name || senderName}!\n\n` +
                                       `📌 Un asesor te contactará pronto.\n` +
                                       `👋 ¡Que tengas un excelente día!`;
                            delete userState[sender];
                        }
                        break;

                    // ============================================
                    // 💳 CREDIT CARD FLOW
                    // ============================================

                    case 'awaiting_credit_card_confirm':
                        const ccOptionsLength = 2;
                        const ccNavIds = getNavIds(ccOptionsLength);
                        const ccCmd = parseInt(text);

                        if (ccCmd === ccNavIds.go_back) {
                            const prevInfo = getPreviousStep(state.step);
                            state.step = prevInfo.prev || 'main_menu';
                            if (state.step === 'main_menu') {
                                state.filters = {};
                            }
                            response = prevInfo.message + '\n\n' + getStepMessage(state.step, state);
                            break;
                        } else if (ccCmd === ccNavIds.menu) {
                            state.step = 'main_menu';
                            state.filters = {};
                            response = `📋 *Menú principal*\n\n${formatMainMenu(state.data?.whatsapp_name || 'Usuario')}`;
                            break;
                        } else if (ccCmd === ccNavIds.cancel) {
                            delete userState[sender];
                            if (userTimers[sender]) {
                                clearTimeout(userTimers[sender]);
                                delete userTimers[sender];
                            }
                            response = `🗑️ *Conversación cancelada.*\n\n` +
                                      `📌 Si necesitas ayuda, escribe *hola* para comenzar de nuevo.\n` +
                                      `👋 ¡Que tengas un excelente día!`;
                            break;
                        }

                        if (ccCmd === 1) {
                            state.step = 'awaiting_credit_card_name';
                            response = `✅ Excelente, ${senderName}.\n\n` +
                                       `Para comenzar, ¿cuál es tu *nombre completo*?`;
                        } else if (ccCmd === 2) {
                            response = `✅ Entendido, ${senderName}.\n\n` +
                                       `¿Te gustaría ver propiedades?\n` +
                                       `1️⃣ Sí, buscar propiedades\n` +
                                       `2️⃣ No, gracias`;
                            state.step = 'credit_card_declined';
                        } else {
                            response = `❌ Opción no válida.\n\n${formatCreditCardIntro()}`;
                        }
                        break;

                    case 'credit_card_declined':
                        if (text === '1') {
                            state.action = 'colombia';
                            state.step = 'awaiting_operation';
                            response = formatOperationTypes();
                        } else {
                            response = `✅ ¡Gracias, ${senderName}!\n\n` +
                                       `👋 ¡Que tengas un excelente día!`;
                            delete userState[sender];
                        }
                        break;

                    case 'awaiting_credit_card_name':
                        if (text.trim().length >= 3) {
                            state.data = state.data || {};
                            state.data.full_name = text.trim();
                            state.step = 'awaiting_credit_card_id';
                            response = `✅ Gracias, ${state.data.full_name}.\n\n` +
                                       `¿Cuál es tu *número de identificación*?`;
                        } else {
                            response = `❌ El nombre debe tener al menos 3 caracteres.\n` +
                                       `Por favor, ingresa tu *nombre completo*.`;
                        }
                        break;

                    case 'awaiting_credit_card_id':
                        if (text.trim().length >= 5) {
                            state.data.identification = text.trim();
                            state.step = 'awaiting_credit_card_income';
                            response = `✅ Identificación registrada.\n\n` +
                                       `¿Cuál es tu *ingreso mensual* aproximado?\n` +
                                       `📌 Ejemplo: 3500000`;
                        } else {
                            response = `❌ Identificación no válida. Debe tener al menos 5 caracteres.\n` +
                                       `Por favor, ingresa tu *número de identificación*.`;
                        }
                        break;

                    case 'awaiting_credit_card_income':
                        const income = parseInt(text.replace(/[^0-9]/g, ''));
                        if (income > 0) {
                            state.data.income = income;
                            state.step = 'awaiting_credit_card_cards';
                            response = `✅ Ingreso registrado.\n\n` +
                                       `¿Tienes otras tarjetas de crédito activas?\n` +
                                       `1️⃣ Sí\n` +
                                       `2️⃣ No`;
                        } else {
                            response = `❌ Ingreso no válido. Por favor, ingresa tu *ingreso mensual*.`;
                        }
                        break;

                    case 'awaiting_credit_card_cards':
                        const otherCards = parseInt(text);
                        if (otherCards === 1 || otherCards === 2) {
                            state.data.has_other_cards = (otherCards === 1);
                            response = formatCreditCardApproved(state.data);
                            delete userState[sender];
                        } else {
                            response = `❌ Opción no válida.\n\n` +
                                       `¿Tienes otras tarjetas de crédito activas?\n` +
                                       `1️⃣ Sí\n` +
                                       `2️⃣ No`;
                        }
                        break;

                    // ============================================
                    // 📝 SELL/RENT FLOW (COMPLETE WITH EMAIL + NAV)
                    // ============================================

                    case 'awaiting_sell_rent_name':
                        if (text.trim().length >= 3) {
                            state.data = state.data || {};
                            state.data.full_name = text.trim();
                            state.data.whatsapp_name = senderName;
                            state.step = 'awaiting_sell_rent_phone';
                            response = addTextNavigation(`✅ Gracias, ${state.data.full_name}.\n\n¿Cuál es tu *número de teléfono*? (10 dígitos)`);
                        } else {
                            response = `❌ El nombre debe tener al menos 3 caracteres.\n` +
                                       `Por favor, ingresa tu *nombre completo*.`;
                        }
                        break;

                    case 'awaiting_sell_rent_phone':
                        const cleanPhone = text.replace(/[^0-9]/g, '');
                        if (cleanPhone.length === 10) {
                            state.data.phone = cleanPhone;
                            state.step = 'awaiting_sell_rent_email';
                            response = addTextNavigation(`✅ Perfecto, ${state.data.full_name}.\n\n¿Cuál es tu *correo electrónico*?`);
                        } else {
                            response = `❌ El número debe tener 10 dígitos (ej: 3001234567).\n` +
                                       `Por favor, inténtalo de nuevo.`;
                        }
                        break;

                    case 'awaiting_sell_rent_email':
                        if (text.includes('@') && text.includes('.')) {
                            state.data.email = text.trim();
                            state.step = 'awaiting_sell_rent_property_type';
                            response = formatSellRentPropertyTypes();
                        } else {
                            response = `❌ El correo no es válido. Debe contener '@' y '.'\n` +
                                       `Por favor, ingresa tu *correo electrónico*.`;
                        }
                        break;

                    case 'awaiting_sell_rent_property_type':
                        const srTypeOptionsLength = SELL_RENT_PROPERTY_TYPES.length;
                        const srTypeNavIds = getNavIds(srTypeOptionsLength);
                        const srTypeCmd = parseInt(text);

                        if (srTypeCmd === srTypeNavIds.go_back) {
                            state.step = 'awaiting_sell_rent_email';
                            response = addTextNavigation(`✅ Volviendo al paso anterior.\n\n¿Cuál es tu *correo electrónico*?`);
                            break;
                        } else if (srTypeCmd === srTypeNavIds.menu) {
                            state.step = 'main_menu';
                            state.filters = {};
                            response = `📋 *Menú principal*\n\n${formatMainMenu(state.data?.whatsapp_name || 'Usuario')}`;
                            break;
                        } else if (srTypeCmd === srTypeNavIds.cancel) {
                            delete userState[sender];
                            if (userTimers[sender]) {
                                clearTimeout(userTimers[sender]);
                                delete userTimers[sender];
                            }
                            response = `🗑️ *Conversación cancelada.*\n\n` +
                                      `📌 Si necesitas ayuda, escribe *hola* para comenzar de nuevo.\n` +
                                      `👋 ¡Que tengas un excelente día!`;
                            break;
                        }

                        const selectedSrType = SELL_RENT_PROPERTY_TYPES.find(t => t.id === srTypeCmd);
                        if (selectedSrType) {
                            state.data.property_type = selectedSrType.label;
                            
                            if (selectedSrType.label === 'Otro (escríbelo)') {
                                state.step = 'awaiting_sell_rent_custom_type';
                                response = addTextNavigation('✅ Escribe el tipo de propiedad.');
                            } else {
                                state.step = 'awaiting_sell_rent_city';
                                response = addTextNavigation('📍 ¿En qué *ciudad* se encuentra la propiedad?');
                            }
                        } else {
                            response = `❌ Opción no válida.\n\n${formatSellRentPropertyTypes()}`;
                        }
                        break;

                    case 'awaiting_sell_rent_custom_type':
                        if (text.trim().length >= 3) {
                            state.data.property_type = text.trim();
                            state.step = 'awaiting_sell_rent_city';
                            response = addTextNavigation('📍 ¿En qué *ciudad* se encuentra la propiedad?');
                        } else {
                            response = `❌ El tipo de propiedad debe tener al menos 3 caracteres.\n` +
                                       `Por favor, escribe el tipo de propiedad.`;
                        }
                        break;

                    case 'awaiting_sell_rent_city':
                        if (text.trim().length >= 3) {
                            state.data.city = text.trim();
                            state.step = 'awaiting_sell_rent_area';
                            response = addTextNavigation('📐 ¿Cuál es el *área construida* en m²?');
                        } else {
                            response = `❌ La ciudad debe tener al menos 3 caracteres.\n` +
                                       `Por favor, escribe la ciudad.`;
                        }
                        break;

                    case 'awaiting_sell_rent_area':
                        const area = parseInt(text.replace(/[^0-9]/g, ''));
                        if (area > 0) {
                            state.data.area = area;
                            state.step = 'awaiting_sell_rent_price';
                            response = addTextNavigation(`💰 ¿Cuál es el *precio de venta* o *canon de arriendo*?\n📌 Ejemplo: 350000000`);
                        } else {
                            response = `❌ Área no válida. Por favor, ingresa el *área construida* en m².`;
                        }
                        break;

                    case 'awaiting_sell_rent_price':
                        const price = parseInt(text.replace(/[^0-9]/g, ''));
                        if (price > 0) {
                            state.data.price = price;
                            state.step = 'awaiting_sell_rent_operation';
                            response = formatSellRentOperations();
                        } else {
                            response = `❌ Precio no válido. Por favor, ingresa el *precio* o *canon de arriendo*.`;
                        }
                        break;

                    case 'awaiting_sell_rent_operation':
                        const srOpOptionsLength = 3;
                        const srOpNavIds = getNavIds(srOpOptionsLength);
                        const srOpCmd = parseInt(text);

                        if (srOpCmd === srOpNavIds.go_back) {
                            state.step = 'awaiting_sell_rent_price';
                            response = addTextNavigation(`✅ Volviendo al paso anterior.\n\n💰 ¿Cuál es el *precio de venta* o *canon de arriendo*?\n📌 Ejemplo: 350000000`);
                            break;
                        } else if (srOpCmd === srOpNavIds.menu) {
                            state.step = 'main_menu';
                            state.filters = {};
                            response = `📋 *Menú principal*\n\n${formatMainMenu(state.data?.whatsapp_name || 'Usuario')}`;
                            break;
                        } else if (srOpCmd === srOpNavIds.cancel) {
                            delete userState[sender];
                            if (userTimers[sender]) {
                                clearTimeout(userTimers[sender]);
                                delete userTimers[sender];
                            }
                            response = `🗑️ *Conversación cancelada.*\n\n` +
                                      `📌 Si necesitas ayuda, escribe *hola* para comenzar de nuevo.\n` +
                                      `👋 ¡Que tengas un excelente día!`;
                            break;
                        }

                        const selectedSrOp = [1, 2, 3].includes(srOpCmd) ? 
                            [{ id: 1, label: 'Vender' }, { id: 2, label: 'Arrendar' }, { id: 3, label: 'Ambos' }].find(op => op.id === srOpCmd) : null;
                        
                        if (selectedSrOp) {
                            state.data.operation = selectedSrOp.label;
                            response = formatSellRentSummary(state.data);
                            delete userState[sender];
                        } else {
                            response = `❌ Opción no válida.\n\n${formatSellRentOperations()}`;
                        }
                        break;

                    // ============================================
                    // 🔄 SEARCH AGAIN
                    // ============================================

                    case 'search_again':
                        if (text === '1') {
                            state.step = 'awaiting_city';
                            response = formatCities(AVAILABLE_CITIES);
                        } else {
                            response = `✅ ¡Gracias, ${senderName}!\n\n` +
                                       `👋 ¡Que tengas un excelente día!`;
                            delete userState[sender];
                        }
                        break;

                    default:
                        response = `⚠️ Lo siento, ${senderName}, no te entendí.\n\n` +
                                   `📌 Escribe *hola* para comenzar de nuevo.`;
                        delete userState[sender];
                }

                // ============================================
                // 📤 SEND RESPONSE (if not null)
                // ============================================

                if (response) {
                    await sock.sendMessage(sender, { text: response });
                    log(`📤 Response sent to ${senderName}`, 'info');
                }

            } catch (error) {
                log(`Error processing message: ${error.message}`, 'error');
                try {
                    await sock.sendMessage(msg.key.remoteJid, {
                        text: '❌ Ocurrió un error. Intenta de nuevo.'
                    });
                } catch (e) {}
            }
        });

        return sock;

    } catch (error) {
        log(`Connection error: ${error.message}`, 'error');
        setTimeout(() => connectToWhatsApp(), RECONNECT_DELAY);
    }
}

// ============================================
// 🚀 START THE BOT
// ============================================

process.on('uncaughtException', (error) => {
    log(`Uncaught error: ${error.message}`, 'error');
});

process.on('unhandledRejection', (reason) => {
    log(`Unhandled rejection: ${reason}`, 'error');
});

log('🚀 Starting WhatsApp Bot...', 'info');
log(`📱 Number configured: ${BOT_NUMBER}`, 'info');

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