# Roll Call System - Deployment Guide

## Quick Setup for Render

### 1. Update Environment Variables on Render

Go to your Render dashboard and add this new environment variable:

```
MAIN_CHAT_ID = -1001234567890
```

**How to get your chat ID:**

1. Start the bot (it's already running on Render)
2. Send any message in your Telegram group
3. Check the Render logs - you'll see messages like:
   ```
   Message from chat: -1001234567890
   ```
4. Copy that number (including the minus sign)
5. Add it to your Render environment variables as `MAIN_CHAT_ID`

### 2. Deploy the Changes

The changes are already in your code. You just need to:

1. Push the code to your repository:
   ```bash
   git add .
   git commit -m "Add roll call system"
   git push
   ```

2. Render will automatically redeploy with the new code

### 3. Verify It's Working

After deployment, check the Render logs. You should see:
```
📋 Roll Call database initialized
📋 Roll call system activated for chat -1001234567890
```

If you see this instead, you need to add the MAIN_CHAT_ID:
```
⚠️  MAIN_CHAT_ID not set - roll calls will not be scheduled automatically
```

## How It Works

### Automatic Operation

Once deployed with `MAIN_CHAT_ID` set:

1. **Activity Tracking**: Every message in the group is tracked
2. **Hourly Checks**: Every hour, the bot checks for inactive members (7+ days)
3. **Roll Call**: If found, sends a quiz message mentioning @Ponygatchi_bot
4. **Response Window**: Members have 24 hours to react with ❤️
5. **Auto-Kick**: Non-responsive members are automatically removed

### Manual Testing

You can test the system immediately with admin commands:

```
/rollcall
```
This will manually trigger a roll call for one inactive member.

```
/rollcallstats
```
This shows statistics about roll calls.

## Database

The roll call system uses the same `conversations.db` that's already on Render. It adds two new tables:

- `member_activity` - Tracks all member activity
- `roll_call_events` - Records all roll call events

The database will automatically grow with usage. No manual setup needed!

## Bot Permissions Required

Make sure the bot has these permissions in your Telegram group:

- ✅ Read messages
- ✅ Send messages  
- ✅ Delete messages
- ✅ Ban users

To set permissions:
1. Go to your Telegram group
2. Click the group name → Administrators
3. Find your bot
4. Enable the permissions above

## Customization

If you want to change the settings, edit `rollCall.js`:

**Change inactivity period (currently 7 days):**
```javascript
this.INACTIVITY_THRESHOLD = 7 * 24 * 60 * 60 * 1000;
```

**Change response time (currently 24 hours):**
```javascript
this.ROLL_CALL_DURATION = 24 * 60 * 60 * 1000;
```

**Change check frequency (currently 1 hour):**
```javascript
const checkInterval = 60 * 60 * 1000;
```

## Monitoring

### Check Logs
Monitor the Render logs for roll call activity:
```
📋 Roll call started for user @username in chat -1001234567890
✅ Roll call passed for user 123456789 in chat -1001234567890
🚪 Kicked inactive member: @username from chat -1001234567890
```

### Check Stats
Use the `/rollcallstats` command in your group to see:
- Total roll calls sent
- How many passed
- How many were kicked
- How many are pending

## Troubleshooting

### "No inactive members found"
This means everyone has been active in the last 7 days. Good problem to have!

### Members not getting kicked
1. Check bot has "Ban users" permission
2. Check Render logs for errors
3. Verify bot is an admin in the group

### Roll calls not starting automatically
1. Verify `MAIN_CHAT_ID` is set in Render environment variables
2. Check the Render logs for the activation message
3. Make sure there are inactive members (7+ days)

## Git Commands

To deploy these changes:

```bash
# Check what files changed
git status

# Add all changes
git add .

# Commit with a message
git commit -m "Add roll call system for member activity tracking"

# Push to your repository
git push origin main
```

Render will automatically detect the push and redeploy!

## Next Steps

1. ✅ Code is ready (you're done!)
2. 📝 Add `MAIN_CHAT_ID` to Render environment variables
3. 🚀 Push code to repository
4. ⏰ Wait for Render to redeploy
5. 📊 Test with `/rollcall` command
6. 🎉 Watch it work automatically!

---

**Questions?** Check the detailed documentation in [ROLL_CALL.md](ROLL_CALL.md)
