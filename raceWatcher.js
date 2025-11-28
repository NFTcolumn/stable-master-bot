const { ethers } = require('ethers');

class RaceWatcher {
  constructor(bot, activeChatIds) {
    this.bot = bot;
    this.activeChatIds = activeChatIds; // Set of chat IDs to announce to

    // Base Mainnet configuration
    this.GAME_CONTRACT = '0x2B4652Bd6149E407E3F57190E25cdBa1FC9d37d8';
    this.BASE_RPC = 'https://mainnet.base.org';

    // Contract ABI for RaceExecuted event
    this.GAME_ABI = [
      "event RaceExecuted(uint256 indexed raceId, address indexed player, uint256 horseId, uint256 betAmount, bool won, uint256[3] winners, uint256 payout)"
    ];

    this.provider = null;
    this.gameContract = null;
    this.isWatching = false;
    this.pollInterval = null;
    this.lastCheckedBlock = null;
    this.POLL_INTERVAL_MS = 15 * 60 * 1000; // 15 minutes in milliseconds
  }

  async start() {
    try {
      console.log('🏁 Starting race watcher on Base Mainnet (polling every 15 minutes)...');

      // Connect to Base network via HTTP (more reliable than WebSocket for polling)
      this.provider = new ethers.JsonRpcProvider(this.BASE_RPC);

      // Create contract instance
      this.gameContract = new ethers.Contract(
        this.GAME_CONTRACT,
        this.GAME_ABI,
        this.provider
      );

      // Get current block to start watching from
      this.lastCheckedBlock = await this.provider.getBlockNumber();
      console.log(`📍 Starting from block ${this.lastCheckedBlock}`);

      // Start polling loop
      this.isWatching = true;
      this.pollForRaces(); // Check immediately
      this.pollInterval = setInterval(() => this.pollForRaces(), this.POLL_INTERVAL_MS);

      console.log('✅ Race watcher active! Checking every 15 minutes...');

    } catch (error) {
      console.error('❌ Error starting race watcher:', error.message);
      // Retry connection after 5 minutes
      setTimeout(() => this.start(), 5 * 60 * 1000);
    }
  }

  async pollForRaces() {
    try {
      const latestBlock = await this.provider.getBlockNumber();

      // Query for RaceExecuted events since last check
      const events = await this.gameContract.queryFilter(
        'RaceExecuted',
        this.lastCheckedBlock + 1,
        latestBlock
      );

      console.log(`🔍 Checked blocks ${this.lastCheckedBlock + 1} to ${latestBlock}: Found ${events.length} races`);

      // Announce each race found
      for (const event of events) {
        const { raceId, player, horseId, betAmount, won, winners, payout } = event.args;

        await this.announceRace({
          raceId: raceId.toString(),
          player: player,
          horseId: horseId.toString(),
          betAmount: betAmount.toString(),
          won: won,
          winners: winners.map(w => w.toString()),
          payout: payout.toString(),
          txHash: event.transactionHash
        });

        // Small delay between announcements to avoid spam
        if (events.length > 1) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }

      // Update last checked block
      this.lastCheckedBlock = latestBlock;

    } catch (error) {
      console.error('❌ Error polling for races:', error.message);
      // Continue polling despite errors
    }
  }

  async announceRace(raceData) {
    try {
      const announcement = this.formatAnnouncement(raceData);

      // Send to all active chats
      for (const chatId of this.activeChatIds) {
        try {
          await this.bot.sendMessage(chatId, announcement, {
            parse_mode: 'Markdown',
            disable_web_page_preview: true
          });
        } catch (error) {
          console.error(`Error sending to chat ${chatId}:`, error.message);
        }
      }

      console.log(`🏁 Announced race #${raceData.raceId}`);

    } catch (error) {
      console.error('Error announcing race:', error);
    }
  }

  formatAnnouncement(race) {
    const { raceId, player, horseId, betAmount, won, winners, payout, txHash } = race;

    // Format bet amount (convert from wei)
    const betBillions = (BigInt(betAmount) / BigInt(10**27)).toString();
    const payoutBillions = won ? (BigInt(payout) / BigInt(10**27)).toString() : '0';

    // Shorten player address
    const shortPlayer = `${player.slice(0, 6)}...${player.slice(-4)}`;

    // Determine multiplier
    let multiplier = '';
    let emoji = '';
    if (won) {
      if (winners[0] === horseId) {
        multiplier = '10x';
        emoji = '🏆🎉';
      } else if (winners[1] === horseId) {
        multiplier = '2.5x';
        emoji = '🥈✨';
      } else if (winners[2] === horseId) {
        multiplier = '1x';
        emoji = '🥉';
      }
    } else {
      emoji = '🐎';
    }

    // Build announcement
    if (won) {
      return `🏁 **RACE #${raceId} COMPLETE!** ${emoji}

🐎 Horse #${horseId} ${multiplier === '10x' ? 'WON' : multiplier === '2.5x' ? 'placed 2nd' : 'placed 3rd'}!
👤 Player: \`${shortPlayer}\`
💰 Bet: ${betBillions}B PONY
🎉 **Won: ${payoutBillions}B PONY (${multiplier})!**
🎟️ +1 Lottery Ticket

🏆 Winners: #${winners[0]} | #${winners[1]} | #${winners[2]}

[View on Basescan](https://basescan.org/tx/${txHash})`;
    } else {
      return `🏁 **Race #${raceId}** ${emoji}

🐎 Horse #${horseId} didn't place
👤 Player: \`${shortPlayer}\`
💰 Bet: ${betBillions}B PONY
🎟️ +1 Lottery Ticket (better luck next time!)

🏆 Winners: #${winners[0]} | #${winners[1]} | #${winners[2]}

[View on Basescan](https://basescan.org/tx/${txHash})`;
    }
  }

  stop() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
    this.isWatching = false;
    console.log('🛑 Race watcher stopped');
  }

  getStatus() {
    return {
      isWatching: this.isWatching,
      contract: this.GAME_CONTRACT,
      network: 'Base Mainnet',
      announcingTo: this.activeChatIds.size
    };
  }
}

module.exports = RaceWatcher;
