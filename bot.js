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
    this.setupCommunityEngagement();
    
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

    this.bot.onText(/\/vibe/, async (msg) => {
      const chatId = msg.chat.id;
      const context = await this.memory.getRecentHistory(chatId, 5);
      const vibe = await this.generateDynamicVibe(context);
      this.bot.sendMessage(chatId, vibe);
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

      // Check if this is a direct conversation with bot or mentions empire keywords
      const botInfo = await this.bot.getMe();
      const isDirectToBot = msg.chat.type === 'private' || 
                           userMessage.includes('@' + botInfo.username) ||
                           userMessage.toLowerCase().includes('stable master') ||
                           this.shouldEngageWithMessage(userMessage);

      // Always save to memory for context
      await this.memory.addMessage(chatId, 'user', userMessage);

      // If it's user-to-user conversation, maybe jump in with hype if relevant
      if (!isDirectToBot && msg.chat.type !== 'private') {
        if (Math.random() < 0.3 && this.shouldEngageWithMessage(userMessage)) {
          // 30% chance to jump in with relevant empire building hype
          await this.jumpInWithHype(chatId, userMessage);
        }
        return;
      }
      
      // Prevent concurrent processing for same chat
      if (this.isProcessing.has(chatId)) {
        return this.bot.sendMessage(chatId, "Hold up, I'm still thinking about your last message... 🤔");
      }
      
      this.isProcessing.add(chatId);
      
      try {
        // Show typing indicator
        await this.bot.sendChatAction(chatId, 'typing');
        
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
    // Check if this looks like FUD that needs calming
    const fudKeywords = ['crash', 'dump', 'down', 'regulation', 'ban', 'hack', 'bug', 'whale', 'sell', 'worried', 'scared', 'panic'];
    const isFudMessage = fudKeywords.some(keyword => userMessage.toLowerCase().includes(keyword));
    
    if (isFudMessage && Math.random() < 0.3) {
      // 30% chance to use dynamic FUD calming instead of LLM
      return this.personality.getFudCalmingResponse(userMessage, 'medium', context);
    }
    
    const systemPrompt = this.personality.getSystemPrompt(context);
    const contextMessages = context.map(entry => ({
      role: entry.role,
      content: entry.content
    }));

    try {
      // Dynamic temperature based on conversation context
      const recentText = context.slice(-3).map(m => m.content.toLowerCase()).join(' ');
      let temperature = 0.8;
      if (recentText.includes('explain') || recentText.includes('how')) {
        temperature = 0.6; // More focused for educational content
      } else if (recentText.includes('hype') || recentText.includes('excited')) {
        temperature = 0.9; // More creative for hype content
      }
      
      const completion = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          { role: "system", content: systemPrompt },
          ...contextMessages,
          { role: "user", content: userMessage }
        ],
        max_tokens: 500,
        temperature: temperature,
      });

      return completion.choices[0].message.content;
    } catch (error) {
      console.error('OpenAI API error:', error);
      return this.generateDynamicErrorMessage();
    }
  }

  setupCommunityEngagement() {
    // Store active chats for community engagement
    this.activeChatIds = new Set();
    this.lastActivity = new Map(); // Track last activity per chat
    
    // Track active chats and their activity
    this.bot.on('message', (msg) => {
      if (msg.chat.type === 'group' || msg.chat.type === 'supergroup') {
        this.activeChatIds.add(msg.chat.id);
        this.lastActivity.set(msg.chat.id, Date.now());
      }
    });

    // Ultra active community engagement every 5 minutes
    const scheduleNextEngagement = () => {
      // Fixed interval of 5 minutes (in milliseconds)
      const interval = 5 * 60 * 1000;
      
      setTimeout(async () => {
        if (this.activeChatIds.size > 0) {
          await this.sendCommunityEngagement();
        }
        
        // Schedule next engagement
        scheduleNextEngagement();
      }, interval);
    };

    // Start the engagement cycle
    scheduleNextEngagement();
    console.log('🎉 Community engagement system activated!');
  }

  async sendCommunityEngagement() {
    try {
      // Pick random active chat
      const chatIds = Array.from(this.activeChatIds);
      const randomChatId = chatIds[Math.floor(Math.random() * chatIds.length)];
      
      // Get recent conversation context to be more relevant
      const context = await this.memory.getRecentHistory(randomChatId, 5);
      
      // Generate dynamic engagement message using LLM
      const engagementPrompt = this.generateEngagementPrompt(randomChatId);
      const engagementMessage = await this.generateEngagementResponse(engagementPrompt, context);
      
      // Send the message
      await this.bot.sendMessage(randomChatId, engagementMessage);
      console.log(`🤖 Dynamic community engagement sent to chat ${randomChatId}`);
      
      // Save to memory as bot message
      await this.memory.addMessage(randomChatId, 'assistant', engagementMessage);
      
    } catch (error) {
      console.error('Error sending community engagement:', error);
      // Remove inactive chat if error
      if (error.response && error.response.statusCode === 403) {
        this.activeChatIds.delete(randomChatId);
      }
    }
  }

  generateEngagementPrompt(chatId) {
    const now = Date.now();
    const lastActivity = this.lastActivity.get(chatId) || now;
    const hoursQuiet = Math.floor((now - lastActivity) / (1000 * 60 * 60));
    
    const engagementTypes = [
      'check_in', 'idea_request', 'pixel_pony_fact', 'countdown_hype', 
      'dev_appreciation', 'community_question', 'casual_chat'
    ];
    
    const randomType = engagementTypes[Math.floor(Math.random() * engagementTypes.length)];
    
    return `You're feeling like engaging with the community naturally. Generate a community engagement message as Stable Master that feels organic and fits your passionate $PONY holder personality. 

Context: The chat has been quiet for ${hoursQuiet} hours.
Type of engagement: ${randomType}

Guidelines:
- Be natural and conversational, not scripted
- Stay in character as a passionate community member
- Can ask "anyone there?" or similar if appropriate
- Reference the 5-day countdown when it feels natural
- Share enthusiasm about pixel ponies or the racing game
- Ask for community ideas if relevant
- Keep it short and engaging (1-2 sentences max)
- Use 🐎 and relevant emojis naturally

Generate ONLY the message text, no quotes or explanations.`;
  }

  async generateEngagementResponse(prompt, context) {
    try {
      const systemPrompt = this.personality.getSystemPrompt();
      const contextMessages = context.map(entry => ({
        role: entry.role,
        content: entry.content
      }));

      const completion = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          { role: "system", content: systemPrompt },
          ...contextMessages,
          { role: "user", content: prompt }
        ],
        max_tokens: 100,
        temperature: 0.9, // Higher temperature for more variety
      });

      return completion.choices[0].message.content.trim();
    } catch (error) {
      console.error('Error generating engagement message:', error);
      // Dynamic fallback engagement
      return this.generateDynamicFallback();
    }
  }

  shouldEngageWithMessage(message) {
    const empireKeywords = [
      'pony', 'racing', 'pixel', 'empire', 'rich', 'moon', 'launch', 
      'betting', 'game', 'chain', 'dev', 'team', 'mars', 'domination',
      'buy', 'token', 'pump', 'hodl', 'diamond', 'nft'
    ];
    
    const lowerMessage = message.toLowerCase();
    return empireKeywords.some(keyword => lowerMessage.includes(keyword));
  }

  async generateDynamicVibe(context = []) {
    const currentHour = new Date().getHours();
    const daysUntilLaunch = Math.max(0, Math.ceil((new Date('2025-10-14') - new Date()) / (1000 * 60 * 60 * 24)));
    
    // Base vibe components
    const openings = ["Currently", "Right now", "Today", "At this moment", "Honestly"];
    const moods = [
      "feeling zen about the charts", 
      "vibing with the market flow", 
      "embracing the volatility", 
      "staying chill despite the noise",
      "focused on the empire vision",
      "building through the chaos"
    ];
    const perspectives = [
      "zoom out and trust the process", 
      "fundamentals haven't changed", 
      "volatility = opportunity for builders",
      "empire builders see the bigger picture",
      "every dip is just a discount",
      "diamond hands win long-term"
    ];
    const endings = ["📈✨", "🧘‍♂️", "🔨", "🏄‍♂️", "🌊", "💎🙌", "🚀", "🐎👑"];
    
    // Context-aware modifications
    let timeContext = "";
    if (currentHour < 12) {
      timeContext = "Morning energy is strong. ";
    } else if (currentHour > 20) {
      timeContext = "Late night building mode. ";
    }
    
    let launchContext = "";
    if (daysUntilLaunch <= 7) {
      launchContext = ` ${daysUntilLaunch} days until we change everything! `;
    }
    
    // Build dynamic vibe
    const opening = openings[Math.floor(Math.random() * openings.length)];
    const mood = moods[Math.floor(Math.random() * moods.length)];
    const perspective = perspectives[Math.floor(Math.random() * perspectives.length)];
    const ending = endings[Math.floor(Math.random() * endings.length)];
    
    return `${timeContext}${opening} ${mood}. ${perspective}.${launchContext} ${ending}`;
  }
  
  generateDynamicErrorMessage() {
    const errorTypes = [
      "Having some connection issues with my brain right now... Give me a sec to get back online! 🔄",
      "My neural networks are doing some maintenance. Back in a flash! ⚡",
      "Oops, hit a little turbulence in the data stream. Mind trying that again? 🛠️",
      "Brain.exe stopped responding for a sec there. Rebooting! 🧠💫",
      "The empire's servers are having a moment. Give me another shot! 🏗️",
      "Connection to the pixel dimension is a bit fuzzy right now... 🌀"
    ];
    return errorTypes[Math.floor(Math.random() * errorTypes.length)];
  }
  
  generateDynamicFallback() {
    const currentHour = new Date().getHours();
    const daysUntilLaunch = Math.max(0, Math.ceil((new Date('2025-10-14') - new Date()) / (1000 * 60 * 60 * 24)));
    
    const greetings = ["Hey everyone!", "What's up empire builders?", "Anyone around?", "How's the vibe today?"];
    const topics = [
      "with $PONY today?",
      "building the empire?", 
      "excited for launch?",
      "feeling about the vision?",
      "ready for pixel racing domination?"
    ];
    const timeContexts = {
      morning: "Morning builders! ",
      afternoon: "Afternoon empire! ",
      evening: "Evening legends! ",
      night: "Night owls still building! "
    };
    
    let timeOfDay = 'afternoon';
    if (currentHour < 12) timeOfDay = 'morning';
    else if (currentHour > 18) timeOfDay = 'evening';
    else if (currentHour > 22) timeOfDay = 'night';
    
    const greeting = greetings[Math.floor(Math.random() * greetings.length)];
    const topic = topics[Math.floor(Math.random() * topics.length)];
    const timePrefix = Math.random() < 0.5 ? timeContexts[timeOfDay] : "";
    const launchSuffix = daysUntilLaunch <= 7 ? ` ${daysUntilLaunch} days to go! 🏁` : " 🐎";
    
    return `${timePrefix}${greeting} How's everyone ${topic}${launchSuffix}`;
  }

  async jumpInWithHype(chatId, triggerMessage) {
    try {
      const context = await this.memory.getRecentHistory(chatId, 3);
      const hypePrompt = `Someone just mentioned something related to our pixel racing empire! Jump in with relevant hype without interrupting their conversation. 
      
Trigger message: "${triggerMessage}"

Guidelines:
- Be brief and hype-focused (1 sentence max)
- Connect to empire building or getting rich
- Don't directly respond to users talking to each other
- Add relevant empire energy to the conversation
- Include links or team mentions if super relevant
- Stay excited about the 5-day countdown

Generate ONLY the hype message, no quotes.`;

      const hypeResponse = await this.generateEngagementResponse(hypePrompt, context);
      await this.bot.sendMessage(chatId, hypeResponse);
      await this.memory.addMessage(chatId, 'assistant', hypeResponse);
      
      console.log(`🚀 Jumped in with empire hype: ${hypeResponse}`);
    } catch (error) {
      console.error('Error jumping in with hype:', error);
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