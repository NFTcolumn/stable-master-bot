const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class RollCallManager {
    constructor(bot, db) {
        this.bot = bot;
        this.db = db;
        this.initializeDatabase();
        this.rollCallActive = new Map(); // Track active roll calls per chat
        this.ROLL_CALL_DURATION = 24 * 60 * 60 * 1000; // 24 hours to respond
        this.INACTIVITY_THRESHOLD = 7 * 24 * 60 * 60 * 1000; // 7 days
    }

    initializeDatabase() {
        this.db.serialize(() => {
            // Track member activity
            this.db.run(`
        CREATE TABLE IF NOT EXISTS member_activity (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          chat_id INTEGER NOT NULL,
          user_id INTEGER NOT NULL,
          username TEXT,
          first_name TEXT,
          last_activity DATETIME DEFAULT CURRENT_TIMESTAMP,
          message_count INTEGER DEFAULT 0,
          last_roll_call_response DATETIME,
          roll_call_streak INTEGER DEFAULT 0,
          is_active BOOLEAN DEFAULT TRUE,
          UNIQUE(chat_id, user_id)
        )
      `);

            // Track roll call events
            this.db.run(`
        CREATE TABLE IF NOT EXISTS roll_call_events (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          chat_id INTEGER NOT NULL,
          user_id INTEGER NOT NULL,
          username TEXT,
          started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          responded_at DATETIME,
          quiz_answer TEXT,
          passed BOOLEAN DEFAULT FALSE,
          kicked BOOLEAN DEFAULT FALSE
        )
      `);

            // Create indexes
            this.db.run(`
        CREATE INDEX IF NOT EXISTS idx_member_activity 
        ON member_activity(chat_id, last_activity DESC)
      `);

            this.db.run(`
        CREATE INDEX IF NOT EXISTS idx_roll_call_events 
        ON roll_call_events(chat_id, started_at DESC)
      `);
        });

        console.log('📋 Roll Call database initialized');
    }

    // Track member activity from messages
    async trackActivity(msg) {
        if (!msg.from || msg.from.is_bot) return;

        const chatId = msg.chat.id;
        const userId = msg.from.id;
        const username = msg.from.username || null;
        const firstName = msg.from.first_name || null;

        return new Promise((resolve, reject) => {
            this.db.run(`
        INSERT INTO member_activity (chat_id, user_id, username, first_name, last_activity, message_count)
        VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, 1)
        ON CONFLICT(chat_id, user_id) 
        DO UPDATE SET 
          last_activity = CURRENT_TIMESTAMP,
          message_count = message_count + 1,
          username = excluded.username,
          first_name = excluded.first_name,
          is_active = TRUE
      `, [chatId, userId, username, firstName], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }

    // Get next member for roll call (goes through all members in order)
    async getNextMemberForRollCall(chatId) {
        return new Promise((resolve, reject) => {
            const query = `
        SELECT 
          ma.user_id, 
          ma.username, 
          ma.first_name, 
          ma.last_activity,
          ma.last_roll_call_response,
          MAX(rce.started_at) as last_roll_call_sent
        FROM member_activity ma
        LEFT JOIN roll_call_events rce 
          ON ma.chat_id = rce.chat_id 
          AND ma.user_id = rce.user_id
        WHERE ma.chat_id = ? 
          AND ma.is_active = TRUE
        GROUP BY ma.user_id
        HAVING 
          -- Never had a roll call OR last roll call was responded to
          (last_roll_call_sent IS NULL OR 
           EXISTS (
             SELECT 1 FROM roll_call_events 
             WHERE chat_id = ? 
               AND user_id = ma.user_id 
               AND started_at = last_roll_call_sent 
               AND responded_at IS NOT NULL
           ))
        ORDER BY 
          -- Prioritize: never checked in, then oldest last_roll_call_response, then by user_id
          CASE WHEN ma.last_roll_call_response IS NULL THEN 0 ELSE 1 END,
          ma.last_roll_call_response ASC,
          ma.user_id ASC
        LIMIT 1
      `;

            this.db.get(query, [chatId, chatId], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    }

    // Start a roll call for a specific member
    async startRollCall(chatId, member) {
        // Record the roll call event
        return new Promise((resolve, reject) => {
            this.db.run(`
        INSERT INTO roll_call_events (chat_id, user_id, username, started_at)
        VALUES (?, ?, ?, CURRENT_TIMESTAMP)
      `, [chatId, member.user_id, member.username], function (err) {
                if (err) reject(err);
                else resolve(this.lastID);
            });
        });
    }

    // Generate roll call message with quiz
    generateRollCallMessage(member) {
        const name = member.first_name || member.username || 'member';

        const message = `
🔔 **ROLL CALL!** 🔔

Hey ${name}! Time to check in and prove you're an active member of the stable! 🐎

**Quick Quiz:** What's our latest update?
Hint: It's a new bot that just launched! 🎮

To stay in the stable, you need to:
✅ React to this message with ❤️ (like it)
OR
✅ Check out the @Ponygatchi_bot post and like it!

You have **24 hours** to respond or you'll be removed from the group. 

Don't be like Horse Guy... stay active! 🏁
    `.trim();

        return message;
    }

    // Handle roll call response (like/reaction)
    async handleRollCallResponse(chatId, userId, eventId) {
        return new Promise((resolve, reject) => {
            this.db.run(`
        UPDATE roll_call_events
        SET responded_at = CURRENT_TIMESTAMP,
            passed = TRUE
        WHERE id = ? AND user_id = ?
      `, [eventId, userId], (err) => {
                if (err) reject(err);
                else {
                    // Update member activity
                    this.db.run(`
            UPDATE member_activity
            SET last_roll_call_response = CURRENT_TIMESTAMP,
                roll_call_streak = roll_call_streak + 1,
                is_active = TRUE
            WHERE chat_id = ? AND user_id = ?
          `, [chatId, userId], (err) => {
                        if (err) reject(err);
                        else resolve(true);
                    });
                }
            });
        });
    }

    // Check for expired roll calls and kick members
    async checkExpiredRollCalls(chatId) {
        return new Promise((resolve, reject) => {
            const query = `
        SELECT id, user_id, username, started_at
        FROM roll_call_events
        WHERE chat_id = ?
          AND responded_at IS NULL
          AND kicked = FALSE
          AND julianday('now') - julianday(started_at) > 1
      `;

            this.db.all(query, [chatId], async (err, rows) => {
                if (err) {
                    reject(err);
                    return;
                }

                for (const row of rows) {
                    try {
                        // Try to kick the member
                        await this.bot.banChatMember(chatId, row.user_id);

                        // Unban immediately (just removes them, doesn't permanently ban)
                        await this.bot.unbanChatMember(chatId, row.user_id);

                        // Mark as kicked in database
                        await new Promise((res, rej) => {
                            this.db.run(`
                UPDATE roll_call_events
                SET kicked = TRUE
                WHERE id = ?
              `, [row.id], (err) => {
                                if (err) rej(err);
                                else res();
                            });
                        });

                        // Mark member as inactive
                        await new Promise((res, rej) => {
                            this.db.run(`
                UPDATE member_activity
                SET is_active = FALSE
                WHERE chat_id = ? AND user_id = ?
              `, [chatId, row.user_id], (err) => {
                                if (err) rej(err);
                                else res();
                            });
                        });

                        // Send notification
                        const name = row.username ? `@${row.username}` : 'member';
                        await this.bot.sendMessage(chatId,
                            `${name} didn't respond to roll call and has been removed from the stable. 👋 Come back when you're ready to be active!`
                        );

                        console.log(`🚪 Kicked inactive member: ${row.username || row.user_id} from chat ${chatId}`);
                    } catch (error) {
                        console.error(`Error kicking member ${row.user_id}:`, error.message);
                    }
                }

                resolve(rows.length);
            });
        });
    }

    // Get roll call statistics
    async getRollCallStats(chatId) {
        return new Promise((resolve, reject) => {
            const query = `
        SELECT 
          COUNT(*) as total_roll_calls,
          COUNT(CASE WHEN passed = TRUE THEN 1 END) as passed,
          COUNT(CASE WHEN kicked = TRUE THEN 1 END) as kicked,
          COUNT(CASE WHEN responded_at IS NULL AND kicked = FALSE THEN 1 END) as pending
        FROM roll_call_events
        WHERE chat_id = ?
      `;

            this.db.get(query, [chatId], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    }

    // Schedule roll calls every 10 minutes
    startScheduledRollCalls(chatId) {
        // Check every 10 minutes for next member
        const checkInterval = 10 * 60 * 1000; // 10 minutes

        const scheduleCheck = async () => {
            try {
                console.log(`
🔄 [ROLL CALL] Starting scheduled check for chat ${chatId}...`);
                // Get next member in order who needs to be checked
                const nextMember = await this.getNextMemberForRollCall(chatId);

                if (nextMember) {
                    // Start roll call
                    const eventId = await this.startRollCall(chatId, nextMember);
                    const message = this.generateRollCallMessage(nextMember);

                    // Send roll call message
                    const sentMessage = await this.bot.sendMessage(chatId, message, {
                        parse_mode: 'Markdown'
                    });

                    // Store the message ID to track reactions
                    this.rollCallActive.set(`${chatId}_${nextMember.user_id}`, {
                        eventId,
                        messageId: sentMessage.message_id,
                        userId: nextMember.user_id,
                        startTime: Date.now()
                    });

                    console.log(`📋 Roll call started for user ${nextMember.username || nextMember.user_id} in chat ${chatId}`);
                    console.log(`   └─ Event ID: ${eventId}, Message ID: ${sentMessage.message_id}`);
                    console.log(`   └─ Member has 24 hours to respond`);
                } else {
                    console.log(`✅ All members have been checked in chat ${chatId}`);
                    console.log(`   └─ No pending roll calls needed`);
                }

                // Check for expired roll calls
                await this.checkExpiredRollCalls(chatId);

            } catch (error) {
                console.error('❌ [ROLL CALL] Error in scheduled roll call check:', error);
                console.error('   └─ Details:', error.message);
            }

            // Schedule next check
            setTimeout(scheduleCheck, checkInterval);
        };

        // Start the first check after 10 minutes
        setTimeout(scheduleCheck, checkInterval);
        console.log(`📅 Scheduled roll calls activated for chat ${chatId} (every 10 minutes)`);
    }

    // Handle message reactions (for roll call responses)
    setupReactionHandler() {
        this.bot.on('message_reaction', async (reaction) => {
            try {
                const chatId = reaction.chat.id;
                const userId = reaction.user.id;
                const messageId = reaction.message_id;

                // Check if this is a response to an active roll call
                for (const [key, rollCall] of this.rollCallActive.entries()) {
                    if (rollCall.messageId === messageId && rollCall.userId === userId) {
                        // Check if they added a heart reaction
                        const hasHeart = reaction.new_reaction.some(r =>
                            r.emoji === '❤️' || r.type === 'emoji' && r.emoji === '❤️'
                        );

                        if (hasHeart) {
                            await this.handleRollCallResponse(chatId, userId, rollCall.eventId);

                            const member = await this.getMemberInfo(chatId, userId);
                            const name = member.first_name || member.username || 'member';

                            await this.bot.sendMessage(chatId,
                                `✅ ${name} has checked in! Welcome back to the stable! 🐎`
                            );

                            // Remove from active roll calls
                            this.rollCallActive.delete(key);
                            console.log(`✅ Roll call passed for user ${userId} in chat ${chatId}`);
                        }
                    }
                }
            } catch (error) {
                console.error('Error handling reaction:', error);
            }
        });
    }

    // Get member info
    async getMemberInfo(chatId, userId) {
        return new Promise((resolve, reject) => {
            this.db.get(`
        SELECT * FROM member_activity
        WHERE chat_id = ? AND user_id = ?
      `, [chatId, userId], (err, row) => {
                if (err) reject(err);
                else resolve(row || {});
            });
        });
    }
}

module.exports = RollCallManager;
