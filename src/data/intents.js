const INTENT_PATTERNS = [
    {
        id: 'credit_card',
        keywords: ['tarjeta', 'credito', 'crf', 'gold', 'precalificar', 'cupo', 'plastico'],
        action: 'credit_card',
        priority: 1,
        description: 'Solicitud de tarjeta de crédito'
    },
    {
        id: 'property_buy',
        keywords: ['comprar', 'casa', 'apartamento', 'propiedad', 'inmueble', 'terreno', 'lote'],
        action: 'colombia',
        priority: 2,
        description: 'Búsqueda de propiedades'
    },
    {
        id: 'miami',
        keywords: ['miami', 'usa', 'estados unidos', 'invertir', 'dolar'],
        action: 'miami',
        priority: 3,
        description: 'Inversión en Miami'
    },
    {
        id: 'sell_rent',
        keywords: ['vender', 'arrendar', 'alquilar', 'publicar', 'venta', 'arriendo'],
        action: 'sell_rent',
        priority: 4,
        description: 'Vender o arrendar propiedad'
    }
];

module.exports = { INTENT_PATTERNS };