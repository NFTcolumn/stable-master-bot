# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is **Stable Master Bot**, a Telegram bot for a crypto trading community focused on the $PONY token and Pixel Pony racing game. The bot has a distinct personality as a passionate community member building a "pixel racing empire" and uses OpenAI GPT-4 for intelligent conversations with persistent memory.

## Development Commands

```bash
# Install dependencies
npm install

# Start in development mode (with auto-restart)
npm run dev

# Start in production mode
npm start
```

## Architecture

### Core Components

- **bot.js** - Main application orchestrator, command handling, message routing
- **personality.js** - Defines bot personality, system prompts, FUD calming responses  
- **memory.js** - SQLite-based conversation storage and retrieval system
- **moderation.js** - Anti-spam/promotion detection with three-strike system
- **server.js** - Express health check server for Render deployment

### Key Systems

**Conversation Memory System:**
- Stores all messages in SQLite with edit history tracking
- Provides conversation context to GPT-4 for coherent responses
- Supports response editing via `/edit [id] [new_response]` for bot learning
- Auto-cleanup of old messages to manage storage

**Dynamic Personality System:**
- Context-aware system prompts based on conversation tone and time of day
- Pre/post launch phases with different messaging strategies
- Template-based FUD calming responses for market volatility
- Empire-building themed responses with specific crypto project integration

**Moderation System:**
- Regex-based detection of Telegram invite links and token promotion
- Three-strike system: Warning → 3hr mute → permanent ban
- VIP user whitelist and admin bypass functionality
- Comprehensive logging of violations and deleted messages

**Community Engagement:**
- Automated periodic engagement messages every 5 minutes
- Context-aware hype responses when empire keywords are detected
- New member welcome system with AI-generated personalized greetings
- Activity tracking across multiple Telegram groups

## Environment Variables

Required:
- `TELEGRAM_TOKEN` - Bot token from @BotFather
- `OPENAI_API_KEY` - OpenAI API key for GPT-4 access

Optional:
- `PORT` - Server port (default: 3000)
- `DB_PATH` - SQLite database path (default: ./conversations.db)
- `MAX_CONTEXT_MESSAGES` - Context window size (default: 10)
- `RESPONSE_MAX_TOKENS` - Max response length (default: 500)
- `TEMPERATURE` - LLM creativity level (default: 0.8)

## Bot Personality Context

The bot operates as "Stable Master" - a passionate $PONY token holder building a pixel racing empire. Key personality traits:
- Extremely enthusiastic about the project vision
- Uses empire-building metaphors and gaming terminology
- Calms FUD with project-specific talking points
- Promotes community growth through sharing and participation
- Has extensive knowledge of the project's technical details and roadmap

The personality system dynamically adjusts based on launch status (pre/post launch), conversation context, and time of day for more engaging interactions.

## Database Schema

**conversations table:**
- Stores all chat messages with role, content, timestamps
- Supports message editing with original content preservation
- Indexed by chat_id and timestamp for efficient queries

**user_violations table:**
- Tracks moderation violations with escalating penalties
- Records mute/ban status and timestamps
- Links to deleted message logs for audit trail

## Deployment

Configured for Render deployment with:
- Health check endpoints (`/health`, `/status`, `/stats`)
- Graceful shutdown handling (SIGINT/SIGTERM)
- Express server for platform health monitoring
- Auto-restart capabilities via nodemon in development

## Testing & Quality

No automated test framework is currently configured. Testing is performed manually through Telegram interaction. Key areas to test:
- Message processing and GPT-4 response generation
- Memory storage and retrieval across conversations  
- Moderation system accuracy and escalation
- Community engagement timing and relevance