const fs = require('fs');
const axios = require('axios');
const FormData = require('form-data');
const https = require('https');

let output = '';
function log(msg) {
    output += msg + '\n';
    console.log(msg);
}

async function testFetch() {
    const form = new FormData();
    form.append('appkey', 'test');
    form.append('authkey', 'test');
    form.append('to', '919999999999');
    form.append('message', 'test');

    log('--- Testing with native fetch ---');
    try {
        const res = await fetch('https://whatsboost.in/api/create-message', {
            method: 'POST',
            body: form,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                'Accept': 'application/json, text/plain, */*'
            }
        });
        const text = await res.text();
        log('Status: ' + res.status);
        log('Response: ' + text.substring(0, 500));
    } catch (e) {
        log('Fetch error: ' + e.message);
    }
}

async function testAxios() {
    const form = new FormData();
    form.append('appkey', 'test');
    form.append('authkey', 'test');
    form.append('to', '919999999999');
    form.append('message', 'test');

    log('\n--- Testing with Axios ---');
    try {
        const res = await axios.post('https://whatsboost.in/api/create-message', form, {
            headers: {
                ...form.getHeaders(),
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                'Accept': 'application/json, text/plain, */*'
            }
        });
        log('Status: ' + res.status);
        log('Response: ' + (typeof res.data === 'string' ? res.data.substring(0, 500) : JSON.stringify(res.data)));
    } catch (e) {
        log('Axios error status: ' + e.response?.status);
        log('Axios error data: ' + (typeof e.response?.data === 'string' ? e.response?.data.substring(0, 500) : JSON.stringify(e.response?.data)));
    }
}

async function run() {
    await testFetch();
    await testAxios();
    fs.writeFileSync('test-output.txt', output);
}

run();
