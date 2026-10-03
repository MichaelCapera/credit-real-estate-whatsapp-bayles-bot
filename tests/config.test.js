const { test } = require('node:test');
const assert = require('node:assert/strict');
const { TEST_TOKEN, loadModules } = require('./helpers');

test('appApiHeaders adds X-Bot-Token when BOT_API_TOKEN is set', () => {
    const { config } = loadModules(TEST_TOKEN);
    assert.equal(config.BOT_API_TOKEN, TEST_TOKEN);
    assert.deepEqual(config.appApiHeaders(), { 'X-Bot-Token': TEST_TOKEN });
    assert.deepEqual(
        config.appApiHeaders({ 'Content-Type': 'application/json' }),
        { 'Content-Type': 'application/json', 'X-Bot-Token': TEST_TOKEN }
    );
});

test('appApiHeaders omits X-Bot-Token when BOT_API_TOKEN is empty', () => {
    const { config } = loadModules('');
    assert.equal(config.BOT_API_TOKEN, '');
    assert.deepEqual(config.appApiHeaders(), {});
    assert.deepEqual(
        config.appApiHeaders({ 'Content-Type': 'application/json' }),
        { 'Content-Type': 'application/json' }
    );
});

test('appApiHeaders does not mutate the extra headers object', () => {
    const { config } = loadModules(TEST_TOKEN);
    const extra = { 'Content-Type': 'application/json' };
    config.appApiHeaders(extra);
    assert.deepEqual(extra, { 'Content-Type': 'application/json' });
});
