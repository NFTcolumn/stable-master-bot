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
  }

  async start() {
    try {
      console.log('🏁 Starting race watcher on Base Mainnet...');

      // Connect to Base network
      this.provider = new ethers.JsonRpcProvider(this.BASE_RPC);

      // Create contract instance
      this.gameContract = new ethers.Contract(
        this.GAME_CONTRACT,
        this.GAME_ABI,
        this.provider
      );

      // Listen for RaceExecuted events
      this.gameContract.on('RaceExecuted', async (raceId, player, horseId, betAmount, won, winners, payout, event) => {
        await this.announceRace({
          raceId: raceId.toString(),
          player: player,
          horseId: horseId.toString(),
          betAmount: betAmount.toString(),
          won: won,
          winners: winners.map(w => w.toString()),
          payout: payout.toString(),
          txHash: event.log.transactionHash
        });
      });

      this.isWatching = true;
      console.log('✅ Race watcher active! Monitoring for races...');

    } catch (error) {
      console.error('❌ Error starting race watcher:', error);
      // Retry connection after 30 seconds
      setTimeout(() => this.start(), 30000);
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
    if (this.gameContract) {
      this.gameContract.removeAllListeners('RaceExecuted');
      this.isWatching = false;
      console.log('🛑 Race watcher stopped');
    }
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
