const express = require('express');
const MemoryManager = require('./memory');

class HealthServer {
  constructor(bot, webhookBot = null) {
    this.app = express();
    this.port = process.env.PORT || 3000;
    this.bot = bot;
    this.webhookBot = webhookBot; // Bot instance for webhook processing
    this.memory = new MemoryManager();
    this.startTime = new Date();

    this.setupRoutes();
  }

  setupRoutes() {
    // Enable JSON parsing for webhook
    this.app.use(express.json());

    // Webhook endpoint for Telegram updates (production mode)
    if (this.webhookBot) {
      this.app.post('/webhook', (req, res) => {
        this.webhookBot.processUpdate(req.body);
        res.sendStatus(200);
      });
      console.log('📬 Webhook endpoint enabled at /webhook');
    }

    // Health check endpoint for Render
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        uptime: Math.floor((new Date() - this.startTime) / 1000),
        timestamp: new Date().toISOString(),
        service: 'stable-master-bot'
      });
    });

    // Bot status endpoint
    this.app.get('/status', async (req, res) => {
      try {
        const botInfo = await this.bot.getMe();
        res.json({
          bot_name: botInfo.first_name,
          bot_username: botInfo.username,
          is_running: true,
          uptime_seconds: Math.floor((new Date() - this.startTime) / 1000),
          database_connected: true
        });
      } catch (error) {
        res.status(500).json({
          error: 'Bot status check failed',
          message: error.message
        });
      }
    });

    // Simple stats endpoint (no sensitive data)
    this.app.get('/stats', async (req, res) => {
      try {
        // Get aggregate stats without exposing user data
        res.json({
          uptime: Math.floor((new Date() - this.startTime) / 1000),
          status: 'operational',
          version: '1.0.0'
        });
      } catch (error) {
        res.status(500).json({
          error: 'Stats unavailable',
          message: error.message
        });
      }
    });

    // Root endpoint
    this.app.get('/', (req, res) => {
      res.json({
        message: 'Stable Master Bot is running',
        uptime: Math.floor((new Date() - this.startTime) / 1000),
        endpoints: ['/health', '/status', '/stats']
      });
    });
  }

  start() {
    this.server = this.app.listen(this.port, () => {
      console.log(`🌐 Health server running on port ${this.port}`);
    });
  }

  stop() {
    if (this.server) {
      this.server.close();
      this.memory.close();
    }
  }
}

module.exports = HealthServer;