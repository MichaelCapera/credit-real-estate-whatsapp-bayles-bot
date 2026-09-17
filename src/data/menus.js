const MAIN_MENU = [
    { id: 1, label: 'Buscar propiedades en Colombia', action: 'colombia' },
    { id: 2, label: 'Invertir en Miami (USA)', action: 'miami' },
    { id: 3, label: 'Precalificar para tarjeta de crédito', action: 'credit_card' },
    { id: 4, label: 'Vender o poner en arriendo una propiedad', action: 'sell_rent' }
];

const OPERATION_TYPES = [
    { id: 1, label: 'Comprar', keyword: 'VENTA' },
    { id: 2, label: 'Arrendar', keyword: 'ARRIENDO' },
    { id: 3, label: 'Ambos (compra y arriendo)', keyword: null }
];

const PROPERTY_TYPES = [
    { id: 1, label: 'Apartamento' },
    { id: 2, label: 'Casa' },
    { id: 3, label: 'Casa Campestre' },
    { id: 4, label: 'Lote / Terreno' },
    { id: 5, label: 'Finca' },
    { id: 6, label: 'Oficina' },
    { id: 7, label: 'Todos los tipos' }
];

const PRICE_RANGES = [
    { id: 1, label: 'Menos de $200M', min: 0, max: 200000000 },
    { id: 2, label: '$200M - $400M', min: 200000000, max: 400000000 },
    { id: 3, label: '$400M - $600M', min: 400000000, max: 600000000 },
    { id: 4, label: '$600M - $1.000M', min: 600000000, max: 1000000000 },
    { id: 5, label: 'Más de $1.000M', min: 1000000000, max: Infinity },
    { id: 6, label: 'Sin límite', min: 0, max: Infinity }
];

const MIAMI_INVESTMENT_TIMES = [
    { id: 1, label: 'Menos de 6 meses', months: 6 },
    { id: 2, label: '6 meses - 1 año', months: 12 },
    { id: 3, label: '1 - 2 años', months: 24 },
    { id: 4, label: 'Más de 2 años', months: 36 }
];

const MIAMI_BUDGETS = [
    { id: 1, label: 'Menos de $100,000 USD' },
    { id: 2, label: '$100,000 - $300,000 USD' },
    { id: 3, label: '$300,000 - $500,000 USD' },
    { id: 4, label: '$500,000 - $1,000,000 USD' },
    { id: 5, label: 'Más de $1,000,000 USD' },
    { id: 6, label: 'Sin límite' }
];

const SELL_RENT_PROPERTY_TYPES = [
    { id: 1, label: 'Apartamento' },
    { id: 2, label: 'Casa' },
    { id: 3, label: 'Casa Campestre' },
    { id: 4, label: 'Lote / Terreno' },
    { id: 5, label: 'Finca' },
    { id: 6, label: 'Oficina' },
    { id: 7, label: 'Otro (escríbelo)' }
];

module.exports = {
    MAIN_MENU,
    OPERATION_TYPES,
    PROPERTY_TYPES,
    PRICE_RANGES,
    MIAMI_INVESTMENT_TIMES,
    MIAMI_BUDGETS,
    SELL_RENT_PROPERTY_TYPES
};