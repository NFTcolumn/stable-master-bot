const MemoryManager = require('./memory');

class ModerationSystem {
  constructor(bot) {
    this.bot = bot;
    this.memory = new MemoryManager();
    this.initializeModerationDB();
    
    // Regex patterns for detecting ANY links (for strict filtering)
    this.linkPattern = /https?:\/\/[^\s]+|www\.[^\s]+/gi;

    // Whitelisted domains that are ALLOWED
    this.allowedDomains = [
      'twitter.com',
      'x.com',
      'pxpony.com',
      'www.twitter.com',
      'www.x.com',
      'www.pxpony.com'
    ];

    // Regex patterns for detecting promotion
    this.promotionPatterns = [
      // Telegram invite links
      /https?:\/\/t\.me\/\+[A-Za-z0-9_-]+/gi,
      /https?:\/\/t\.me\/joinchat\/[A-Za-z0-9_-]+/gi,
      /https?:\/\/telegram\.me\/\+[A-Za-z0-9_-]+/gi,
      /https?:\/\/telegram\.me\/joinchat\/[A-Za-z0-9_-]+/gi,
      /t\.me\/\+[A-Za-z0-9_-]+/gi,
      /t\.me\/joinchat\/[A-Za-z0-9_-]+/gi,

      // Common promotion phrases
      /join\s+(?:our\s+)?(?:new\s+)?(?:telegram\s+)?(?:group|channel|chat)/gi,
      /new\s+(?:telegram\s+)?(?:group|channel|chat)/gi,
      /(?:best|new|hot)\s+(?:crypto\s+)?(?:signals?|calls?|tips?|group)/gi,
      /(?:pump\s+)?(?:and\s+)?dump\s+(?:signals?|group|channel)/gi,
      /(?:free\s+)?(?:crypto\s+)?(?:signals?|calls?)\s+(?:group|channel)/gi,

      // Token promotion keywords
      /(?:new\s+)?(?:gem|token|coin|project)\s+(?:launch|alert|signal)/gi,
      /(?:100x|1000x|moon|rocket|lambo)/gi,
      /(?:presale|fairlaunch|stealth\s+launch)/gi,
      /contract\s+address/gi,
      /CA:\s*0x[a-fA-F0-9]{40}/gi,
    ];

    // Whitelist patterns (messages that should NOT be flagged)
    this.whitelistPatterns = [
      /official\s+(?:group|channel|announcement)/gi,
      /support\s+(?:group|channel|chat)/gi,
    ];
  }

  initializeModerationDB() {
    this.memory.db.serialize(() => {
      // Create violations table
      this.memory.db.run(`
        CREATE TABLE IF NOT EXISTS user_violations (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          chat_id INTEGER NOT NULL,
          user_id INTEGER NOT NULL,
          username TEXT,
          violation_type TEXT NOT NULL,
          violation_count INTEGER DEFAULT 1,
          last_violation DATETIME DEFAULT CURRENT_TIMESTAMP,
          is_muted BOOLEAN DEFAULT FALSE,
          mute_until DATETIME,
          is_banned BOOLEAN DEFAULT FALSE,
          ban_date DATETIME
        )
      `);

      // Create deleted messages log
      this.memory.db.run(`
        CREATE TABLE IF NOT EXISTS deleted_messages (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          chat_id INTEGER NOT NULL,
          user_id INTEGER NOT NULL,
          username TEXT,
          message_text TEXT NOT NULL,
          deletion_reason TEXT NOT NULL,
          deleted_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create indexes
      this.memory.db.run(`
        CREATE INDEX IF NOT EXISTS idx_user_violations 
        ON user_violations(chat_id, user_id)
      `);
    });
  }

  isLinkAllowed(link) {
    try {
      // Extract domain from link
      let url;
      if (link.startsWith('http://') || link.startsWith('https://')) {
        url = new URL(link);
      } else if (link.startsWith('www.')) {
        url = new URL('https://' + link);
      } else {
        return false; // Invalid link format
      }

      const hostname = url.hostname.toLowerCase();

      // Check if the domain or any parent domain is in the allowed list
      return this.allowedDomains.some(allowedDomain => {
        return hostname === allowedDomain || hostname.endsWith('.' + allowedDomain);
      });
    } catch (error) {
      // If URL parsing fails, consider it not allowed
      return false;
    }
  }

  async checkMessage(msg) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const username = msg.from.username || msg.from.first_name || 'Unknown';
    const messageText = msg.text || msg.caption || '';

    // Skip if message is empty or from admin or VIP
    if (!messageText || await this.isAdmin(chatId, userId) || this.isVIP(username)) {
      return false;
    }

    // Check for whitelisted content first
    const isWhitelisted = this.whitelistPatterns.some(pattern =>
      pattern.test(messageText)
    );

    if (isWhitelisted) {
      return false;
    }

    // Check for ANY links and verify they're on the whitelist
    const links = messageText.match(this.linkPattern);
    if (links && links.length > 0) {
      const hasUnallowedLink = links.some(link => !this.isLinkAllowed(link));

      if (hasUnallowedLink) {
        await this.handleViolation(chatId, userId, username, msg, 'unauthorized_link');
        return true;
      }
    }

    // Check for promotion patterns
    const isPromotion = this.promotionPatterns.some(pattern =>
      pattern.test(messageText)
    );

    if (isPromotion) {
      await this.handleViolation(chatId, userId, username, msg, 'promotion');
      return true;
    }

    return false;
  }

  async handleViolation(chatId, userId, username, msg, violationType) {
    try {
      // Get user's violation history
      const violations = await this.getUserViolations(chatId, userId);
      const violationCount = violations ? violations.violation_count : 0;

      // Delete the offending message
      await this.bot.deleteMessage(chatId, msg.message_id);

      // Log the deleted message
      await this.logDeletedMessage(chatId, userId, username, msg.text || msg.caption || '', violationType);

      if (violationCount === 0) {
        // First violation - Warning
        await this.issueWarning(chatId, userId, username, violationType);
        await this.recordViolation(chatId, userId, username, violationType, 1);

      } else if (violationCount === 1) {
        // Second violation - Mute for 3 hours
        const muteUntil = new Date(Date.now() + (3 * 60 * 60 * 1000)); // 3 hours
        await this.muteUser(chatId, userId, username, muteUntil, violationType);
        await this.recordViolation(chatId, userId, username, violationType, 2);

      } else {
        // Third+ violation - Ban
        await this.banUser(chatId, userId, username, violationType);
        await this.recordViolation(chatId, userId, username, violationType, violationCount + 1);
      }

    } catch (error) {
      console.error('Error handling violation:', error);
    }
  }

  async issueWarning(chatId, userId, username, violationType = 'promotion') {
    let warningMessage;

    if (violationType === 'unauthorized_link') {
      warningMessage = `
⚠️ **Warning** @${username}

Your message was deleted because it contained an unauthorized link.

**Link Policy:**
• Only Twitter/X and pxpony.com links are allowed
• All other links will be automatically deleted
• Next violation = 3 hour mute

Keep discussions focused on our community! 🐴
      `;
    } else {
      warningMessage = `
⚠️ **Warning** @${username}

Your message was deleted for promoting external channels/tokens.

**Rules:**
• No promotion of other channels, groups, or tokens
• Only Twitter/X and pxpony.com links allowed
• Focus on our community discussions
• Next violation = 3 hour mute

Stay chill and keep it relevant! 😎
      `;
    }

    try {
      await this.bot.sendMessage(chatId, warningMessage, {
        parse_mode: 'Markdown',
        reply_to_message_id: undefined // Don't reply since original message is deleted
      });
    } catch (error) {
      // Fallback without markdown if it fails
      await this.bot.sendMessage(chatId, warningMessage.replace(/[*_`]/g, ''));
    }
  }

  async muteUser(chatId, userId, username, muteUntil, violationType = 'promotion') {
    try {
      // Restrict user permissions
      await this.bot.restrictChatMember(chatId, userId, {
        permissions: {
          can_send_messages: false,
          can_send_media_messages: false,
          can_send_polls: false,
          can_send_other_messages: false,
          can_add_web_page_previews: false,
          can_change_info: false,
          can_invite_users: false,
          can_pin_messages: false
        },
        until_date: Math.floor(muteUntil.getTime() / 1000)
      });

      const reasonText = violationType === 'unauthorized_link'
        ? 'Second violation: Posting unauthorized links'
        : 'Second violation: Promotion/spam';

      const muteMessage = `
🔇 **User Muted** @${username}

**Reason:** ${reasonText}
**Duration:** 3 hours
**Unmuted:** ${muteUntil.toLocaleString()}

Next violation will result in a permanent ban.
      `;

      await this.bot.sendMessage(chatId, muteMessage, { parse_mode: 'Markdown' });

    } catch (error) {
      console.error('Error muting user:', error);
      // Fallback notification
      await this.bot.sendMessage(chatId, `User @${username} should be muted for 3 hours (requires admin permissions)`);
    }
  }

  async banUser(chatId, userId, username, violationType = 'promotion') {
    try {
      await this.bot.banChatMember(chatId, userId);

      const reasonText = violationType === 'unauthorized_link'
        ? 'Third violation: Repeatedly posting unauthorized links'
        : 'Third violation: Continued promotion/spam';

      const banMessage = `
🚫 **User Banned** @${username}

**Reason:** ${reasonText}
**Action:** Permanently banned from the group

Continued violations after warnings are not tolerated.
      `;

      await this.bot.sendMessage(chatId, banMessage, { parse_mode: 'Markdown' });

    } catch (error) {
      console.error('Error banning user:', error);
      // Fallback notification
      await this.bot.sendMessage(chatId, `User @${username} should be banned (requires admin permissions)`);
    }
  }

  async recordViolation(chatId, userId, username, violationType, count) {
    return new Promise((resolve, reject) => {
      const query = `
        INSERT OR REPLACE INTO user_violations 
        (chat_id, user_id, username, violation_type, violation_count, last_violation, 
         is_muted, mute_until, is_banned, ban_date)
        VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?, ?, ?, ?)
      `;
      
      const isMuted = count === 2;
      const muteUntil = isMuted ? new Date(Date.now() + (3 * 60 * 60 * 1000)) : null;
      const isBanned = count >= 3;
      const banDate = isBanned ? new Date() : null;
      
      this.memory.db.run(query, [
        chatId, userId, username, violationType, count,
        isMuted, muteUntil, isBanned, banDate
      ], function(err) {
        if (err) reject(err);
        else resolve(this.lastID);
      });
    });
  }

  async logDeletedMessage(chatId, userId, username, messageText, reason) {
    return new Promise((resolve, reject) => {
      const query = `
        INSERT INTO deleted_messages 
        (chat_id, user_id, username, message_text, deletion_reason)
        VALUES (?, ?, ?, ?, ?)
      `;
      
      this.memory.db.run(query, [chatId, userId, username, messageText, reason], function(err) {
        if (err) reject(err);
        else resolve(this.lastID);
      });
    });
  }

  async getUserViolations(chatId, userId) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT * FROM user_violations 
        WHERE chat_id = ? AND user_id = ?
      `;
      
      this.memory.db.get(query, [chatId, userId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  async getModerationStats(chatId) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          COUNT(*) as total_violations,
          COUNT(CASE WHEN is_muted = 1 THEN 1 END) as total_mutes,
          COUNT(CASE WHEN is_banned = 1 THEN 1 END) as total_bans,
          COUNT(CASE WHEN last_violation >= datetime('now', '-24 hours') THEN 1 END) as violations_24h
        FROM user_violations 
        WHERE chat_id = ?
      `;
      
      this.memory.db.get(query, [chatId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  async isAdmin(chatId, userId) {
    try {
      const member = await this.bot.getChatMember(chatId, userId);
      return ['creator', 'administrator'].includes(member.status);
    } catch (error) {
      return false;
    }
  }

  isVIP(username) {
    // VIP users who are never moderated - the bosses!
    const vipUsers = ['nftmansa', 'nftiapia'];
    return vipUsers.includes(username?.toLowerCase());
  }

  async unmuteUser(chatId, userId) {
    try {
      await this.bot.restrictChatMember(chatId, userId, {
        permissions: {
          can_send_messages: true,
          can_send_media_messages: true,
          can_send_polls: true,
          can_send_other_messages: true,
          can_add_web_page_previews: true,
          can_change_info: false,
          can_invite_users: false,
          can_pin_messages: false
        }
      });
      return true;
    } catch (error) {
      console.error('Error unmuting user:', error);
      return false;
    }
  }
}

module.exports = ModerationSystem;