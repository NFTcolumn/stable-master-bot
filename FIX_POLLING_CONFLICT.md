# Fix Telegram Polling Conflict (409 Error)

## The Problem
Error: `ETELEGRAM: 409 Conflict: terminated by other getUpdates request`

This means **multiple instances** of your bot are trying to poll Telegram simultaneously.

## Solution Steps

### Step 1: Check Render Dashboard
1. Go to https://render.com/dashboard
2. Look for **ALL services** related to `stable-master-bot`
3. **Delete ALL instances** of the bot service
4. Wait 2-3 minutes for them to fully shut down

### Step 2: Check for Local Running Instance
```bash
# Check if bot is running locally
ps aux | grep "node bot.js"

# If found, kill it
pkill -f "node bot.js"
```

### Step 3: Clear Webhook (if set)
```bash
# Run the webhook checker
node check-telegram.js
```

This will:
- Check if a webhook is configured
- Automatically delete it if found
- Confirm polling is ready

### Step 4: Deploy ONLY ONE Instance
1. In Render dashboard, create **ONE NEW** web service
2. Connect to your GitHub repo: `NFTcolumn/stable-master-bot`
3. Use these settings:
   - **Build Command:** `npm install`
   - **Start Command:** `node bot.js`
   - **Environment Variables:**
     - `TELEGRAM_TOKEN` = your bot token
     - `ANTHROPIC_API_KEY` = your API key
     - `MAIN_CHAT_ID` = your chat ID (optional)
     - `PORT` = 3000

### Step 5: Verify Single Instance
After deployment, check logs:
- ✅ Should see: "🤖 Stable Master Bot initialized and ready to chill..."
- ✅ Should see: "🌐 Health server running on port 3000"
- ❌ Should NOT see: polling_error messages

## Prevention

### Use Webhooks Instead of Polling (Recommended for Production)

Webhooks are more reliable for production deployments on Render:

1. **Update bot.js** to use webhooks:
```javascript
// Replace line 13 in bot.js:
// OLD: this.bot = new TelegramBot(process.env.TELEGRAM_TOKEN, { polling: true });
// NEW:
const isProduction = process.env.NODE_ENV === 'production';
if (isProduction) {
  this.bot = new TelegramBot(process.env.TELEGRAM_TOKEN);
  const webhookUrl = `${process.env.RENDER_EXTERNAL_URL}/webhook`;
  this.bot.setWebHook(webhookUrl);
} else {
  this.bot = new TelegramBot(process.env.TELEGRAM_TOKEN, { polling: true });
}
```

2. **Add webhook endpoint** in bot.js constructor:
```javascript
if (isProduction) {
  this.setupWebhook();
}
```

3. **Add webhook handler** in bot.js:
```javascript
setupWebhook() {
  const express = require('express');
  const bodyParser = require('body-parser');
  
  const app = express();
  app.use(bodyParser.json());
  
  app.post('/webhook', (req, res) => {
    this.bot.processUpdate(req.body);
    res.sendStatus(200);
  });
  
  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`🌐 Webhook server running on port ${port}`);
  });
}
```

4. **Add to Render environment variables:**
   - `NODE_ENV` = `production`
   - `RENDER_EXTERNAL_URL` = your Render service URL (e.g., `https://stable-master-bot.onrender.com`)

## Quick Fix (Right Now)

If you need an immediate fix:

1. **Stop all Render deployments** (delete all bot services)
2. **Wait 3 minutes**
3. **Run webhook clearer:**
   ```bash
   node check-telegram.js
   ```
4. **Deploy ONE new instance**

## Verification

After fixing, your logs should show:
```
📋 Roll Call database initialized
👋 New member greeting system activated!
🎉 Community engagement system activated!
🤖 Stable Master Bot initialized and ready to chill...
🌐 Health server running on port 3000
```

**NO** polling errors!
