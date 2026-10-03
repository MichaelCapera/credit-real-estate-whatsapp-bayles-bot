// ============================================
// 🔎 CHECK — Syntax check every JS file and load the full module tree
// Run: npm run check (works on Windows, Linux and CI)
// ============================================

const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DIRS = ['src', 'tests', 'scripts'];
const FILES = ['index.js', 'simulator.js'];

function jsFiles(dir) {
    if (!fs.existsSync(dir)) return [];
    return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
        const full = path.join(dir, e.name);
        if (e.isDirectory()) return jsFiles(full);
        return e.name.endsWith('.js') ? [full] : [];
    });
}

const files = [
    ...FILES.map((f) => path.join(ROOT, f)),
    ...DIRS.flatMap((d) => jsFiles(path.join(ROOT, d))),
];

let failed = 0;
for (const file of files) {
    try {
        execFileSync(process.execPath, ['--check', file], { stdio: 'pipe' });
    } catch (err) {
        failed++;
        console.error(`✖ ${path.relative(ROOT, file)}\n${err.stderr}`);
    }
}

// Requiring the message handler loads every flow, handler and formatter,
// catching broken imports that --check alone can't see.
try {
    require(path.join(ROOT, 'src', 'handlers', 'message'));
} catch (err) {
    failed++;
    console.error(`✖ Failed to load src/handlers/message: ${err.message}`);
}

if (failed) {
    console.error(`\n${failed} problem(s) found`);
    process.exit(1);
}
console.log(`✔ ${files.length} files without syntax errors, module tree loads`);
process.exit(0);
