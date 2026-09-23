// ============================================
// 🔗 REFERENCE HANDLER — Handles advisor links (Ref #XXXaN)
// ============================================

const { log } = require('../logger');
const { formatMainMenu } = require('../formatters/menu');
const { resetUserTimer, userState } = require('../state');
const { API_BASE_URL, PROPERTIES_API_URL } = require('../config');

/**
 * Fetch agent info from API.
 * Returns the agent object or null.
 */
async function fetchAgent(agentId) {
    try {
        const url = `${API_BASE_URL}/api/agent?id=${agentId}`;
        const res = await fetch(url, { method: 'GET' });
        const data = await res.json();

        if (data.success && data.agent) {
            return data.agent;
        }
        return null;
    } catch (err) {
        log(`❌ Error fetching agent #${agentId}: ${err.message}`, 'error');
        return null;
    }
}

/**
 * Fetch a property by ID from the properties API.
 * Returns the property object or null.
 */
async function fetchProperty(propertyId) {
    try {
        const res = await fetch(PROPERTIES_API_URL, { method: 'GET' });
        const data = await res.json();

        if (!Array.isArray(data)) return null;

        const id = parseInt(propertyId, 10);
        return data.find(p => parseInt(p.id, 10) === id) || null;
    } catch (err) {
        log(`❌ Error fetching property #${propertyId}: ${err.message}`, 'error');
        return null;
    }
}

/**
 * Format price in COP.
 */
function formatPrice(price) {
    try {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            maximumFractionDigits: 0,
        }).format(price);
    } catch {
        return `$${price}`;
    }
}

/**
 * Build a short property description.
 */
function buildPropertyCard(property) {
    const price = formatPrice(property.price || 0);
    const title = property.title || 'Propiedad';
    const area = property.area_built || '';
    const desc = property.description || '';

    let text = `🏠 *${title}*\n`;
    if (desc) text += `📍 ${desc}\n`;
    if (area) text += `📐 ${area}\n`;
    text += `💰 ${price}`;

    return text;
}

/**
 * Detects and handles a reference link message.
 * Returns true if handled, false otherwise.
 *
 * Supported formats:
 *   "Ref #498a2"
 *   "Ref: #498a2"
 *   "Hola, me interesa (Ref: #498a2)"
 */
async function handleReference(sock, sender, senderName, text) {
    const match = text.match(/Ref[:\s]*#?(\d+)a(\d+)/i);
    if (!match) return false;

    const propertyId = match[1];
    const agentId    = match[2];

    log(`🔗 Reference detected: Property #${propertyId}, Agent #${agentId}`, 'info');

    // ─────────────────────────────────────────
    // Initialize state if this is a new user
    // ─────────────────────────────────────────
    if (!userState[sender]) {
        userState[sender] = {
            step: 'main_menu',
            data: { whatsapp_name: senderName }
        };
    }

    // ─────────────────────────────────────────
    // Store property ID for future use
    // ─────────────────────────────────────────
    userState[sender].data = userState[sender].data || {};
    userState[sender].data.propertyId = propertyId;

    // ─────────────────────────────────────────
    // Fetch agent (may be null if not found)
    // ─────────────────────────────────────────
    const agent = await fetchAgent(agentId);
    if (agent) {
        userState[sender].data.agentId   = agentId;
        userState[sender].data.agentUuid = agent.uuid;
        userState[sender].data.agentName = agent.name;
        log(`✅ Agent found: ${agent.name}`, 'info');
    } else {
        log(`⚠️ Agent #${agentId} not found — continuing without attribution`, 'warn');
    }

    // ─────────────────────────────────────────
    // Fetch property (may be null if not found)
    // ─────────────────────────────────────────
    const property = await fetchProperty(propertyId);

    const phone = extractPhoneFromJid(sender);
    const leadPayload = {
    type: 'property',
    name: senderName,
    phone: phone || 'pending', // placeholder si no hay número
    interest: `Ref #${propertyId}`,
    agent_uuid: agent ? agent.uuid : null,
    source: 'whatsapp',
    message: text,
    };

    createLead(leadPayload)
        .then(async res => {
            if (res && res.success) {
                log(`✅ Lead saved: ID ${res.lead_id}`, 'info');
                userState[sender].data.leadId = res.lead_id;

                // 🔔 Notify the agent — only if attributed and we have a valid phone
                if (res.agent_assigned && agent && agent.phone) {
                    await notifyAgent(sock, agent, {
                        customerName:  senderName,
                        customerPhone: phone || 'pending',
                        interest:      `Ref #${propertyId}`,
                        message:       text,
                        source:        'whatsapp',
                    });
                }
            } else {
                log(`⚠️ Failed to save lead`, 'warn');
            }
        })
        .catch(err => log(`❌ createLead failed: ${err.message}`, 'error'));

    // ─────────────────────────────────────────
    // Build response
    // ─────────────────────────────────────────
    let response = `🔗 *Has llegado desde un enlace compartido*\n\n`;

    if (agent) {
        response += `👤 Asesor: *${agent.name}*\n`;
    }

    response += `📌 Referencia: #${propertyId}\n\n`;

    if (property) {
        response += buildPropertyCard(property) + `\n\n`;
    } else {
        response += `🏠 *Propiedad de referencia #${propertyId}*\n\n`;
    }

    if (agent) {
        response += `📌 *${agent.name}* se comunicará contigo pronto.`;
    } else {
        response += `📌 Un asesor se comunicará contigo pronto.`;
    }

    resetUserTimer(sender, sock);
    await sock.sendMessage(sender, { text: response });

    // Show main menu
    const actionMenu =
    `¿Qué te gustaría hacer ahora?\n\n` +
    `1️⃣ Agendar una visita\n` +
    `2️⃣ Hablar con el asesor\n` +
    `3️⃣ Ver más propiedades\n` +
    `4️⃣ Volver al menú principal`;

    await sock.sendMessage(sender, { text: actionMenu });
    userState[sender].step = 'awaiting_reference_action';

    return true;
}

/**
 * Handle the action menu after a reference is detected.
 * Options:
 *   1 → Agendar visita
 *   2 → Hablar con el asesor
 *   3 → Ver más propiedades
 *   4 → Menú principal
 */
async function handleReferenceAction(sock, sender, senderName, text, state) {
    const option = parseInt(text.trim(), 10);

    switch (option) {
        case 1:
            state.step = 'awaiting_visit_name';
            return `📅 ¡Genial! Vamos a agendar una visita.\n\n` +
                   `¿Cuál es tu *nombre completo*?`;

        case 2:
            state.step = 'awaiting_reference_action'; // stay in this step
            return `👤 Perfecto. *${state.data?.agentName || 'Un asesor'}* se comunicará contigo muy pronto.\n\n` +
                   `Mientras tanto, ¿quieres agendar una visita?\n\n` +
                   `1️⃣ Sí, agendar visita\n` +
                   `2️⃣ No, gracias`;

        case 3:
            state.step = 'main_menu';
            return formatMainMenu(senderName);

        case 4:
            state.step = 'main_menu';
            return formatMainMenu(senderName);

        default:
            return `❌ Opción no válida.\n\n` +
                   `1️⃣ Agendar una visita\n` +
                   `2️⃣ Hablar con el asesor\n` +
                   `3️⃣ Ver más propiedades\n` +
                   `4️⃣ Volver al menú principal`;
    }
}

async function createLead(payload) {
    try {
        const res = await fetch(`${API_BASE_URL}/api/lead`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        const data = await res.json();
        return data;
    } catch (err) {
        log(`❌ Error creating lead: ${err.message}`, 'error');
        return null;
    }
}

function extractPhoneFromJid(jid) {
    if (jid && jid.endsWith('@s.whatsapp.net')) {
        return jid.split('@')[0];
    }
    return null;
}

/**
 * Normalize a Colombian phone number into a WhatsApp JID.
 * Accepts: "3153045383", "315 304 5383", "+57 315 304 5383", "573153045383".
 * Returns null if the number can't be parsed.
 *
 * All agents are Colombia-based, so we assume +57 for 10-digit mobiles.
 */
function phoneToJid(phone) {
    if (!phone) return null;
    let digits = String(phone).replace(/\D/g, '');

    // Colombian mobile: 10 digits starting with 3 → prepend country code
    if (digits.length === 10 && digits.startsWith('3')) {
        digits = '57' + digits;
    }

    if (digits.length < 11 || digits.length > 15) return null;
    return `${digits}@s.whatsapp.net`;
}

/**
 * Send a WhatsApp notification to the agent about a new lead.
 * Failures never bubble up — we never want to break the customer flow.
 */
async function notifyAgent(sock, agent, lead) {
    const jid = phoneToJid(agent.phone);
    if (!jid) {
        log(`⚠️ Agent ${agent.name} has no valid phone — notification skipped`, 'warn');
        return;
    }

    const phoneDisplay = lead.customerPhone === 'pending'
        ? '_(pendiente — el cliente lo compartirá pronto)_'
        : lead.customerPhone;

    const trimmedMessage = lead.message
        ? `💬 _"${lead.message.slice(0, 120)}${lead.message.length > 120 ? '…' : ''}"_\n`
        : '';

    const text =
        `🔔 *Nuevo lead asignado*\n\n` +
        `👤 *${lead.customerName}*\n` +
        `📞 ${phoneDisplay}\n` +
        `🏠 ${lead.interest}\n` +
        trimmedMessage +
        `\n📥 Fuente: ${lead.source === 'whatsapp' ? 'WhatsApp' : lead.source}\n\n` +
        `👉 Ver en el panel:\n${API_BASE_URL}/agent/dashboard`;

    try {
        await sock.sendMessage(jid, { text });
        log(`🔔 Agent notified: ${agent.name} (${agent.phone})`, 'success');
    } catch (err) {
        log(`❌ Failed to notify agent ${agent.name}: ${err.message}`, 'error');
    }
}

module.exports = { handleReference, handleReferenceAction };