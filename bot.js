require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const Anthropic = require('@anthropic-ai/sdk');
const MemoryManager = require('./memory');
const PersonalitySystem = require('./personality');
const HealthServer = require('./server');
const ModerationSystem = require('./moderation');
const RaceWatcher = require('./raceWatcher');

class StableMasterBot {
  constructor() {
    this.bot = new TelegramBot(process.env.TELEGRAM_TOKEN, { polling: true });
    this.anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    this.memory = new MemoryManager();
    this.personality = new PersonalitySystem();
    this.moderation = new ModerationSystem(this.bot);
    this.isProcessing = new Set(); // Prevent concurrent processing for same chat
    
    // Start health server for Render deployment
    this.healthServer = new HealthServer(this.bot);
    this.healthServer.start();
    
    this.setupCommands();
    this.setupMessageHandler();
    this.setupNewMemberGreeting();
    this.setupCommunityEngagement();
    this.setupRaceWatcher();

    console.log('🤖 Stable Master Bot initialized and ready to chill...');
  }

  setupCommands() {
    // Basic commands
    this.bot.onText(/\/start/, (msg) => {
      const chatId = msg.chat.id;
      const welcomeMessage = `
🐎 **Welcome to Pixel Pony Racing!** 🏁

I'm Stable Master - I help you understand and play the world's first instant on-chain horse racing game!

**The game is LIVE at pxpony.com/game!**

**What is Pixel Pony?**
• 16-horse instant racing on Base Mainnet
• Bet PONY tokens, win up to 10x your bet!
• FREE lottery ticket with every race
• Fair odds: 1st = 10x, 2nd = 2.5x, 3rd = 1x

**Commands:**
/play - Learn how to play on the website
/register - Buy PONY on Uniswap
/contracts - Get contract addresses
/lp - Liquidity lock proof (permanently locked!)
/info - Game mechanics and details
/races - Check race announcement status
/memory - View conversation history
/vibe - Current sentiment
/clear - Clear memory

**Quick Links:**
🎮 Play: https://pxpony.com/game
🌐 Website: https://pxpony.com/
🐦 Twitter: https://x.com/pxponies

Ready to race? Visit pxpony.com/game now! 🚀
      `;
      this.bot.sendMessage(chatId, welcomeMessage, { parse_mode: 'Markdown' });
    });

    // New game-specific commands
    this.bot.onText(/\/play/, (msg) => {
      const chatId = msg.chat.id;
      const playGuide = `
🎮 **HOW TO PLAY PIXEL PONY** 🐎

**The game is LIVE at pxpony.com/game!**

**Step 1: Get PONY Tokens**
Don't have PONY? No problem!
• Use /register to buy PONY on Uniswap (airdrop exhausted)
• OR buy directly on Base DEX (Uniswap/Aerodrome)

**Step 2: Go to the Website**
Visit: **pxpony.com/game**
• All racing happens on the website now
• No more Telegram or Basescan racing!
• Connect your wallet to start

**Step 3: Pick Your Horse & Race!**
• Choose ONE lucky horse (1-16 on the interface)
• Place your bet in PONY tokens on that horse
• Pay 0.0005 ETH entry fee on Base Mainnet
• Race executes instantly on-chain!
• Results show immediately

**Payouts:**
🥇 1st: 10x your bet
🥈 2nd: 2.5x your bet
🥉 3rd: 1x (break even)
🎟️ Free lottery ticket every race!

**Ready to race?**
👉 pxpony.com/game
👉 Use /register to buy PONY!

Good luck! 🏁
      `;
      this.bot.sendMessage(chatId, playGuide, { parse_mode: 'Markdown', disable_web_page_preview: true });
    });

    this.bot.onText(/\/register/, (msg) => {
      const chatId = msg.chat.id;
      const registerInfo = `
💰 **BUY PONY TOKENS** 🐎

**Airdrop Update:** We've exhausted all airdrop funds! But you can easily buy PONY on Uniswap.

**How to buy:**
1. Click here to buy on Uniswap:
👉 https://app.uniswap.org/#/swap?inputCurrency=ETH&outputCurrency=0x6ab297799335E7b0f60d9e05439Df156cf694Ba7&chain=base

2. Connect your wallet (must be on Base network)
3. Swap ETH for PONY tokens
4. Start racing immediately at pxpony.com/game!

**Why buy PONY?**
• Race and win up to 10x your bet
• Get free lottery tickets with every race
• Participate in the progressive jackpot
• Join the pixel racing revolution!

**Ready to race?**
👉 Buy PONY now and visit pxpony.com/game! 🏁
      `;
      this.bot.sendMessage(chatId, registerInfo, { parse_mode: 'Markdown', disable_web_page_preview: true });
    });

    this.bot.onText(/\/contracts/, (msg) => {
      const chatId = msg.chat.id;
      const contractInfo = `
📄 **PIXEL PONY CONTRACTS** 📄

**Network:** Base Mainnet (Chain ID: 8453)

**PONY Token (ERC20)**
Address: \`0x6ab297799335E7b0f60d9e05439Df156cf694Ba7\`
Basescan: https://basescan.org/address/0x6ab297799335E7b0f60d9e05439Df156cf694Ba7

**Pixel Pony Game**
Address: \`0x2B4652Bd6149E407E3F57190E25cdBa1FC9d37d8\`
Basescan: https://basescan.org/address/0x2B4652Bd6149E407E3F57190E25cdBa1FC9d37d8

**Supply:** 100 Trillion PONY
**Game Reserve:** 50 Trillion PONY

✅ Verified on Basescan
✅ Zero vulnerabilities
✅ Fixed supply (no minting)

Use /play to learn how to interact with these contracts! 🐎
      `;
      this.bot.sendMessage(chatId, contractInfo, { parse_mode: 'Markdown', disable_web_page_preview: true });
    });

    this.bot.onText(/\/lp|\/liquidity/, (msg) => {
      const chatId = msg.chat.id;
      const lpInfo = `
🔒 **LIQUIDITY PERMANENTLY LOCKED!** 🔒

**Your LP Positions Are LOCKED FOREVER!**

**Pony Vault V1:**
\`0x149C79Eb6384CD54fb0F34358A7C65CDAe8Fb9D1\`

**Locked NFTs:**
• Uniswap V4 Position #474312
• Uniswap V4 Position #474147

**Proof:**
🔒 Vault owns both NFTs:
https://basescan.org/address/0x149C79Eb6384CD54fb0F34358A7C65CDAe8Fb9D1

✅ Verified source code:
https://basescan.org/address/0x149C79Eb6384CD54fb0F34358A7C65CDAe8Fb9D1#code

🚫 Ownership renounced: Owner = 0x000...000

💯 No withdrawal functions exist

🔐 Renounce transaction:
https://basescan.org/tx/0x3fd645c1cda4b43ef04a5e7abf1d6359b7afa58f1e0e6d1607d063d947d15760

**What This Means:**
• ZERO rug pull risk
• Liquidity locked forever and ever
• Vault ownership renounced to zero address
• No one can withdraw the LP positions
• Verified immutable contract code

This is maximum security! 🐎💎🔐
      `;
      this.bot.sendMessage(chatId, lpInfo, { parse_mode: 'Markdown', disable_web_page_preview: true });
    });

    this.bot.onText(/\/info/, (msg) => {
      const chatId = msg.chat.id;
      const gameInfo = `
🎮 **PIXEL PONY GAME INFO** 🐎

**The game is LIVE at pxpony.com/game!**

**Racing Mechanics:**
• 16 horses per race (numbered 1-16 on interface)
• Pick ONE horse per race - that's your bet!
• Instant single-player racing
• Bet → Race executes → Result (all on-chain!)
• 10 entropy sources for fair randomness

**Betting:**
• Entry Fee: 0.0005 ETH per race on Base Mainnet
• Min Bet: Any amount (even 1 PONY!)
• Max Bet: 50 Billion PONY
• Platform Fee: 10% (funds jackpot + development)
• One horse per race - choose wisely!

**Payouts:**
• 1st Place: 10x your bet
• 2nd Place: 2.5x your bet
• 3rd Place: 1x (break even)
• Win Rate: ~18.75% (3/16 positions win)

**Lottery System:**
• FREE ticket with every race
• Progressive jackpot from platform fees
• Jackpot trigger: 50% of game supply (25T PONY)
• Pull-based claims (scalable to unlimited players!)

**Security:**
• Verified contracts on Basescan
• Zero vulnerabilities found
• ReentrancyGuard protection
• Fixed supply tokenomics

**Links:**
🎮 Play: https://pxpony.com/game
🌐 Website: https://pxpony.com/
🐦 Twitter: https://x.com/pxponies

Use /play to learn how or /register for free PONY! 🏁
      `;
      this.bot.sendMessage(chatId, gameInfo, { parse_mode: 'Markdown', disable_web_page_preview: true });
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

    this.bot.onText(/\/races/, async (msg) => {
      const chatId = msg.chat.id;
      if (this.raceWatcher) {
        const status = this.raceWatcher.getStatus();
        const statusMessage = `
🏁 **RACE ANNOUNCEMENT STATUS** 🏁

📡 Monitoring: ${status.isWatching ? '✅ Active' : '❌ Inactive'}
📍 Contract: \`${status.contract}\`
🌐 Network: ${status.network}
📢 Announcing to: ${status.announcingTo} chat(s)

The bot watches the Base blockchain and announces every race in real-time! 🐎

Race announcements show:
• Winner & payout multipliers
• Player address
• Bet amounts
• Race results
• Basescan link

Try racing to see it in action! Use /play to learn how 🎮
        `;
        this.bot.sendMessage(chatId, statusMessage, { parse_mode: 'Markdown' });
      } else {
        this.bot.sendMessage(chatId, 'Race watcher not initialized.');
      }
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

    // Contract Address command - now shows Base Mainnet contracts
    this.bot.onText(/^\/ca$/i, async (msg) => {
      const chatId = msg.chat.id;
      const contractMessage = `
🐎 **PIXEL PONY CONTRACTS** 🐎

**Network:** Base Mainnet (Chain ID: 8453)

**PONY Token:**
\`0x6ab297799335E7b0f60d9e05439Df156cf694Ba7\`

**Game Contract:**
\`0x2B4652Bd6149E407E3F57190E25cdBa1FC9d37d8\`

**Token on Basescan:**
https://basescan.org/address/0x6ab297799335E7b0f60d9e05439Df156cf694Ba7

**Game on Basescan:**
https://basescan.org/address/0x2B4652Bd6149E407E3F57190E25cdBa1FC9d37d8

**Buy PONY:**
• Uniswap (Base)
• Aerodrome (Base)

**Quick Links:**
• Website: https://pxpony.com/
• Twitter: https://x.com/pxponies

Use /play to learn how to race! 🏁
      `;

      this.bot.sendMessage(chatId, contractMessage, {
        parse_mode: 'Markdown',
        disable_web_page_preview: true
      });
    });
  }

  setupMessageHandler() {
    this.bot.on('message', async (msg) => {
      // Skip if it's a command (starts with /)
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

      // Check for contract address requests first (before other processing)
      if (this.isContractAddressRequest(userMessage)) {
        const contractMessage = `
🐎 **PIXEL PONY CONTRACTS** 🐎

**Network:** Base Mainnet (Chain ID: 8453)

**PONY Token:**
\`0x6ab297799335E7b0f60d9e05439Df156cf694Ba7\`

**Game Contract:**
\`0x2B4652Bd6149E407E3F57190E25cdBa1FC9d37d8\`

**View on Basescan:**
Token: https://basescan.org/address/0x6ab297799335E7b0f60d9e05439Df156cf694Ba7
Game: https://basescan.org/address/0x2B4652Bd6149E407E3F57190E25cdBa1FC9d37d8

**Buy PONY:** Uniswap or Aerodrome on Base

Use /play to learn how to race! 🏁
        `;

        await this.bot.sendMessage(chatId, contractMessage, {
          parse_mode: 'Markdown',
          disable_web_page_preview: true
        });

        // Save to memory
        await this.memory.addMessage(chatId, 'user', userMessage);
        await this.memory.addMessage(chatId, 'assistant', contractMessage);
        return;
      }

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
        if (Math.random() < 0.001 && this.shouldEngageWithMessage(userMessage)) {
          // 0.1% chance to jump in with relevant empire building hype (95% reduction)
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
    
    if (isFudMessage && Math.random() < 0.001) {
      // 0.1% chance to use dynamic FUD calming instead of LLM (95% reduction)
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
      
      const completion = await this.anthropic.messages.create({
        model: "claude-3-5-haiku-20241022",
        max_tokens: 500,
        temperature: temperature,
        system: systemPrompt,
        messages: [
          ...contextMessages,
          { role: "user", content: userMessage }
        ]
      });

      return completion.content[0].text;
    } catch (error) {
      console.error('Anthropic API error:', error);
      return this.generateDynamicErrorMessage();
    }
  }

  setupNewMemberGreeting() {
    // Listen for new chat members
    this.bot.on('new_chat_members', async (msg) => {
      const chatId = msg.chat.id;
      const newMembers = msg.new_chat_members;
      
      // Don't greet if the bot itself was added
      const botInfo = await this.bot.getMe();
      const botJoined = newMembers.some(member => member.id === botInfo.id);
      if (botJoined) return;
      
      // Generate welcome message for new members
      for (const member of newMembers) {
        if (!member.is_bot) { // Only greet human members
          try {
            const welcomeMessage = await this.generateNewMemberWelcome(member, chatId);
            await this.bot.sendMessage(chatId, welcomeMessage);
            
            // Save welcome to memory
            await this.memory.addMessage(chatId, 'assistant', welcomeMessage);
            
            console.log(`👋 Welcomed new member: ${member.first_name || member.username || 'Unknown'}`);
          } catch (error) {
            console.error('Error welcoming new member:', error);
            // Fallback welcome message
            const fallbackWelcome = this.generateFallbackWelcome(member);
            await this.bot.sendMessage(chatId, fallbackWelcome);
          }
        }
      }
    });
    
    console.log('👋 New member greeting system activated!');
  }

  async generateNewMemberWelcome(member, chatId) {
    const launchDate = new Date('2025-10-14');
    const isPostLaunch = new Date() > launchDate;
    const memberName = member.first_name || member.username || 'racer';

    const welcomePrompt = `A new member just joined the Pixel Pony community! Welcome them as Stable Master.

New member name: ${memberName}
Chat context: Pixel Pony racing game community on Base Mainnet
Current phase: ${isPostLaunch ? 'GAME IS LIVE' : 'PRE-LAUNCH PREPARATION'}

Guidelines for the welcome:
- Be genuinely excited and welcoming
- Briefly introduce Pixel Pony: instant 16-horse racing on Base Mainnet
- ${isPostLaunch ? 'Mention the game is LIVE at pxpony.com/game and they can play right now' : 'Build excitement for the upcoming game launch'}
- Highlight key features: 10x/2.5x/1x payouts, free lottery tickets, fair odds
- ${isPostLaunch ? 'Tell them to visit pxpony.com/game and use /register if they need PONY' : 'Explain they can learn more with /info command'}
- Mention this is revolutionary tech: world's first pull-based jackpot failsafe
- Keep it friendly and concise (3-4 sentences max)
- Include racing emojis naturally (🐎🏁)

Generate ONLY the welcome message text, no quotes or explanations.`;

    try {
      const systemPrompt = this.personality.getSystemPrompt();
      const completion = await this.anthropic.messages.create({
        model: "claude-3-5-haiku-20241022",
        max_tokens: 200,
        temperature: 0.8,
        system: systemPrompt,
        messages: [
          { role: "user", content: welcomePrompt }
        ]
      });

      return completion.content[0].text.trim();
    } catch (error) {
      console.error('Error generating AI welcome:', error);
      return this.generateFallbackWelcome(member);
    }
  }

  generateFallbackWelcome(member) {
    const launchDate = new Date('2025-10-14');
    const isPostLaunch = new Date() > launchDate;
    const memberName = member.first_name || member.username || 'racer';

    const welcomeOptions = isPostLaunch ? [
      `Welcome ${memberName}! 🐎🏁 The game is LIVE at pxpony.com/game! 16-horse instant racing with 10x payouts. Visit pxpony.com/game to play now! Use /register to buy PONY! 🎮`,
      `Hey ${memberName}! 👋 Perfect timing - Pixel Pony racing is live at pxpony.com/game! Win up to 10x, get free lottery tickets. Buy PONY on Uniswap with /register! 🏁`,
      `Welcome to Pixel Pony, ${memberName}! 🎉 On-chain horse racing is LIVE at pxpony.com/game! Fair odds, instant races, revolutionary tech. Visit pxpony.com/game and buy PONY with /register! 🐎💎`
    ] : [
      `Welcome ${memberName}! 🐎🚀 We're building the first instant on-chain racing game on Base Mainnet! 16 horses, 10x payouts, pull-based jackpot failsafe. Use /info to learn more!`,
      `Hey ${memberName}! 👋 You just joined the future of blockchain gaming! Pixel Pony launches soon with revolutionary tech. Check https://pxpony.com/ 🏁`,
      `Welcome ${memberName}! 🎉 Get ready for instant 16-horse racing on Base! Fair odds, free lottery tickets, and world-first jackpot innovation. https://x.com/pxponies 🐎💎`
    ];

    return welcomeOptions[Math.floor(Math.random() * welcomeOptions.length)];
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

    // Very reduced community engagement every 8 hours (95% less chatty)
    const scheduleNextEngagement = () => {
      // Fixed interval of 8 hours (in milliseconds)
      const interval = 8 * 60 * 60 * 1000;
      
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
    const launchDate = new Date('2025-10-14');
    const isPostLaunch = new Date() > launchDate;

    const engagementTypes = isPostLaunch ? [
      'race_celebration', 'win_sharing', 'play_encouragement', 'game_tips',
      'jackpot_update', 'tech_appreciation', 'community_growth', 'basescan_guide'
    ] : [
      'check_in', 'tech_fact', 'countdown_hype', 'game_preview',
      'dev_appreciation', 'community_question', 'casual_chat'
    ];

    const randomType = engagementTypes[Math.floor(Math.random() * engagementTypes.length)];

    const basePrompt = `You're feeling like engaging with the community naturally. Generate a community engagement message as Stable Master.`;

    const postLaunchContext = isPostLaunch ? `

CURRENT PHASE: GAME IS LIVE
- Racing game is LIVE at pxpony.com/game!
- Encourage people to try racing on the website
- IMPORTANT: Airdrop is EXHAUSTED - tell users to buy PONY on Uniswap using /register
- Share tips on how to play and win
- Celebrate community wins
- Explain game features: 16 horses, 10x/2.5x/1x payouts, free lottery
- Mention the revolutionary pull-based jackpot failsafe
- Guide users to pxpony.com/game and /play command` : `

CURRENT PHASE: PRE-LAUNCH
- Build excitement for the upcoming launch
- Explain the innovative tech (pull-based failsafe, 10 entropy sources)
- Share game mechanics: instant racing, fair odds, Base deployment`;

    return basePrompt + postLaunchContext + `

Context: The chat has been quiet for ${hoursQuiet} hours.
Type of engagement: ${randomType}

Guidelines:
- Be natural and conversational, not scripted
- Stay in character as a knowledgeable community member
- ${isPostLaunch ? 'Encourage people to try racing at pxpony.com/game, share wins, ask questions' : 'Build excitement about the innovative tech'}
- Can ask "anyone racing today?" or similar if appropriate
- ${isPostLaunch ? 'Reference the website pxpony.com/game and /register for free PONY' : 'Discuss the revolutionary features being built'}
- Keep it short and engaging (1-2 sentences max)
- Use 🐎🏁 and relevant emojis naturally
- ${isPostLaunch ? 'Mention pxpony.com/game and /register for new racers' : ''}

Generate ONLY the message text, no quotes or explanations.`;
  }

  async generateEngagementResponse(prompt, context) {
    try {
      const systemPrompt = this.personality.getSystemPrompt();
      const contextMessages = context.map(entry => ({
        role: entry.role,
        content: entry.content
      }));

      const completion = await this.anthropic.messages.create({
        model: "claude-3-5-haiku-20241022",
        max_tokens: 100,
        temperature: 0.9, // Higher temperature for more variety
        system: systemPrompt,
        messages: [
          ...contextMessages,
          { role: "user", content: prompt }
        ]
      });

      return completion.content[0].text.trim();
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

  isContractAddressRequest(message) {
    const lowerMessage = message.toLowerCase();
    const contractKeywords = [
      'ca', 'contract', 'contract address', 'address', 'token address',
      'buy address', 'pony address', 'pony contract', '$pony contract',
      'where to buy', 'how to buy', 'dex', 'token contract',
      'base contract', 'basescan', 'game contract', 'base address',
      'uniswap', 'aerodrome'
    ];

    // Also check for exact matches like "CA" or "ca"
    const exactMatches = ['ca', 'CA', 'Ca'];
    if (exactMatches.includes(message.trim())) {
      return true;
    }

    return contractKeywords.some(keyword => lowerMessage.includes(keyword));
  }

  async generateDynamicVibe(context = []) {
    const currentHour = new Date().getHours();
    const launchDate = new Date('2025-10-14');
    const now = new Date();
    const isPostLaunch = now > launchDate;

    // Base vibe components - updated for actual game
    const openings = ["Currently", "Right now", "Today", "At this moment", "Honestly"];
    const moods = isPostLaunch ? [
      "celebrating instant on-chain racing",
      "watching players win on Base Mainnet",
      "seeing the 16-horse races execute perfectly",
      "pumped about the pull-based jackpot innovation",
      "excited about fair 10x/2.5x/1x payouts",
      "amazed by the zero-vulnerability contracts"
    ] : [
      "excited for the game launch",
      "impressed by the tech being built",
      "confident in the security audits",
      "hyped about Base Mainnet deployment",
      "focused on the innovative failsafe",
      "building something revolutionary"
    ];

    const perspectives = isPostLaunch ? [
      "the racing game is live and fully on-chain",
      "players are winning real PONY tokens",
      "every race gives a free lottery ticket",
      "Base gas fees make it super affordable",
      "instant races with fair randomness",
      "this is the future of blockchain gaming"
    ] : [
      "the tech is genuinely innovative",
      "pull-based failsafe solves real problems",
      "10 entropy sources ensure fairness",
      "Base Mainnet is the perfect platform",
      "contracts are verified and secure",
      "this will change on-chain gaming"
    ];

    const endings = ["🐎🏁", "🎮✨", "🏆", "🚀", "💎", "⚡", "🔥", "🎯", "👑"];

    // Context-aware modifications
    let timeContext = "";
    if (currentHour < 12) {
      timeContext = "Morning vibes. ";
    } else if (currentHour > 20) {
      timeContext = "Late night racing mode. ";
    }

    let launchContext = "";
    if (isPostLaunch) {
      launchContext = " Game is LIVE on Base! Use /play to get started! ";
    } else {
      const daysUntilLaunch = Math.max(0, Math.ceil((launchDate - now) / (1000 * 60 * 60 * 24)));
      if (daysUntilLaunch <= 7) {
        launchContext = ` ${daysUntilLaunch} days until launch! `;
      }
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
    const launchDate = new Date('2025-10-14');
    const now = new Date();
    const isPostLaunch = now > launchDate;

    const greetings = ["Hey everyone!", "What's up racers?", "Anyone around?", "How's everyone doing?"];

    const topics = isPostLaunch ? [
      "racing today on pxpony.com/game?",
      "trying out the 16-horse races?",
      "winning those 10x payouts?",
      "checking the jackpot?",
      "feeling about the game at pxpony.com?",
      "with the website launch?"
    ] : [
      "hyped for the game?",
      "excited about the tech?",
      "ready for instant racing?",
      "thinking about the launch?",
      "with the Base Mainnet deployment?"
    ];

    const timeContexts = {
      morning: "Morning racers! ",
      afternoon: "Afternoon everyone! ",
      evening: "Evening! ",
      night: "Night owls still here! "
    };

    let timeOfDay = 'afternoon';
    if (currentHour < 12) timeOfDay = 'morning';
    else if (currentHour > 18) timeOfDay = 'evening';
    else if (currentHour > 22) timeOfDay = 'night';

    const greeting = greetings[Math.floor(Math.random() * greetings.length)];
    const topic = topics[Math.floor(Math.random() * topics.length)];
    const timePrefix = Math.random() < 0.5 ? timeContexts[timeOfDay] : "";

    let suffix = " 🐎";
    if (isPostLaunch) {
      const gameMessages = [
        " Racing is LIVE at pxpony.com/game! 🏁",
        " Visit pxpony.com/game to play! 🎮",
        " 16 horses, instant results! 🐎✨",
        " Win up to 10x your bet! 💰",
        " Use /register for free PONY! 🎟️"
      ];
      suffix = gameMessages[Math.floor(Math.random() * gameMessages.length)];
    } else {
      const daysUntilLaunch = Math.max(0, Math.ceil((launchDate - now) / (1000 * 60 * 60 * 24)));
      if (daysUntilLaunch <= 7) {
        suffix = ` ${daysUntilLaunch} days to go! 🏁`;
      }
    }

    return `${timePrefix}${greeting} How's everyone ${topic}${suffix}`;
  }

  async jumpInWithHype(chatId, triggerMessage) {
    try {
      const context = await this.memory.getRecentHistory(chatId, 3);
      const launchDate = new Date('2025-10-14');
      const isPostLaunch = new Date() > launchDate;

      const hypePrompt = `Someone just mentioned something related to Pixel Pony racing! Jump in with relevant hype without interrupting their conversation.

Trigger message: "${triggerMessage}"

Guidelines:
- Be brief and hype-focused (1 sentence max)
- ${isPostLaunch ? 'Connect to the live game at pxpony.com/game: 16-horse racing, 10x payouts, free lottery' : 'Connect to the innovative tech: pull-based failsafe, Base deployment'}
- Don't directly respond to users talking to each other
- Add relevant gaming energy to the conversation
- ${isPostLaunch ? 'Mention pxpony.com/game or /register if they seem interested in trying' : 'Build excitement for upcoming launch'}
- Use 🐎🏁 emojis naturally

Generate ONLY the hype message, no quotes.`;

      const hypeResponse = await this.generateEngagementResponse(hypePrompt, context);
      await this.bot.sendMessage(chatId, hypeResponse);
      await this.memory.addMessage(chatId, 'assistant', hypeResponse);

      console.log(`🚀 Jumped in with racing hype: ${hypeResponse}`);
    } catch (error) {
      console.error('Error jumping in with hype:', error);
    }
  }

  setupRaceWatcher() {
    // Initialize race watcher with access to bot and active chats
    this.raceWatcher = new RaceWatcher(this.bot, this.activeChatIds);

    // Start watching for races
    this.raceWatcher.start();

    console.log('🏁 Race announcement system activated!');
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down Stable Master Bot...');
  if (global.stableMasterInstance) {
    if (global.stableMasterInstance.raceWatcher) {
      global.stableMasterInstance.raceWatcher.stop();
    }
    global.stableMasterInstance.healthServer.stop();
  }
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down gracefully...');
  if (global.stableMasterInstance) {
    if (global.stableMasterInstance.raceWatcher) {
      global.stableMasterInstance.raceWatcher.stop();
    }
    global.stableMasterInstance.healthServer.stop();
  }
  process.exit(0);
});

// Start the bot
global.stableMasterInstance = new StableMasterBot();