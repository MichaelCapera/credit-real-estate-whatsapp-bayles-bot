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

module.exports = { formatPrice, isVoiceMessage, getVoiceDuration };