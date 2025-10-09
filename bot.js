require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const OpenAI = require('openai');
const MemoryManager = require('./memory');
const PersonalitySystem = require('./personality');
const HealthServer = require('./server');
const ModerationSystem = require('./moderation');

class StableMasterBot {
  constructor() {
    this.bot = new TelegramBot(process.env.TELEGRAM_TOKEN, { polling: true });
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    this.memory = new MemoryManager();
    this.personality = new PersonalitySystem();
    this.moderation = new ModerationSystem(this.bot);
    this.isProcessing = new Set(); // Prevent concurrent processing for same chat
    
    // Start health server for Render deployment
    this.healthServer = new HealthServer(this.bot);
    this.healthServer.start();
    
    this.setupCommands();
    this.setupMessageHandler();
    
    console.log('🤖 Stable Master Bot initialized and ready to chill...');
  }

  setupCommands() {
    // Basic commands
    this.bot.onText(/\/start/, (msg) => {
      const chatId = msg.chat.id;
      const welcomeMessage = `
Hey there! 😎 I'm Stable Master, your chill crypto companion.

I'm here to:
• Answer your crypto questions with a calm vibe
• Help ease those FUD moments 
• Keep the energy positive and informed

Just chat with me naturally - I'll remember our conversations and learn from them.

Commands:
/memory - View recent conversation history
/edit [id] [new_response] - Edit one of my previous responses
/clear - Clear conversation memory
/vibe - Get my current crypto market sentiment
/modstats - View moderation statistics (admin only)

Anti-spam protection is active - I'll keep promotion and spam out! 🛡️

Ready to keep things stable! 🚀
      `;
      this.bot.sendMessage(chatId, welcomeMessage);
    });

    this.bot.onText(/\/memory/, async (msg) => {
      const chatId = msg.chat.id;
      const history = await this.memory.getRecentHistory(chatId, 10);
      if (history.length === 0) {
        return this.bot.sendMessage(chatId, "No conversation history yet. Start chatting with me! 💭");
      }
      
      let response = "*Recent Conversation:*\n\n";
      history.forEach((entry, index) => {
        response += `${entry.id}. *${entry.role}:* ${entry.content.substring(0, 100)}${entry.content.length > 100 ? '...' : ''}\n\n`;
      });
      
      this.bot.sendMessage(chatId, response, { parse_mode: 'Markdown' });
    });

    this.bot.onText(/\/edit (\d+) (.+)/, async (msg, match) => {
      const chatId = msg.chat.id;
      const messageId = parseInt(match[1]);
      const newResponse = match[2];
      
      try {
        await this.memory.editResponse(chatId, messageId, newResponse);
        this.bot.sendMessage(chatId, `✅ Response ${messageId} updated in my memory. I'll learn from this!`);
      } catch (error) {
        this.bot.sendMessage(chatId, `❌ Couldn't edit response ${messageId}. Make sure the ID exists.`);
      }
    });

    this.bot.onText(/\/clear/, async (msg) => {
      const chatId = msg.chat.id;
      await this.memory.clearHistory(chatId);
      this.bot.sendMessage(chatId, "🧠 Memory cleared. Fresh start, let's keep building good vibes!");
    });

    this.bot.onText(/\/vibe/, (msg) => {
      const chatId = msg.chat.id;
      const vibes = [
        "Markets are just doing market things. Stay chill, zoom out. 📈✨",
        "Feeling pretty zen about the charts today. Volatility = opportunity 🧘‍♂️",
        "Some noise in the markets, but the fundamentals haven't changed. Keep building 🔨",
        "Just another day in crypto paradise. Embrace the chaos! 🏄‍♂️",
        "Vibes are immaculate. Trust the process, enjoy the journey 🌊"
      ];
      const randomVibe = vibes[Math.floor(Math.random() * vibes.length)];
      this.bot.sendMessage(chatId, randomVibe);
    });

    // Moderation commands (admin only)
    this.bot.onText(/\/modstats/, async (msg) => {
      const chatId = msg.chat.id;
      const userId = msg.from.id;
      
      if (!(await this.moderation.isAdmin(chatId, userId))) {
        return this.bot.sendMessage(chatId, "Only admins can view moderation stats.");
      }
      
      try {
        const stats = await this.moderation.getModerationStats(chatId);
        const statsMessage = `
📊 **Moderation Stats**

• Total violations: ${stats.total_violations}
• Users muted: ${stats.total_mutes}  
• Users banned: ${stats.total_bans}
• Violations (24h): ${stats.violations_24h}

Bot is keeping things chill! 😎
        `;
        this.bot.sendMessage(chatId, statsMessage, { parse_mode: 'Markdown' });
      } catch (error) {
        this.bot.sendMessage(chatId, "Error fetching moderation stats.");
      }
    });

    this.bot.onText(/\/unmute @?(\w+)/, async (msg, match) => {
      const chatId = msg.chat.id;
      const adminId = msg.from.id;
      const targetUsername = match[1];
      
      if (!(await this.moderation.isAdmin(chatId, adminId))) {
        return this.bot.sendMessage(chatId, "Only admins can unmute users.");
      }
      
      // Note: This would need additional logic to find user ID from username
      this.bot.sendMessage(chatId, `Manual unmute command received for @${targetUsername}. Please use Telegram's admin tools for now.`);
    });
  }

  setupMessageHandler() {
    this.bot.on('message', async (msg) => {
      // Skip if it's a command
      if (msg.text?.startsWith('/')) return;
      
      const chatId = msg.chat.id;
      const userMessage = msg.text || msg.caption || '';
      
      // First check for promotion/spam content
      const isViolation = await this.moderation.checkMessage(msg);
      if (isViolation) {
        // Message was deleted and user was warned/muted/banned
        return;
      }
      
      // Skip if not a text message after moderation check
      if (!userMessage) return;
      
      // Prevent concurrent processing for same chat
      if (this.isProcessing.has(chatId)) {
        return this.bot.sendMessage(chatId, "Hold up, I'm still thinking about your last message... 🤔");
      }
      
      this.isProcessing.add(chatId);
      
      try {
        // Show typing indicator
        await this.bot.sendChatAction(chatId, 'typing');
        
        // Save user message to memory
        await this.memory.addMessage(chatId, 'user', userMessage);
        
        // Get conversation context
        const context = await this.memory.getRecentHistory(chatId, 10);
        
        // Generate response using LLM
        const response = await this.generateResponse(userMessage, context);
        
        // Save bot response to memory
        const responseId = await this.memory.addMessage(chatId, 'assistant', response);
        
        // Send response to user
        await this.bot.sendMessage(chatId, response);
        
      } catch (error) {
        console.error('Error processing message:', error);
        await this.bot.sendMessage(chatId, "Whoa, hit a little turbulence there. Mind trying that again? 🛠️");
      } finally {
        this.isProcessing.delete(chatId);
      }
    });
  }

  async generateResponse(userMessage, context) {
    const systemPrompt = this.personality.getSystemPrompt();
    const contextMessages = context.map(entry => ({
      role: entry.role,
      content: entry.content
    }));

    try {
      const completion = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          { role: "system", content: systemPrompt },
          ...contextMessages,
          { role: "user", content: userMessage }
        ],
        max_tokens: 500,
        temperature: 0.8,
      });

      return completion.choices[0].message.content;
    } catch (error) {
      console.error('OpenAI API error:', error);
      return "Having some connection issues with my brain right now... Give me a sec to get back online! 🔄";
    }
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down Stable Master Bot...');
  if (global.stableMasterInstance) {
    global.stableMasterInstance.healthServer.stop();
  }
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down gracefully...');
  if (global.stableMasterInstance) {
    global.stableMasterInstance.healthServer.stop();
  }
  process.exit(0);
});

// Start the bot
global.stableMasterInstance = new StableMasterBot();