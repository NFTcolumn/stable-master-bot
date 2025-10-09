# Deployment Guide for Render

## Prerequisites
- [Render Account](https://render.com) (free tier available)
- GitHub repository with your bot code
- Telegram Bot Token from [@BotFather](https://t.me/botfather)
- OpenAI API Key with available credits

## Step-by-Step Render Deployment

### 1. Prepare Your Repository
```bash
# Make sure your code is committed to Git
cd stable-master-bot
git init
git add .
git commit -m "Initial Stable Master Bot setup"

# Push to GitHub (create a new repo first)
git remote add origin https://github.com/yourusername/stable-master-bot.git
git branch -M main
git push -u origin main
```

### 2. Create Render Web Service

1. **Login to Render** at [render.com](https://render.com)
2. **Click "New +" → "Web Service"**
3. **Connect GitHub** and select your repository
4. **Configure Service:**
   - **Name:** `stable-master-bot` (or your preferred name)
   - **Region:** Choose closest to your users
   - **Branch:** `main`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Instance Type:** Free (for testing) or Starter+ (for production)

### 3. Environment Variables

In Render's dashboard, add these environment variables:

| Key | Value |
|-----|-------|
| `TELEGRAM_TOKEN` | Your bot token from BotFather |
| `OPENAI_API_KEY` | Your OpenAI API key |
| `NODE_ENV` | `production` |
| `PORT` | Leave empty (Render sets this automatically) |

### 4. Deploy Settings

- **Auto-Deploy:** Enable (deploys on every git push)
- **Health Check Path:** `/health`
- **Build & Deploy:** Automatic on creation

### 5. Post-Deployment

1. **Check Deployment Logs** in Render dashboard
2. **Test Health Endpoint:** Visit `https://your-service-name.onrender.com/health`
3. **Test Bot:** Send `/start` to your bot on Telegram
4. **Monitor:** Check `/status` endpoint for bot information

## Database Persistence

**Important:** Render's free tier has **ephemeral storage** - your SQLite database will be reset on each deployment/restart.

For persistent storage options:
- **Upgrade to Paid Plan:** Persistent disk storage
- **External Database:** PostgreSQL, MongoDB Atlas, or PlanetScale
- **Cloud Storage:** Upload conversation backups to S3/Google Cloud

## Troubleshooting

### Bot Not Responding
1. Check Render logs for errors
2. Verify environment variables are set correctly
3. Test `/health` endpoint - should return healthy status
4. Ensure Telegram token is valid and bot is not used elsewhere

### OpenAI Errors
1. Check API key is valid and has credits
2. Monitor usage in OpenAI dashboard
3. Verify model access (GPT-4 requires paid account)

### Memory Issues
1. Check database file exists: `/status` endpoint shows database_connected
2. For persistent storage, upgrade Render plan or use external database

## Monitoring

- **Health Check:** `GET /health`
- **Bot Status:** `GET /status`  
- **Render Metrics:** CPU, Memory, Response Time in dashboard
- **Logs:** Real-time logs in Render dashboard

## Scaling

- **Free Tier:** Good for testing, <100 daily active users
- **Starter:** $7/month, good for 100-1000 users
- **Standard+:** For higher usage, persistent storage

## Security

- Never commit `.env` file to git
- Use Render's environment variables for secrets
- Regularly rotate API keys
- Monitor API usage for unexpected spikes

---

Your Stable Master Bot should now be live and ready to chill out the crypto community! 🚀