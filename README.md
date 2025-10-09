# Stable Master Bot 🤖

A chill crypto Telegram bot with LLM integration and conversation memory. Stable Master helps calm FUD and provides thoughtful crypto insights with a laid-back personality.

## Features

- 🧠 **LLM Integration**: Uses OpenAI GPT-4 for intelligent conversations
- 💾 **Conversation Memory**: Stores and recalls chat history with SQLite
- ✏️ **Response Editing**: Edit previous bot responses to improve future interactions
- 😎 **Chill Personality**: Specially designed to calm crypto FUD and provide balanced perspective
- 🔧 **Admin Commands**: Memory management and conversation control
- 🛡️ **Anti-Spam Protection**: Automatically deletes promotion messages with escalating penalties
- 🚫 **Three-Strike System**: Warning → 3hr mute → permanent ban for repeat offenders
- 🌐 **Render Ready**: Built for easy deployment on Render with health endpoints

## Quick Setup

### 1. Get Your API Keys

**Telegram Bot Token:**
1. Message [@BotFather](https://t.me/botfather) on Telegram
2. Send `/newbot` and follow the prompts
3. Copy your bot token

**OpenAI API Key:**
1. Go to [OpenAI API](https://platform.openai.com/api-keys)
2. Create a new API key
3. Make sure you have credits available

### 2. Local Development

```bash
# Clone/navigate to the project
cd stable-master-bot

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit .env with your tokens
# TELEGRAM_TOKEN=your_telegram_bot_token
# OPENAI_API_KEY=your_openai_api_key

# Start the bot
npm run dev
```

### 3. Deploy on Render

1. **Create a Web Service** on [Render](https://render.com)
2. **Connect your repository**
3. **Configure the service:**
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Environment:** Node
4. **Add Environment Variables:**
   - `TELEGRAM_TOKEN` = your telegram bot token
   - `OPENAI_API_KEY` = your openai api key
   - `PORT` = 3000 (Render will set this automatically)

5. **Deploy!** Render will automatically deploy and keep your bot running.

## Bot Commands

- `/start` - Welcome message and bot introduction
- `/memory` - View recent conversation history
- `/edit [id] [new_response]` - Edit a previous bot response
- `/clear` - Clear conversation memory for this chat
- `/vibe` - Get Stable Master's current market sentiment
- `/modstats` - View moderation statistics (admin only)

## Bot Personality

Stable Master is designed to be:
- **Exceptionally calm** during market turbulence
- **Knowledgeable but not preachy** about crypto
- **Empathetic** to people's concerns and emotions
- **Encouraging** of healthy trading/investing habits
- **Focused on long-term perspective** over short-term noise

## Memory System

The bot remembers conversations using SQLite and can:
- Store unlimited conversation history
- Recall context for better responses
- Allow editing of previous responses for learning
- Clean up old conversations to manage storage
- Provide conversation statistics

## Anti-Spam Protection

**Automatic Detection:**
- Telegram invite links (`https://t.me/+ABC123`, `t.me/joinchat/XYZ`)
- Token promotion keywords (moon, 100x, pump, gem, presale)
- Channel/group promotion phrases
- Contract addresses and crypto signals

**Three-Strike System:**
1. **First violation**: Warning message + message deletion
2. **Second violation**: 3-hour mute + message deletion  
3. **Third+ violation**: Permanent ban

**Admin Requirements:**
- Bot needs admin permissions to delete messages and restrict users
- Use `/modstats` to view moderation statistics
- Admins are exempt from moderation actions

## Health Monitoring

The bot includes health endpoints for monitoring:
- `GET /health` - Basic health check
- `GET /status` - Detailed bot status
- `GET /stats` - Usage statistics
- `GET /` - Root endpoint with info

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `TELEGRAM_TOKEN` | Yes | Your Telegram bot token from BotFather |
| `OPENAI_API_KEY` | Yes | Your OpenAI API key |
| `PORT` | No | Server port (default: 3000) |
| `DB_PATH` | No | SQLite database path (default: ./conversations.db) |
| `MAX_CONTEXT_MESSAGES` | No | Context window size (default: 10) |
| `RESPONSE_MAX_TOKENS` | No | Max response length (default: 500) |
| `TEMPERATURE` | No | LLM creativity level (default: 0.8) |

## File Structure

```
stable-master-bot/
├── bot.js              # Main bot logic and command handling
├── memory.js           # SQLite conversation storage system
├── personality.js      # Stable Master personality and responses
├── moderation.js       # Anti-spam and moderation system
├── server.js           # Health check server for Render
├── package.json        # Dependencies and scripts
├── .env.example        # Environment variable template
└── README.md           # This file
```

## Usage Tips

1. **Edit Responses**: Use `/edit [id] [new_response]` to teach the bot better responses
2. **Memory Management**: Use `/clear` if conversations get too long or off-track
3. **Monitor Health**: Check the `/health` endpoint to ensure the bot is running
4. **FUD Calming**: The bot automatically detects and responds to crypto anxiety with calm perspective
5. **Admin Setup**: Make the bot admin in your group to enable message deletion and user restrictions
6. **Moderation Stats**: Use `/modstats` to monitor spam protection effectiveness

## Contributing

Feel free to improve Stable Master's personality, add new features, or enhance the memory system!

---

Stay chill, stay stable! 😎📈