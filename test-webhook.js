// Test webhook status
require('dotenv').config();
const https = require('https');

const TOKEN = process.env.TELEGRAM_TOKEN;

if (!TOKEN) {
    console.error('❌ TELEGRAM_TOKEN not found in environment');
    process.exit(1);
}

console.log('🔍 Checking webhook status...\n');

const webhookUrl = `https://api.telegram.org/bot${TOKEN}/getWebhookInfo`;

https.get(webhookUrl, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        const info = JSON.parse(data);

        if (info.ok) {
            const webhook = info.result;
            console.log('📡 Webhook Status:');
            console.log('   URL:', webhook.url || '(not set)');
            console.log('   Pending updates:', webhook.pending_update_count);
            console.log('   Last error date:', webhook.last_error_date ? new Date(webhook.last_error_date * 1000).toISOString() : 'none');
            console.log('   Last error message:', webhook.last_error_message || 'none');
            console.log('   Max connections:', webhook.max_connections);

            if (webhook.last_error_message) {
                console.log('\n⚠️  WEBHOOK HAS ERRORS!');
                console.log('   This means Telegram is trying to send updates but failing.');
                console.log('   Common causes:');
                console.log('   - Render service is sleeping (free tier)');
                console.log('   - /webhook endpoint not responding');
                console.log('   - SSL certificate issues');
            } else if (webhook.url) {
                console.log('\n✅ Webhook is set and working!');
                if (webhook.pending_update_count > 0) {
                    console.log(`   ${webhook.pending_update_count} updates waiting to be processed`);
                }
            } else {
                console.log('\n⚠️  No webhook set!');
            }
        } else {
            console.error('❌ Error:', info.description);
        }
    });
}).on('error', (err) => {
    console.error('❌ Error:', err.message);
});
