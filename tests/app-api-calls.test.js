// Static guard: every call to the web app API (API_BASE_URL/api/...) must send appApiHeaders().
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, '..', 'src');

function jsFiles(dir) {
    return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
        const full = path.join(dir, e.name);
        if (e.isDirectory()) return jsFiles(full);
        return e.name.endsWith('.js') ? [full] : [];
    });
}

test('every fetch to the app API uses appApiHeaders()', () => {
    let checked = 0;
    for (const file of jsFiles(SRC)) {
        const code = fs.readFileSync(file, 'utf8');
        // Each fetch(...) call up to its terminating ");"
        for (const m of code.matchAll(/fetch\(([^;]*?)\);/gs)) {
            const call = m[1];
            const target = call.split(',')[0].trim();
            const isAppApi = /API_BASE_URL\}\/api\//.test(target) ||
                (target === 'url' && /const url = `\$\{API_BASE_URL\}\/api\//.test(code));
            if (!isAppApi) continue;
            checked++;
            assert.match(call, /appApiHeaders\(/, `${path.relative(SRC, file)}: ${target} is missing appApiHeaders()`);
        }
    }
    assert.equal(checked, 3, 'expected exactly 3 app API calls (agentmagiclink, agent, lead)');
});
