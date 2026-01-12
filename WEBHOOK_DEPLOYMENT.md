# Webhook Deployment Guide for Render

## What Changed?

Your bot now supports **webhooks** for production (Render) and **polling** for local development. This eliminates the 409 conflict errors.

## How to Deploy

### Step 1: Add Environment Variable to Render

1. Go to your Render dashboard: https://render.com/dashboard
2. Select your `stable-master-bot` service
3. Go to **Environment** tab
4. Add this new variable:
   - **Key:** `RENDER`
   - **Value:** `true`
5. Click **Save Changes**

**Note:** `RENDER_EXTERNAL_HOSTNAME` is automatically set by Render, so you don't need to add it manually.

### Step 2: Deploy the Updated Code

```bash
# Commit and push the webhook changes
git add .
git commit -m "Switch to webhooks for production deployment"
git push origin main
```

Render will automatically deploy the new version.

### Step 3: Verify Deployment

Watch your Render logs. You should see:

```
🌐 Using webhook mode for production...
🧹 Cleared any existing webhooks
✅ Webhook set to: https://your-service.onrender.com/webhook
📬 Webhook endpoint enabled at /webhook
📋 Roll Call database initialized
👋 New member greeting system activated!
🎉 Community engagement system activated!
🤖 Stable Master Bot initialized and ready to chill...
🌐 Health server running on port 3000
```

**NO MORE** `polling_error` messages! ✅

## How It Works

### Production (Render)
- When `RENDER=true`, the bot uses **webhooks**
- Telegram sends updates to: `https://your-service.onrender.com/webhook`
- No polling = no conflicts
- More efficient and reliable

### Local Development
- When `RENDER` is not set, the bot uses **polling**
- Works just like before for local testing
- No webhook setup needed

## Troubleshooting

### If you still see 409 errors after deployment:

1. **Wait 2-3 minutes** after deployment for old instances to fully shut down
2. **Manual restart:** In Render dashboard, click "Manual Deploy" → "Clear build cache & deploy"
3. **Check webhook status:**
   ```bash
   node check-telegram.js
   ```
   Should show: "No webhook set" (because webhook is managed by the bot now)

### If webhook isn't working:

Check Render logs for:
- ✅ `Webhook set to: https://...` - means webhook is configured
- ❌ `Error setting webhook` - check that `RENDER_EXTERNAL_HOSTNAME` exists

You can verify webhook in Telegram:
```bash
curl https://api.telegram.org/bot<YOUR_TOKEN>/getWebhookInfo
```

## Benefits of Webhooks

✅ **No more 409 conflicts** - only one webhook can be set  
✅ **More reliable** - Telegram pushes updates to you  
✅ **Lower latency** - instant updates vs polling every second  
✅ **Less resource usage** - no constant polling  
✅ **Production-ready** - recommended by Telegram for deployed bots

## Rollback (if needed)

If you need to go back to polling-only:

1. In Render, delete the `RENDER` environment variable
2. Or set `RENDER=false`
3. Redeploy

The bot will automatically switch back to polling mode.
