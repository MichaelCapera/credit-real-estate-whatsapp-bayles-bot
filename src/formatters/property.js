const { formatPrice } = require('../utils');
const { getNavIds } = require('../data/nav');
const { log } = require('../logger');

function buildPropertyCaption(property, index, total) {
    const priceFormatted = formatPrice(property.price);
    const navIds = getNavIds(6);

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
        if (property.image_url) {
            await sock.sendMessage(sender, {
                image: { url: property.image_url },
                caption: caption
            });
            log(`📸 Imagen enviada para propiedad ${index + 1}`, 'info');
        } else {
            await sock.sendMessage(sender, { text: caption });
            log(`📝 Texto enviado para propiedad ${index + 1} (sin imagen)`, 'info');
        }
    } catch (error) {
        log(`Error enviando imagen: ${error.message}`, 'error');
        await sock.sendMessage(sender, { text: caption });
    }
}

function formatPropertyDetailText(property) {
    const priceFormatted = formatPrice(property.price);
    const navIds = getNavIds(5);

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

module.exports = {
    buildPropertyCaption,
    sendPropertyWithImage,
    formatPropertyDetailText,
    formatLocationText
};