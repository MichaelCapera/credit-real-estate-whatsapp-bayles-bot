// ============================================
// 🧪 TEST HELPERS — Shared mocks for unit tests
// ============================================

const path = require('path');

const SRC = path.join(__dirname, '..', 'src');
const TEST_TOKEN = 'test-token-0123456789abcdef';

/**
 * Load src modules with a fresh require cache so config.js re-reads process.env.
 * Pass token = '' to simulate a missing BOT_API_TOKEN.
 */
function loadModules(token = TEST_TOKEN) {
    for (const key of Object.keys(require.cache)) {
        if (key.startsWith(SRC)) delete require.cache[key];
    }
    if (token) process.env.BOT_API_TOKEN = token;
    else delete process.env.BOT_API_TOKEN;

    return {
        config: require(path.join(SRC, 'config')),
        state: require(path.join(SRC, 'state')),
        agentAccess: require(path.join(SRC, 'handlers', 'agent-access')),
        reference: require(path.join(SRC, 'handlers', 'reference')),
    };
}

/** Fake Baileys socket that records every outgoing message. */
function mockSock() {
    const sent = [];
    return {
        sent,
        sendMessage: async (jid, content) => {
            sent.push({ jid, content });
            return { key: { id: `mock-${sent.length}` } };
        },
    };
}

/**
 * Replace global fetch. `routes` maps a URL substring to { status, body }.
 * Returns the list of recorded calls; call restore() when done.
 */
function mockFetch(routes) {
    const calls = [];
    const original = global.fetch;
    global.fetch = async (url, options = {}) => {
        calls.push({ url: String(url), options });
        const match = Object.keys(routes).find((k) => String(url).includes(k));
        if (!match) throw new Error(`Unexpected fetch: ${url}`);
        const { status = 200, body = {} } = routes[match];
        return { status, ok: status < 400, json: async () => body };
    };
    calls.restore = () => { global.fetch = original; };
    return calls;
}

/** Capture console.log output (the logger writes there). */
function captureLogs() {
    const lines = [];
    const original = console.log;
    console.log = (...args) => lines.push(args.join(' '));
    lines.restore = () => { console.log = original; };
    return lines;
}

/** Clear the 5-minute inactivity timers and user state so the test process can exit. */
function clearTimers(state) {
    for (const key of Object.keys(state.userTimers)) {
        clearTimeout(state.userTimers[key]);
        delete state.userTimers[key];
    }
    for (const key of Object.keys(state.userState)) delete state.userState[key];
}

/** Wait for fire-and-forget promises (e.g. createLead) to settle. */
const flush = () => new Promise((resolve) => setImmediate(resolve));

module.exports = { TEST_TOKEN, loadModules, mockSock, mockFetch, captureLogs, clearTimers, flush };
