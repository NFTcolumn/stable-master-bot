// Enhanced logging for roll call system
// Add these console.log statements at key points:

// 1. When starting scheduled check:
console.log(`\n🔄 [ROLL CALL] Starting scheduled check for chat ${chatId}...`);

// 2. When finding next member:
console.log(`📋 [ROLL CALL] Found next member: ${nextMember.username || nextMember.first_name || nextMember.user_id}`);
console.log(`   └─ User ID: ${nextMember.user_id}`);
console.log(`   └─ Last activity: ${nextMember.last_activity}`);
console.log(`   └─ Last roll call response: ${nextMember.last_roll_call_response || 'Never'}`);

// 3. After creating event:
console.log(`   └─ Created roll call event ID: ${eventId}`);

// 4. After sending message:
console.log(`   └─ Sent roll call message ID: ${sentMessage.message_id}`);
console.log(`✅ [ROLL CALL] Roll call started successfully`);
console.log(`   └─ Member has 24 hours to respond`);

// 5. When all members checked:
console.log(`✅ [ROLL CALL] All members have been checked in chat ${chatId}`);
console.log(`   └─ No pending roll calls needed`);

// 6. When checking expired:
console.log(`\n⏰ [ROLL CALL] Checking for expired roll calls...`);

// 7. After kicking:
console.log(`🚪 [ROLL CALL] Kicked ${kickedCount} inactive member(s)`);

// 8. When no expired found:
console.log(`✅ [ROLL CALL] No expired roll calls found`);

// 9. Before next check:
console.log(`\n⏱️  [ROLL CALL] Next check in 10 minutes...\n`);

// 10. On error:
console.error('❌ [ROLL CALL] Error in scheduled roll call check:', error);
console.error('   └─ Error details:', error.message);

// 11. When tracking activity:
console.log(`👤 [ACTIVITY] Tracked message from user ${userId} in chat ${chatId}`);

// 12. When handling reaction:
console.log(`❤️  [REACTION] User ${userId} reacted to message ${messageId}`);
console.log(`✅ [ROLL CALL] Roll call passed for user ${userId} in chat ${chatId}`);
