const { log } = require('./logger');
const { OPERATION_TYPES, PRICE_RANGES } = require('./data/menus');
const { COLOMBIA_CITIES } = require('./state');

async function callPropertiesAPI() {
    try {
        const API_URL = 'https://8xuawsbnzg.execute-api.us-east-1.amazonaws.com/dev/data-properties';

        const response = await fetch(API_URL, {
            method: 'GET',
            headers: {
                'accept': 'application/json, text/plain, */*',
                'content-type': 'application/json',
                'user-agent': 'WhatsApp-Bot/1.0'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP Error: ${response.status}`);
        }

        const data = await response.json();
        log(`📥 API returned ${data.length} properties`, 'info');
        return data;
    } catch (error) {
        log(`Error calling API: ${error.message}`, 'error');
        return null;
    }
}

function filterProperties(properties, filters) {
    if (!properties || properties.length === 0) return [];

    return properties.filter(prop => {
        if (filters.operation && filters.operation !== 'Ambos (compra y arriendo)') {
            const operationKeyword = OPERATION_TYPES.find(op => op.label === filters.operation)?.keyword;
            if (operationKeyword) {
                const title = (prop.title || '').toUpperCase();
                const desc = (prop.description || '').toUpperCase();
                const combined = title + ' ' + desc;
                if (!combined.includes(operationKeyword)) {
                    return false;
                }
            }
        }

        if (filters.city && filters.city !== 'Todas las ciudades') {
            const cityMatch = prop.description?.toLowerCase().includes(filters.city.toLowerCase());
            if (!cityMatch) return false;
        }

        if (filters.property_type && filters.property_type !== 'Todos los tipos') {
            const typeMatch = prop.property_type?.toLowerCase() === filters.property_type.toLowerCase();
            if (!typeMatch) return false;
        }

        if (filters.price_range) {
            const range = PRICE_RANGES.find(r => r.id === filters.price_range);
            if (range) {
                const price = prop.price || 0;
                if (price < range.min || price > range.max) return false;
            }
        }

        return true;
    });
}

function extractCitiesFromProperties(properties) {
    if (!properties || properties.length === 0) return COLOMBIA_CITIES;

    const cities = new Set();

    properties.forEach(prop => {
        const text = (prop.description || '') + ' ' + (prop.title || '');
        COLOMBIA_CITIES.forEach(city => {
            if (text.toLowerCase().includes(city.toLowerCase())) {
                cities.add(city);
            }
        });
    });

    const result = Array.from(cities).sort();
    return result.length > 0 ? result : COLOMBIA_CITIES;
}

module.exports = { callPropertiesAPI, filterProperties, extractCitiesFromProperties };