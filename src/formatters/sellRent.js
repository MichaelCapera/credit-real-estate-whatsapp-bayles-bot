const { formatMenu } = require('../data/nav');
const { SELL_RENT_PROPERTY_TYPES } = require('../data/menus');
const { formatPrice } = require('../utils');

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

module.exports = {
    formatSellRentPropertyTypes,
    formatSellRentSummary,
    formatSellRentOperations
};