const { SESSION_TIMEOUT_MS } = require('./config');
const { log } = require('./logger');

const userState = {};
const userTimers = {};

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

function getAvailableCities() {
    return AVAILABLE_CITIES;
}

function setAvailableCities(cities) {
    AVAILABLE_CITIES = cities;
}

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

module.exports = {
    userState,
    userTimers,
    COLOMBIA_CITIES,
    getAvailableCities,
    setAvailableCities,
    resetUserTimer
};