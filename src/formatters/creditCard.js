const { formatMenu } = require('../data/nav');
const { formatPrice } = require('../utils');

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

module.exports = { formatCreditCardIntro, formatCreditCardApproved };