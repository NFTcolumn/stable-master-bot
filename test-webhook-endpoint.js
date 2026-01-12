// Test if webhook endpoint is accessible
const https = require('https');

const testUrl = 'https://srv-d3o5e0ripnbc73fmrjd0.onrender.com/webhook';

console.log(`🔍 Testing webhook endpoint: ${testUrl}\n`);

const postData = JSON.stringify({
    update_id: 123456789,
    message: {
        message_id: 1,
        from: { id: 123, first_name: 'Test', is_bot: false },
        chat: { id: 123, type: 'private' },
        date: Math.floor(Date.now() / 1000),
        text: '/start'
    }
});

const options = {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': postData.length
    }
};

const req = https.request(testUrl, options, (res) => {
    console.log(`📡 Response Status: ${res.statusCode} ${res.statusMessage}`);

    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        if (res.statusCode === 200) {
            console.log('✅ Webhook endpoint is responding correctly!');
        } else if (res.statusCode === 404) {
            console.log('❌ Webhook endpoint returned 404 - route not found!');
            console.log('   This means the /webhook route is not registered.');
        } else {
            console.log(`⚠️  Unexpected status code: ${res.statusCode}`);
            console.log('Response:', data);
        }
    });
});

req.on('error', (err) => {
    console.error('❌ Request failed:', err.message);
});

req.write(postData);
req.end();
