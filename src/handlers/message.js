// ============================================
// 📩 MESSAGE HANDLER — Router principal
// Recibe cada mensaje y lo despacha al flow correspondiente.
// ============================================

const { log } = require('../logger');
const {
    userState,
    // getAvailableCities,
    // setAvailableCities,
    resetUserTimer
} = require('../state');
const {
    getPreviousStep,
    getStepMessage,
    handleUniversalCommand,
    addTextNavigation
} = require('../navigation');
const { formatMainMenu } = require('../formatters/menu');
const { handleGroupMessage } = require('./group');
const { detectIntent, handleIntentBasedRouting } = require('./intent');
const { isVoiceMessage, getVoiceDuration } = require('../utils');

const mainMenuFlow    = require('../flows/mainMenu');
const propertiesFlow  = require('../flows/properties');
const miamiFlow       = require('../flows/miami');
const creditCardFlow  = require('../flows/creditCard');
const sellRentFlow    = require('../flows/sellRent');
const searchAgainFlow = require('../flows/searchAgain');
const { handleReference,  handleReferenceAction } = require('./reference');
const { isPaused } = require('./human');
const { normalizeJid, isRestricted, logRestricted } = require('./restricted');
const { handleAgentAccess } = require('./agent-access');

/**
 * Dispatch table: maps state.step → flow handler
 * Each handler is an async function (sock, sender, senderName, text, state) → string|null
 */
const FLOW_ROUTER = {
    // Main menu flow
    'main_menu':                    mainMenuFlow.handleMainMenu,
    'awaiting_operation':           mainMenuFlow.handleOperation,
    'awaiting_city':                mainMenuFlow.handleCity,
    'awaiting_city_name':           mainMenuFlow.handleCityName,
    'awaiting_property_type':       mainMenuFlow.handlePropertyType,
    'awaiting_price_range':         mainMenuFlow.handlePriceRange,

    // Properties browsing
    'browsing_properties':          propertiesFlow.handleBrowsing,

    // Miami flow
    'awaiting_miami_name':          miamiFlow.handleName,
    'awaiting_miami_time':          miamiFlow.handleTime,
    'awaiting_miami_budget':        miamiFlow.handleBudget,
    'miami_done':                   miamiFlow.handleDone,

    // Credit card flow
    'awaiting_credit_card_confirm': creditCardFlow.handleConfirm,
    'credit_card_declined':         creditCardFlow.handleDeclined,
    'awaiting_credit_card_name':    creditCardFlow.handleName,
    'awaiting_credit_card_id':      creditCardFlow.handleId,
    'awaiting_credit_card_income':  creditCardFlow.handleIncome,
    'awaiting_credit_card_cards':   creditCardFlow.handleCards,

    // Sell/Rent flow
    'awaiting_sell_rent_name':          sellRentFlow.handleName,
    'awaiting_sell_rent_phone':         sellRentFlow.handlePhone,
    'awaiting_sell_rent_email':         sellRentFlow.handleEmail,
    'awaiting_sell_rent_property_type': sellRentFlow.handlePropertyType,
    'awaiting_sell_rent_custom_type':   sellRentFlow.handleCustomType,
    'awaiting_sell_rent_city':          sellRentFlow.handleCity,
    'awaiting_sell_rent_area':          sellRentFlow.handleArea,
    'awaiting_sell_rent_price':         sellRentFlow.handlePrice,
    'awaiting_sell_rent_operation':     sellRentFlow.handleOperation,

    // Search again
    'search_again':                 searchAgainFlow.handleSearchAgain,

    // Reference actions (from Ref #XXXaN links)
    'awaiting_reference_action':    handleReferenceAction,
};

async function handleMessage(sock, msg, botJid) {
    try {
        const sender = msg.key.remoteJid;
        const senderName = msg.pushName || 'Usuario';

        // ─────────────────────────────────────────
        // 🔒 Detect restricted chats (for logging)
        // ─────────────────────────────────────────
        if (isRestricted(sender)) {
            logRestricted(sender, msg);
        }


        // ============================================
        // ⏸️  HUMAN TAKEOVER CHECK
        // If the chat is paused (agent is handling), skip bot response
        // ============================================
        if (isPaused(sender)) {
            log(`⏸️  Skipped (chat paused): ${sender}`, 'debug');
            return;
        }


        // --------------------------------------------
        // 👥 Groups
        // --------------------------------------------
        if (sender.endsWith('@g.us')) {
            const groupResult = await handleGroupMessage(sock, msg, sender, senderName, botJid);
            if (groupResult && groupResult.shouldProcess === false) return;
        }

        // --------------------------------------------
        // 🎤 Voice messages
        // --------------------------------------------
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

        // --------------------------------------------
        // 📝 Text messages
        // --------------------------------------------
        const text = msg.message.conversation || '';
        if (!text) return;

        log(`📩 ${senderName}: ${text}`, 'info');

        // ============================================
        // 🔗 CHECK FOR REFERENCE LINK (Ref #XXXaN)
        // ============================================
        const handled = await handleReference(sock, sender, senderName, text);
        if (handled) return;

        // ============================================
        // 🔑 CHECK FOR AGENT ACCESS ("soy asesor", "quiero ver catálogo")
        // ============================================
        const agentHandled = await handleAgentAccess(sock, sender, senderName, text);
        if (agentHandled) return;


        // ============================================
        // 🧠 INITIALIZE STATE IF NOT EXISTS
        // ============================================
        if (!userState[sender]) {
            // ─────────────────────────────────────────
            // 🎯 Check for intent BEFORE showing main menu
            // ─────────────────────────────────────────
            const intentResult = detectIntent(text);

            if (intentResult.matched) {
                // Initialize state first
                userState[sender] = {
                    step: 'main_menu',
                    data: { whatsapp_name: senderName }
                };
                resetUserTimer(sender, sock);

                // Route to the appropriate flow
                const intentResponse = handleIntentBasedRouting(text, userState[sender], senderName);
                if (intentResponse) {
                    await sock.sendMessage(sender, { text: intentResponse });
                    log(`🎯 Intent detected: ${intentResult.action} for ${senderName}`, 'info');
                    return;
                }
            }

            // No intent detected - show main menu
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
                const { userTimers } = require('../state');
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
                    if (state.step === 'main_menu') state.filters = {};
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
        // 🧠 MAIN STATE MACHINE (dispatch to flow)
        // ============================================
        const flowHandler = FLOW_ROUTER[state.step];

        if (flowHandler) {
            response = await flowHandler(sock, sender, senderName, text, state);
        } else {
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
}

module.exports = { handleMessage, FLOW_ROUTER };