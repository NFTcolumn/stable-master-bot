# Roll Call System

The Stable Master Bot now includes an automated roll call system to keep your community active and engaged!

## Features

### 🎯 Automatic Activity Tracking
- Tracks all member activity in group chats
- Records last activity timestamp for each member
- Identifies inactive members (no activity for 7+ days)

### 📋 Weekly Roll Calls
- Automatically selects one random inactive member per week
- Sends a quiz-based roll call message
- Mentions the latest update (@Ponygatchi_bot)
- Gives members 24 hours to respond

### ✅ Response Verification
Members can prove they're active by:
- Reacting with ❤️ (heart) to the roll call message
- OR liking the @Ponygatchi_bot post

### 🚪 Automatic Removal
- Members who don't respond within 24 hours are automatically kicked
- They can rejoin later when they're ready to be active
- Keeps the community engaged and active

## Setup

### 1. Environment Configuration

Add your main chat ID to the `.env` file:

```bash
MAIN_CHAT_ID=-1001234567890
```

**How to find your chat ID:**
1. Add the bot to your group
2. Send a message in the group
3. Check the bot logs - the chat ID will be displayed
4. Copy the chat ID (including the minus sign if present)

### 2. Bot Permissions

Make sure the bot has these permissions in your group:
- ✅ Read messages
- ✅ Send messages
- ✅ Delete messages (for moderation)
- ✅ Ban users (to remove inactive members)

### 3. Deploy

The roll call system will automatically start when the bot launches if `MAIN_CHAT_ID` is set.

## Usage

### Automatic Operation
Once configured, the system runs automatically:
- Checks every hour for inactive members
- Sends roll calls to one random inactive member
- Checks for expired roll calls and removes non-responsive members

### Manual Commands (Admin Only)

#### `/rollcall`
Manually trigger a roll call for one inactive member.

```
/rollcall
```

#### `/rollcallstats`
View roll call statistics for your group.

```
/rollcallstats
```

**Example output:**
```
📊 Roll Call Statistics

• Total roll calls: 15
• Passed: 12
• Kicked: 2
• Pending: 1

Keeping the stable active! 🐎
```

## How It Works

### 1. Activity Tracking
Every time a member sends a message, their activity is recorded:
- User ID
- Username
- Last activity timestamp
- Total message count

### 2. Inactivity Detection
The system identifies members who:
- Haven't sent a message in 7+ days
- Are still marked as active in the database

### 3. Roll Call Process

**Step 1: Selection**
- System randomly selects one inactive member
- Creates a roll call event in the database

**Step 2: Quiz Message**
```
🔔 ROLL CALL! 🔔

Hey [Member]! It's been a while since we've seen you around. 
Time to prove you're still with us! 🐎

Quick Quiz: What's our latest update?
Hint: It's a new bot that just launched! 🎮

To stay in the stable, you need to:
✅ React to this message with ❤️ (like it)
OR
✅ Check out the @Ponygatchi_bot post and like it!

You have 24 hours to respond or you'll be removed from the group.

Don't be like Horse Guy... stay active! 🏁
```

**Step 3: Response Handling**
- Bot monitors for ❤️ reactions on the roll call message
- When member reacts, they're marked as passed
- Success message is sent to the group

**Step 4: Expiration Check**
- Every hour, the system checks for expired roll calls (24+ hours old)
- Non-responsive members are automatically kicked
- Notification is sent to the group

### 4. Database Schema

**member_activity table:**
```sql
- chat_id: Group chat identifier
- user_id: Telegram user ID
- username: User's @username
- first_name: User's first name
- last_activity: Timestamp of last message
- message_count: Total messages sent
- last_roll_call_response: Last time they passed a roll call
- roll_call_streak: Consecutive roll calls passed
- is_active: Whether they're still in the group
```

**roll_call_events table:**
```sql
- chat_id: Group chat identifier
- user_id: User being called
- username: User's @username
- started_at: When roll call was sent
- responded_at: When they responded (if they did)
- quiz_answer: Their answer (reserved for future use)
- passed: Whether they passed the roll call
- kicked: Whether they were removed
```

## Customization

You can customize the roll call system by editing `rollCall.js`:

### Change Inactivity Threshold
```javascript
this.INACTIVITY_THRESHOLD = 7 * 24 * 60 * 60 * 1000; // 7 days (in milliseconds)
```

### Change Response Time
```javascript
this.ROLL_CALL_DURATION = 24 * 60 * 60 * 1000; // 24 hours (in milliseconds)
```

### Change Check Frequency
```javascript
const checkInterval = 60 * 60 * 1000; // 1 hour (in milliseconds)
```

### Customize Roll Call Message
Edit the `generateRollCallMessage()` method in `rollCall.js`:

```javascript
generateRollCallMessage(member) {
  const name = member.first_name || member.username || 'member';
  
  const message = `
🔔 **ROLL CALL!** 🔔

Hey ${name}! [Your custom message here]
  `.trim();

  return message;
}
```

## Monitoring

### Logs
The system logs all roll call activities:
```
📋 Roll call started for user @username in chat -1001234567890
✅ Roll call passed for user 123456789 in chat -1001234567890
🚪 Kicked inactive member: @username from chat -1001234567890
```

### Database Queries
You can query the database directly for analytics:

**Most active members:**
```sql
SELECT username, message_count, last_activity 
FROM member_activity 
WHERE chat_id = ? 
ORDER BY message_count DESC 
LIMIT 10;
```

**Roll call success rate:**
```sql
SELECT 
  COUNT(*) as total,
  SUM(CASE WHEN passed = 1 THEN 1 ELSE 0 END) as passed,
  ROUND(SUM(CASE WHEN passed = 1 THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) as success_rate
FROM roll_call_events
WHERE chat_id = ?;
```

## Troubleshooting

### Roll calls not starting
1. Check that `MAIN_CHAT_ID` is set in `.env`
2. Verify the chat ID is correct (should start with `-100` for supergroups)
3. Check bot logs for errors
4. Ensure there are inactive members (7+ days of inactivity)

### Members not getting kicked
1. Verify bot has "Ban users" permission
2. Check bot logs for permission errors
3. Ensure the bot is an admin in the group

### Reactions not being detected
1. Telegram's reaction API requires the bot to have proper permissions
2. Make sure the bot can see message updates
3. Check that members are using the ❤️ emoji specifically

## Best Practices

1. **Announce the feature**: Let your community know about the roll call system before enabling it
2. **Start gradually**: Monitor the first few roll calls to ensure everything works correctly
3. **Be fair**: Give members the full 24 hours to respond
4. **Communicate**: Post about @Ponygatchi_bot so members know what the quiz answer is
5. **Review stats**: Use `/rollcallstats` regularly to monitor engagement

## Future Enhancements

Potential improvements for the roll call system:
- [ ] Multiple choice quiz questions
- [ ] Configurable quiz content via admin commands
- [ ] Warning system (warn before kicking)
- [ ] Whitelist for VIP members
- [ ] Custom messages per member
- [ ] Integration with other bot features
- [ ] Analytics dashboard

## Support

If you encounter issues with the roll call system:
1. Check the logs for error messages
2. Verify your configuration in `.env`
3. Test with `/rollcall` command manually
4. Review the database tables for data integrity

---

**Remember:** The goal is to keep your community active and engaged, not to punish members. Use this feature thoughtfully! 🐎
