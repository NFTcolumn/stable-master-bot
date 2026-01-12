# Roll Call System - Updated Behavior

## 🎯 How It Works Now

The roll call system has been updated to be **much more comprehensive** - it now checks **ALL members** systematically, not just inactive ones.

### ⏰ Timing
- **Every 10 minutes**, the bot picks the next member who needs to be checked
- Goes through members **in order** (by user ID)
- **24 hours** to respond or get kicked

### 📋 Who Gets Checked

The system prioritizes members in this order:

1. **Never checked in** - Members who have never responded to a roll call (highest priority)
2. **Oldest check-in** - Members who haven't checked in for the longest time
3. **In order** - Then goes through remaining members by user ID

### ✅ How Members Pass

To stay in the group, members must:
- React with ❤️ to the roll call message
- OR like the @Ponygatchi_bot post

Within **24 hours** of being called.

### 🚪 What Happens If They Don't Respond

- After 24 hours, they're automatically kicked from the group
- They can rejoin later when they're ready to be active
- The bot sends a notification when someone is removed

## 📊 Example Timeline

**10:00 AM** - User A gets roll call  
**10:10 AM** - User B gets roll call  
**10:20 AM** - User C gets roll call  
**10:30 AM** - User D gets roll call  
...and so on every 10 minutes

**Next day 10:00 AM** - If User A didn't respond, they get kicked

## 🔄 Continuous Cycle

Once all members have been checked:
- The system starts over from the beginning
- Members who passed their last roll call get checked again
- This ensures everyone stays active long-term

## 💡 Key Differences from Before

| Before | Now |
|--------|-----|
| Only checked inactive members (7+ days) | Checks ALL members systematically |
| Random selection | Goes through members in order |
| Every hour | Every 10 minutes |
| Might miss some members | Everyone gets checked eventually |

## 🎮 Commands

### `/rollcall` (Admin only)
Manually trigger a roll call for the next member in line.

### `/rollcallstats` (Admin only)
View statistics:
- Total roll calls sent
- How many passed
- How many were kicked
- How many are pending

## 🚀 Deployment

The updated system is already pushed to GitHub. When Render redeploys:

1. Make sure `MAIN_CHAT_ID` is set in environment variables
2. The bot will start checking members every 10 minutes
3. Watch the logs for: `📅 Scheduled roll calls activated for chat -1001234567890 (every 10 minutes)`

## 📝 Notes

- **First run**: Members who have never been checked will be called first
- **Active members**: Even active members get checked to ensure they're still engaged
- **Fair system**: Everyone gets the same 24-hour window to respond
- **Automatic**: No manual intervention needed once configured

---

This ensures your community stays **highly engaged** and **active**! 🐎
