const { getPreviousStep, getStepMessage } = require('../navigation');
const { getNavIds } = require('../data/nav');
const { formatMainMenu } = require('../formatters/menu');
const {
    formatPropertyDetailText,
    formatLocationText,
    sendPropertyWithImage
} = require('../formatters/property');
const { userState } = require('../state');
const { log } = require('../logger');

async function handleBrowsing(sock, sender, senderName, text, state) {
    const properties = state.properties || [];
    const currentIndex = state.current_index || 0;
    const totalProperties = properties.length;

    if (totalProperties === 0) {
        delete userState[sender];
        return `❌ No hay propiedades disponibles.\n\n📌 Escribe *hola* para comenzar de nuevo.`;
    }

    const propOptionsLength = 6;
    const propNavIds = getNavIds(propOptionsLength);
    const propCmd = parseInt(text);

    if (propCmd === propNavIds.go_back) {
        const prevInfo = getPreviousStep(state.step);
        state.step = prevInfo.prev || 'main_menu';
        if (state.step === 'main_menu') state.filters = {};
        return prevInfo.message + '\n\n' + getStepMessage(state.step, state);
    }
    if (propCmd === propNavIds.menu) {
        state.step = 'main_menu';
        state.filters = {};
        return `📋 *Menú principal*\n\n${formatMainMenu(state.data?.whatsapp_name || 'Usuario')}`;
    }
    if (propCmd === propNavIds.cancel) {
        delete userState[sender];
        return `🗑️ *Conversación cancelada.*\n\n📌 Escribe *hola* para comenzar de nuevo.`;
    }

    let newIndex = currentIndex;
    let action = 'view';

    if (propCmd === 1) {
        newIndex = (currentIndex + 1) % totalProperties;
    } else if (propCmd === 2) {
        newIndex = (currentIndex - 1 + totalProperties) % totalProperties;
    } else if (propCmd === 3) {
        action = 'detail';
    } else if (propCmd === 4) {
        action = 'location';
    } else if (propCmd === 5) {
        action = 'link';
    } else if (propCmd === 6) {
        delete userState[sender];
        return `✅ ¡Gracias por usar el asistente, ${state.data?.full_name || senderName}!\n\n` +
               `📌 Si necesitas más información, escribe *hola*.\n👋 ¡Que tengas un excelente día!`;
    } else if (!isNaN(propCmd) && propCmd > 0 && propCmd <= totalProperties) {
        newIndex = propCmd - 1;
    } else {
        return `❌ No entendí tu comando.\n\n` +
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
               `🔍 También puedes escribir un *número* para ir a esa propiedad.`;
    }

    if (newIndex !== currentIndex) state.current_index = newIndex;

    const currentProperty = properties[newIndex];

    switch (action) {
        case 'view':
            await sendPropertyWithImage(sock, sender, currentProperty, newIndex, totalProperties);
            return null;
        case 'detail': {
            const detailText = formatPropertyDetailText(currentProperty);
            if (currentProperty.image_url) {
                await sock.sendMessage(sender, {
                    image: { url: currentProperty.image_url },
                    caption: detailText
                });
            } else {
                await sock.sendMessage(sender, { text: detailText });
            }
            return null;
        }
        case 'location': {
            const locationText = formatLocationText(currentProperty);
            if (currentProperty.image_url) {
                await sock.sendMessage(sender, {
                    image: { url: currentProperty.image_url },
                    caption: locationText
                });
            } else {
                await sock.sendMessage(sender, { text: locationText });
            }
            return null;
        }
        case 'link':
            return `🔗 *Enlace de la propiedad #${newIndex + 1}*\n\n` +
                   `${currentProperty.target_url || 'No disponible'}\n\n` +
                   `📌 ¿Quieres ver la ubicación? Escribe "ubicación"`;
    }
    return null;
}

module.exports = { handleBrowsing };