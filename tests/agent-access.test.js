const { test, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const { TEST_TOKEN, loadModules, mockSock, mockFetch, captureLogs, clearTimers } = require('./helpers');

const SENDER = '573001234567@s.whatsapp.net';
const msgFrom = (remoteJid, extra = {}) => ({ key: { remoteJid, fromMe: false, id: 'x', ...extra } });

let mods;
let calls;
let logs;

afterEach(() => {
    calls?.restore();
    logs?.restore();
    if (mods) clearTimers(mods.state);
});

test('ignores messages that are not an agent request', async () => {
    mods = loadModules();
    calls = mockFetch({});
    const sock = mockSock();
    const handled = await mods.agentAccess.handleAgentAccess(sock, SENDER, 'Ana', 'hola', msgFrom(SENDER));
    assert.equal(handled, false);
    assert.equal(calls.length, 0);
    assert.equal(sock.sent.length, 0);
});

test('sends X-Bot-Token and Content-Type to /api/agentmagiclink', async () => {
    mods = loadModules();
    calls = mockFetch({ '/api/agentmagiclink': { body: { success: true, name: 'Ana', url: 'https://x/magic' } } });
    logs = captureLogs();
    const sock = mockSock();

    const handled = await mods.agentAccess.handleAgentAccess(sock, SENDER, 'Ana', 'soy asesor', msgFrom(SENDER));

    assert.equal(handled, true);
    assert.equal(calls.length, 1);
    assert.match(calls[0].url, /\/api\/agentmagiclink$/);
    assert.equal(calls[0].options.method, 'POST');
    assert.deepEqual(calls[0].options.headers, { 'Content-Type': 'application/json', 'X-Bot-Token': TEST_TOKEN });
    assert.deepEqual(JSON.parse(calls[0].options.body), { phone: '573001234567' });
    assert.match(sock.sent[0].content.text, /https:\/\/x\/magic/);
});

test('extracts the phone from senderPn for @lid JIDs', async () => {
    mods = loadModules();
    calls = mockFetch({ '/api/agentmagiclink': { body: { success: true, name: 'Ana', url: 'u' } } });
    logs = captureLogs();
    const lid = '228165909754087:3@lid';

    await mods.agentAccess.handleAgentAccess(mockSock(), lid, 'Ana', 'soy asesor',
        msgFrom(lid, { senderPn: '573153045383:12@s.whatsapp.net' }));

    assert.deepEqual(JSON.parse(calls[0].options.body), { phone: '573153045383' });
});

test('logs a clear message on 401 and never logs the token', async () => {
    mods = loadModules();
    calls = mockFetch({ '/api/agentmagiclink': { status: 401, body: { success: false, message: 'Unauthorized' } } });
    logs = captureLogs();
    const sock = mockSock();

    await mods.agentAccess.handleAgentAccess(sock, SENDER, 'Ana', 'soy asesor', msgFrom(SENDER));
    logs.restore();

    assert.ok(logs.some((l) => l.includes('API de la app rechazó el token (401)')));
    assert.ok(logs.every((l) => !l.includes(TEST_TOKEN)));
    assert.match(sock.sent[0].content.text, /Unauthorized/);
});

test('omits X-Bot-Token when BOT_API_TOKEN is not configured', async () => {
    mods = loadModules('');
    calls = mockFetch({ '/api/agentmagiclink': { body: { success: true, name: 'Ana', url: 'u' } } });
    logs = captureLogs();

    await mods.agentAccess.handleAgentAccess(mockSock(), SENDER, 'Ana', 'soy asesor', msgFrom(SENDER));

    assert.deepEqual(calls[0].options.headers, { 'Content-Type': 'application/json' });
});
