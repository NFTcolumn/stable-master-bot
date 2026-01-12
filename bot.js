require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const Anthropic = require('@anthropic-ai/sdk');
const MemoryManager = require('./memory');
const PersonalitySystem = require('./personality');
const HealthServer = require('./server');
const ModerationSystem = require('./moderation');
const RollCallManager = require('./rollCall');
// const RaceWatcher = require('./raceWatcher'); // Disabled - not needed

class StableMasterBot {
  constructor() {
    // Use webhooks in production (Render), polling for local development
    const useWebhook = process.env.RENDER === 'true' || process.env.USE_WEBHOOK === 'true';

    if (useWebhook) {
      console.log('🌐 Using webhook mode for production...');
      this.bot = new TelegramBot(process.env.TELEGRAM_TOKEN);
      this.setupWebhook();
    } else {
      console.log('📡 Using polling mode for development...');
      this.bot = new TelegramBot(process.env.TELEGRAM_TOKEN, { polling: true });
    }

    this.anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    this.memory = new MemoryManager();
    this.personality = new PersonalitySystem();
    this.moderation = new ModerationSystem(this.bot);
    this.rollCall = new RollCallManager(this.bot, this.memory.db);
    this.isProcessing = new Set(); // Prevent concurrent processing for same chat

    // Start health server for Render deployment
    this.healthServer = new HealthServer(this.bot, useWebhook ? this.bot : null);
    this.healthServer.start();

    this.setupCommands();
    this.setupMessageHandler();
    this.setupNewMemberGreeting();
    this.setupCommunityEngagement();
    this.setupRollCall();
    // this.setupRaceWatcher(); // Disabled - not needed

    console.log('🤖 Stable Master Bot initialized and ready to chill...');
  }

  setupWebhook() {
    const webhookUrl = process.env.WEBHOOK_URL ||
      (process.env.RENDER_EXTERNAL_HOSTNAME ?
        `https://${process.env.RENDER_EXTERNAL_HOSTNAME}/webhook` :
        null);

    if (!webhookUrl) {
      console.error('❌ No webhook URL configured!');
      console.error('   Set either WEBHOOK_URL or RENDER_EXTERNAL_HOSTNAME in environment');
      console.error('   Example: WEBHOOK_URL=https://your-service.onrender.com/webhook');
      return;
    }

    console.log(`🔧 Setting webhook to: ${webhookUrl}`);

    // Delete any existing webhook first
    this.bot.deleteWebHook()
      .then(() => {
        console.log('🧹 Cleared any existing webhooks');
        // Set new webhook
        return this.bot.setWebHook(webhookUrl);
      })
      .then(() => {
        console.log(`✅ Webhook set to: ${webhookUrl}`);
      })
      .catch(err => {
        console.error('❌ Error setting webhook:', err.message);
        console.error('   Webhook URL attempted:', webhookUrl);
        console.error('   Make sure the URL is publicly accessible');
      });
  }

  setupCommands() {
    // Basic commands
    this.bot.onText(/\/start/, (msg) => {
      const chatId = msg.chat.id;
      const welcomeMessage = `
🐎 **Welcome to Pixel Pony Racing!** 🏁

I'm Stable Master - I help you understand and play instant on-chain horse racing!

**The game is LIVE on 4 chains!**
Visit pxpony.com and use the chain selector:
• Base, Celo, BNB Chain, or Polygon

**What is Pixel Pony?**
• 16-horse instant racing on multiple blockchains
• Bet PONY tokens, win up to 10x your bet!
• FREE lottery ticket with every race
• Fair odds: 1st = 10x, 2nd = 2.5x, 3rd = 1x

**Commands:**
/play - Learn how to play
/register - Get started with PONY tokens!
/horseguy - Learn about Horse Guy's cautionary tale
/info - Game mechanics and details
/memory - View conversation history
/clear - Clear memory

**Quick Links:**
🌐 Website: https://pxpony.com/
🐦 Twitter: https://x.com/pxponies

Ready to race? Visit pxpony.com now! 🚀

_P.S. Don't be like Horse Guy. He's in Austin now. You don't want to know._
      `;
      this.bot.sendMessage(chatId, welcomeMessage, { parse_mode: 'Markdown' });
    });

    // New game-specific commands
    this.bot.onText(/\/play/, (msg) => {
      const chatId = msg.chat.id;
      const playGuide = `
🎮 **HOW TO PLAY PIXEL PONY** 🐎

**The game is LIVE on 4 chains!**

**Step 1: Visit pxpony.com**
• Use the chain selector to pick your blockchain:
• Base, Celo, BNB Chain, or Polygon

**Step 2: Get PONY Tokens**
Don't have PONY? Use /register to get started!

**Step 3: Connect & Play**
• Connect your wallet
• Choose ONE lucky horse (1-16 on the interface)
• Place your bet in PONY tokens
• Pay the small entry fee (varies by chain)
• Race executes instantly on-chain!

**Payouts:**
🥇 1st: 10x your bet
🥈 2nd: 2.5x your bet
🥉 3rd: 1x (break even)
🎟️ Free lottery ticket every race!

**Ready to race?**
👉 Visit pxpony.com now! 🏁

_Remember: Horse Guy thought he could quit anytime. Now he's in Austin doing... things. For PONY. Don't be Horse Guy._ 💀
      `;
      this.bot.sendMessage(chatId, playGuide, { parse_mode: 'Markdown', disable_web_page_preview: true });
    });

    this.bot.onText(/\/register/, (msg) => {
      const chatId = msg.chat.id;
      const registerInfo = `
🎁 **GET STARTED WITH PONY!** 🐎

**Ready to start racing?**

**Step 1: Visit pxpony.com**
Use the chain selector to pick your preferred blockchain:
• Base, Celo, BNB Chain, or Polygon

**Step 2: Get PONY Tokens**
• Register on the site to get 100M PONY airdrop!
• Or buy on DEXs for your chosen chain

**Step 3: Race!**
• Pick your horse (1-16)
• Win up to 10x your bet
• Free lottery ticket every race

**For Marketing/Referrals:**
Visit pxpony.com → Select your chain → Go to Referrals tab

**Ready to race?**
👉 Visit pxpony.com now! 🏁

_Don't end up like Horse Guy... he couldn't stop racing and now he's somewhere in Austin. You know what he's doing. Don't be Horse Guy._ 😬
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

    this.bot.onText(/\/horseguy/, (msg) => {
      const chatId = msg.chat.id;
      const horseGuyStory = `
🐴 **THE TALE OF HORSE GUY** 💀

Let me tell you about Horse Guy. A cautionary tale.

Horse Guy started out just like you. "Just one race," he said. "I'll stop after I win 10x," he said.

But Horse Guy didn't stop.

First it was his savings. Then his car. Then his house. "Just one more race," he'd whisper at 3 AM, eyes bloodshot, clicking that bet button over and over.

His friends tried to help. "Horse Guy, you need to stop," they'd say. But Horse Guy couldn't hear them anymore. All he could hear was the thundering of pixel hooves and the sweet jingle of PONY tokens.

Last anyone heard, Horse Guy was seen in Austin, Texas. Behind a Wendy's dumpster. Doing... things. Unspeakable things. All for more PONY tokens. Just one more race.

**THE MORAL:**
Horse Guy thought he could control it. He was wrong.

Don't be Horse Guy.

Race responsibly. Know your limits. And for the love of god, don't end up behind a Wendy's in Austin.

🚨 **Play responsibly. This is supposed to be fun, not a lifestyle.** 🚨

_Still want to play? Visit pxpony.com - but remember Horse Guy's story._ 👀
      `;
      this.bot.sendMessage(chatId, horseGuyStory, { parse_mode: 'Markdown' });
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

Use /play to learn how or /register to get 100M PONY! 🏁
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
      const racesMessage = `
🏁 **PIXEL PONY RACING** 🐎

Race live at pxpony.com/game!

**Game Features:**
• 16 horses per race
• Instant results
• Win up to 10x your bet!
• Free lottery ticket every race
• Progressive jackpot

**How to Play:**
1. Visit pxpony.com/game
2. Connect your wallet (Base network)
3. Use /register to get 100M PONY!
4. Pick your horse and race!

**Ready to win?**
👉 Play now at pxpony.com/game! 🏁
      `;
      this.bot.sendMessage(chatId, racesMessage, { parse_mode: 'Markdown', disable_web_page_preview: true });
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
      // Track member activity for roll call system
      if (msg.chat.type === 'group' || msg.chat.type === 'supergroup') {
        await this.rollCall.trackActivity(msg).catch(err =>
          console.error('Error tracking activity:', err)
        );
      }

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
    const launchDate = new Date('2025-10-14');
    const isPostLaunch = new Date() > launchDate;

    const engagementTypes = isPostLaunch ? [
      'community_question', 'horse_guy_reference', 'chain_discussion',
      'strategy_question', 'fun_poll', 'horse_guy_warning'
    ] : [
      'community_question', 'game_preview', 'casual_chat'
    ];

    const randomType = engagementTypes[Math.floor(Math.random() * engagementTypes.length)];

    const basePrompt = `You're feeling like engaging with the community. Generate a community engagement message as Stable Master.`;

    const postLaunchContext = isPostLaunch ? `

CURRENT PHASE: GAME IS LIVE
- Game is live at pxpony.com (multi-chain: Base, Celo, BNB, Polygon)
- ASK ENGAGING QUESTIONS like:
  * "What's your favorite chain to play on?"
  * "Has anyone tried racing on BNB Chain yet?"
  * "What's your horse-picking strategy?"
  * "Which chain has the best fees in your experience?"
- Sometimes reference Horse Guy's cautionary tale
- Example Horse Guy references:
  * "Remember Horse Guy? Don't be Horse Guy."
  * "Saw Horse Guy in Austin last week. Still doing it for PONY. Sad."
  * "Play responsibly folks. We don't need another Horse Guy situation."
- Keep it light, fun, and community-focused
- NO HYPE about winnings or "to the moon" nonsense` : `

CURRENT PHASE: PRE-LAUNCH
- Ask questions about what chains people prefer
- Build community through discussion`;

    return basePrompt + postLaunchContext + `

Type of engagement: ${randomType}

Guidelines:
- Ask genuine community questions to spark discussion
- Sometimes drop a Horse Guy reference (cautionary tale about addiction)
- Be natural and conversational
- Keep it short (1-2 sentences max)
- Use 🐎 emoji naturally
- AVOID telling people how dead/quiet the room is
- FOCUS on asking questions, not making statements

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
      "Sorry bro I'm not feeling well, dev has to fix me up. 🤒",
      "Oof, not feeling so good right now. Dev needs to check on me! 🔧",
      "My brain's being weird rn, dev's gotta help me out. 😵",
      "Something's off with me, dev needs to take a look. 🛠️",
      "Not operating at 100% rn, dev has to patch me up. ⚡"
    ];
    return errorTypes[Math.floor(Math.random() * errorTypes.length)];
  }

  generateDynamicFallback() {
    const launchDate = new Date('2025-10-14');
    const now = new Date();
    const isPostLaunch = now > launchDate;

    const questions = isPostLaunch ? [
      "What's your favorite chain to play on? 🐎",
      "Has anyone tried the game on Polygon yet?",
      "What's everyone's horse-picking strategy? 🎯",
      "Which chain has the best fees in your experience?",
      "Anyone racing on Celo? How's it going?",
      "BNB Chain or Base - which do you prefer? 🤔"
    ] : [
      "What chain are you most excited to try? 🐎",
      "Ready for the multi-chain launch?",
      "Base, Celo, BNB, or Polygon - what's your pick?"
    ];

    const horseGuyReferences = [
      "Remember Horse Guy? Don't be Horse Guy. Play responsibly. 🐎",
      "Saw Horse Guy in Austin last week. Still doing... things. For PONY. Don't be Horse Guy. 💀",
      "Play responsibly folks. We don't need another Horse Guy situation. 😬",
      "Horse Guy started with 'just one race.' Now he's in Austin. Learn from his mistakes. 🚨"
    ];

    // 30% chance for Horse Guy reference, 70% for community question
    if (Math.random() < 0.3) {
      return horseGuyReferences[Math.floor(Math.random() * horseGuyReferences.length)];
    } else {
      return questions[Math.floor(Math.random() * questions.length)];
    }
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

  setupRollCall() {
    // Setup reaction handler for roll call responses
    this.rollCall.setupReactionHandler();

    // Get the main group chat ID from environment or use default
    const mainChatId = process.env.MAIN_CHAT_ID;

    if (mainChatId) {
      // Start scheduled roll calls for the main chat
      this.rollCall.startScheduledRollCalls(parseInt(mainChatId));
      console.log(`📋 Roll call system activated for chat ${mainChatId}`);
    } else {
      console.log('⚠️  MAIN_CHAT_ID not set - roll calls will not be scheduled automatically');
      console.log('   Set MAIN_CHAT_ID in .env to enable automatic roll calls');
    }

    // Add roll call commands
    this.bot.onText(/\/rollcall/, async (msg) => {
      const chatId = msg.chat.id;
      const userId = msg.from.id;

      // Check if user is admin
      if (!(await this.moderation.isAdmin(chatId, userId))) {
        return this.bot.sendMessage(chatId, "Only admins can manually trigger roll calls.");
      }

      try {
        const nextMember = await this.rollCall.getNextMemberForRollCall(chatId);

        if (!nextMember) {
          return this.bot.sendMessage(chatId, "All members have been checked! Everyone's up to date. 🎉");
        }

        const eventId = await this.rollCall.startRollCall(chatId, nextMember);
        const message = this.rollCall.generateRollCallMessage(nextMember);

        const sentMessage = await this.bot.sendMessage(chatId, message, {
          parse_mode: 'Markdown'
        });

        this.rollCall.rollCallActive.set(`${chatId}_${nextMember.user_id}`, {
          eventId,
          messageId: sentMessage.message_id,
          userId: nextMember.user_id,
          startTime: Date.now()
        });

        console.log(`📋 Manual roll call started for user ${nextMember.username || nextMember.user_id}`);
      } catch (error) {
        console.error('Error starting roll call:', error);
        this.bot.sendMessage(chatId, "Error starting roll call. Please try again.");
      }
    });

    this.bot.onText(/\/rollcallstats/, async (msg) => {
      const chatId = msg.chat.id;
      const userId = msg.from.id;

      if (!(await this.moderation.isAdmin(chatId, userId))) {
        return this.bot.sendMessage(chatId, "Only admins can view roll call stats.");
      }

      try {
        const stats = await this.rollCall.getRollCallStats(chatId);
        const statsMessage = `
📊 **Roll Call Statistics**

• Total roll calls: ${stats.total_roll_calls}
• Passed: ${stats.passed}
• Kicked: ${stats.kicked}
• Pending: ${stats.pending}

Keeping the stable active! 🐎
        `;
        this.bot.sendMessage(chatId, statsMessage, { parse_mode: 'Markdown' });
      } catch (error) {
        console.error('Error fetching roll call stats:', error);
        this.bot.sendMessage(chatId, "Error fetching roll call stats.");
      }
    });
  }

  // setupRaceWatcher() {
  //   // Initialize race watcher with access to bot and active chats
  //   this.raceWatcher = new RaceWatcher(this.bot, this.activeChatIds);

  //   // Start watching for races
  //   this.raceWatcher.start();

  //   console.log('🏁 Race announcement system activated!');
  // }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down Stable Master Bot...');
  if (global.stableMasterInstance) {
    // if (global.stableMasterInstance.raceWatcher) {
    //   global.stableMasterInstance.raceWatcher.stop();
    // }
    global.stableMasterInstance.healthServer.stop();
  }
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down gracefully...');
  if (global.stableMasterInstance) {
    // if (global.stableMasterInstance.raceWatcher) {
    //   global.stableMasterInstance.raceWatcher.stop();
    // }
    global.stableMasterInstance.healthServer.stop();
  }
  process.exit(0);
});

// Start the bot
global.stableMasterInstance = new StableMasterBot();