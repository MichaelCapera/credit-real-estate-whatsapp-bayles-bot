const { test, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const { TEST_TOKEN, loadModules, mockSock, mockFetch, captureLogs, clearTimers, flush } = require('./helpers');

const SENDER = '573001234567@s.whatsapp.net';
const MSG = { key: { remoteJid: SENDER, fromMe: false, id: 'x' } };
const AGENT = { uuid: 'agent-uuid', name: 'Laura', phone: '3153045383' };

let mods;
let calls;
let logs;

afterEach(() => {
    calls?.restore();
    logs?.restore();
    if (mods) clearTimers(mods.state);
});

function setup({ agentStatus = 200, leadStatus = 200, token } = {}) {
    mods = loadModules(token);
    calls = mockFetch({
        '/api/agent?id=': {
            status: agentStatus,
            body: agentStatus === 200 ? { success: true, agent: AGENT } : { success: false },
        },
        '/api/lead': {
            status: leadStatus,
            body: leadStatus === 200 ? { success: true, lead_id: 99, agent_assigned: true } : { success: false },
        },
        [mods.config.PROPERTIES_API_URL]: { body: [{ id: '498', title: 'Apto Chapinero', price: 350000000 }] },
    });
    logs = captureLogs();
    return mockSock();
}

const callTo = (part) => calls.find((c) => c.url.includes(part));

test('ignores messages without a reference', async () => {
    const sock = setup();
    const handled = await mods.reference.handleReference(sock, SENDER, 'Pedro', 'hola', MSG);
    assert.equal(handled, false);
    assert.equal(calls.length, 0);
});

test('GET /api/agent sends X-Bot-Token', async () => {
    const sock = setup();
    await mods.reference.handleReference(sock, SENDER, 'Pedro', 'Hola (Ref: #498a2)', MSG);

    const call = callTo('/api/agent?id=2');
    assert.ok(call, 'agent endpoint was called');
    assert.equal(call.options.method, 'GET');
    assert.deepEqual(call.options.headers, { 'X-Bot-Token': TEST_TOKEN });
});

test('POST /api/lead sends X-Bot-Token, Content-Type and the lead payload', async () => {
    const sock = setup();
    await mods.reference.handleReference(sock, SENDER, 'Pedro', 'Hola (Ref: #498a2)', MSG);
    await flush();

    const call = callTo('/api/lead');
    assert.ok(call, 'lead endpoint was called');
    assert.equal(call.options.method, 'POST');
    assert.deepEqual(call.options.headers, { 'Content-Type': 'application/json', 'X-Bot-Token': TEST_TOKEN });
    assert.deepEqual(JSON.parse(call.options.body), {
        type: 'property',
        name: 'Pedro',
        phone: '573001234567',
        interest: 'Ref #498',
        agent_uuid: 'agent-uuid',
        source: 'whatsapp',
        message: 'Hola (Ref: #498a2)',
    });
});

test('does not send X-Bot-Token to the properties API', async () => {
    const sock = setup();
    await mods.reference.handleReference(sock, SENDER, 'Pedro', 'Ref #498a2', MSG);

    const call = callTo(mods.config.PROPERTIES_API_URL);
    assert.ok(call, 'properties API was called');
    assert.equal(call.options.headers, undefined);
});

test('replies to the customer and notifies the agent on success', async () => {
    const sock = setup();
    await mods.reference.handleReference(sock, SENDER, 'Pedro', 'Ref #498a2', MSG);
    await flush();

    const toCustomer = sock.sent.filter((m) => m.jid === SENDER).map((m) => m.content.text);
    assert.match(toCustomer[0], /Laura/);
    assert.match(toCustomer[0], /Apto Chapinero/);
    assert.match(toCustomer[1], /Agendar una visita/);
    assert.ok(sock.sent.some((m) => m.jid === '573153045383@s.whatsapp.net'), 'agent notified');
    assert.equal(mods.state.userState[SENDER].step, 'awaiting_reference_action');
});

test('on 401 logs the rejection and keeps the customer flow working', async () => {
    const sock = setup({ agentStatus: 401, leadStatus: 401 });
    await mods.reference.handleReference(sock, SENDER, 'Pedro', 'Ref #498a2', MSG);
    await flush();
    logs.restore();

    const rejections = logs.filter((l) => l.includes('API de la app rechazó el token (401)'));
    assert.equal(rejections.length, 2);
    assert.ok(logs.every((l) => !l.includes(TEST_TOKEN)));
    // Customer still gets the reference card and the action menu
    assert.equal(sock.sent.filter((m) => m.jid === SENDER).length, 2);
    assert.ok(!sock.sent.some((m) => m.jid !== SENDER), 'no agent notification without a saved lead');
});

test('omits X-Bot-Token when BOT_API_TOKEN is not configured', async () => {
    const sock = setup({ token: '' });
    await mods.reference.handleReference(sock, SENDER, 'Pedro', 'Ref #498a2', MSG);
    await flush();

    assert.deepEqual(callTo('/api/agent?id=').options.headers, {});
    assert.deepEqual(callTo('/api/lead').options.headers, { 'Content-Type': 'application/json' });
});
