// Check Telegram bot status and clear webhooks
require('dotenv').config();
const https = require('https');

const TOKEN = process.env.TELEGRAM_TOKEN;

if (!TOKEN) {
  console.error('❌ TELEGRAM_TOKEN not found in environment');
  process.exit(1);
}

console.log('🔍 Checking Telegram bot status...\n');

// Check webhook info
const webhookUrl = `https://api.telegram.org/bot${TOKEN}/getWebhookInfo`;

https.get(webhookUrl, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const info = JSON.parse(data);
    console.log('📡 Webhook Info:', JSON.stringify(info, null, 2));

    if (info.result && info.result.url) {
      console.log('\n⚠️  WEBHOOK IS SET! This conflicts with polling.');
      console.log('🔧 Deleting webhook...\n');

      // Delete webhook
      const deleteUrl = `https://api.telegram.org/bot${TOKEN}/deleteWebhook?drop_pending_updates=true`;
      https.get(deleteUrl, (res2) => {
        let data2 = '';
        res2.on('data', chunk => data2 += chunk);
        res2.on('end', () => {
          console.log('✅ Webhook deleted:', data2);
          console.log('\n🔄 Now restart your bot service on Render.');
        });
      });
    } else {
      console.log('\n✅ No webhook set - polling should work.');
      console.log('⚠️  The 409 error means ANOTHER INSTANCE is polling.');
      console.log('\n🔍 Check Render dashboard for duplicate services!');
      console.log('   Go to: https://render.com/dashboard');
      console.log('   Delete ALL bot services, wait 2 minutes, then redeploy ONE service.');
    }
  });
}).on('error', (err) => {
  console.error('❌ Error:', err.message);
});
