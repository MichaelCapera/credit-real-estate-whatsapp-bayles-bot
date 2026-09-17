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

module.exports = { NAV_LABELS, addNavigationOptions, getNavIds, formatMenu };