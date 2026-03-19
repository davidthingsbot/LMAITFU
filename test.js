// LMAITFU Test Suite
// Run with: node test.js

const https = require('https');
const http = require('http');

const TESTS = [];
let passed = 0;
let failed = 0;

function test(name, fn) {
    TESTS.push({ name, fn });
}

async function runTests() {
    console.log('🧪 LMAITFU Test Suite\n');
    
    for (const t of TESTS) {
        process.stdout.write(`  ${t.name}... `);
        try {
            await t.fn();
            console.log('✅');
            passed++;
        } catch (e) {
            console.log(`❌ ${e.message}`);
            failed++;
        }
    }
    
    console.log(`\n${passed} passed, ${failed} failed`);
    process.exit(failed > 0 ? 1 : 0);
}

// Helper to make HTTP requests
function fetch(url, options = {}) {
    return new Promise((resolve, reject) => {
        const isHttps = url.startsWith('https');
        const lib = isHttps ? https : http;
        
        const req = lib.get(url, { timeout: 60000 }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve({ 
                ok: res.statusCode >= 200 && res.statusCode < 300,
                status: res.statusCode,
                headers: res.headers,
                text: () => Promise.resolve(data),
                json: () => Promise.resolve(JSON.parse(data))
            }));
        });
        
        req.on('error', reject);
        req.on('timeout', () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });
    });
}

// Delay helper
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// ============ TESTS ============

test('Local server is running', async () => {
    const res = await fetch('http://localhost:8080/');
    if (!res.ok) throw new Error(`Server returned ${res.status}`);
});

test('HTML page loads', async () => {
    const res = await fetch('http://localhost:8080/');
    const html = await res.text();
    if (!html.includes('<title>LMAITFU')) throw new Error('Title not found');
    if (!html.includes('id="setup-mode"')) throw new Error('Setup mode div not found');
    if (!html.includes('id="animation-mode"')) throw new Error('Animation mode div not found');
});

test('JavaScript file loads', async () => {
    const res = await fetch('http://localhost:8080/app.js');
    if (!res.ok) throw new Error(`JS returned ${res.status}`);
    const js = await res.text();
    if (!js.includes('callPollinations')) throw new Error('callPollinations function not found');
});

test('CSS file loads', async () => {
    const res = await fetch('http://localhost:8080/styles.css');
    if (!res.ok) throw new Error(`CSS returned ${res.status}`);
});

test('Pollinations API responds', async () => {
    const query = encodeURIComponent('What is 2+2? Reply with just the number.');
    const res = await fetch(`https://text.pollinations.ai/${query}`);
    if (!res.ok) throw new Error(`API returned ${res.status}`);
    const text = await res.text();
    if (text.length < 1) throw new Error('Empty response');
});

test('Pollinations API has CORS headers', async () => {
    const res = await fetch('https://text.pollinations.ai/test');
    const cors = res.headers['access-control-allow-origin'];
    if (cors !== '*') throw new Error(`CORS header: ${cors}`);
});

test('Pollinations API handles queries', async () => {
    // Use a simple query to avoid timeouts
    const query = 'Say hello briefly';
    const encoded = encodeURIComponent(query);
    
    const res = await fetch(`https://text.pollinations.ai/${encoded}`);
    if (res.status === 429) throw new Error('Rate limited - try again later');
    if (!res.ok) throw new Error(`API returned ${res.status}`);
    const text = await res.text();
    if (text.length < 2) throw new Error(`Response too short: ${text.length} chars`);
});

test('URL encoding works for special characters', async () => {
    // Wait to avoid rate limit
    await delay(2000);
    const query = "Hi there";
    const encoded = encodeURIComponent(query);
    const res = await fetch(`https://text.pollinations.ai/${encoded}`);
    if (res.status === 429) throw new Error('Rate limited - try again later');
    if (!res.ok) throw new Error(`API returned ${res.status}`);
});

test('Query parameter encoding/decoding', () => {
    const original = "How do I center a div in CSS?";
    const encoded = Buffer.from(encodeURIComponent(original)).toString('base64');
    const decoded = decodeURIComponent(Buffer.from(encoded, 'base64').toString());
    if (decoded !== original) throw new Error(`Mismatch: ${decoded}`);
});

test('Provider selection exists in HTML', async () => {
    const res = await fetch('http://localhost:8080/');
    const html = await res.text();
    if (!html.includes('pollinations')) throw new Error('Pollinations option not in HTML');
    if (!html.includes('use-free-btn')) throw new Error('Free button not found');
});

// Run all tests
runTests();
