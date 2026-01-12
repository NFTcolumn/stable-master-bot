# Play Pixel Pony WITHOUT a Website! 🎮

**You can play the game directly through Basescan - no website needed!**

This guide shows you how to interact with the contracts directly and place bets.

---

## 🎯 Quick Start

1. Get PONY tokens (buy from DEX)
2. Get some ETH on Base (for gas + entry fee)
3. Go to Basescan
4. Approve PONY
5. Place your bet!

---

## 📝 Step-by-Step Guide

### Step 1: Get Your Tokens

**Buy PONY on Base DEX:**
- Go to Uniswap: https://app.uniswap.org
- Connect your wallet (MetaMask, Coinbase Wallet, etc.)
- Switch to **Base network**
- Swap ETH → PONY
- Token address: `0x6ab297799335E7b0f60d9e05439Df156cf694Ba7`

**You'll also need:**
- Some ETH for gas (~$0.50 per transaction)
- 0.0005 ETH for race entry fee (~$1.50)

---

### Step 2: Approve PONY Tokens

Before betting, you need to approve the game contract to spend your PONY.

**Go to Token Contract on Basescan:**
https://basescan.org/address/0x6ab297799335E7b0f60d9e05439Df156cf694Ba7#writeContract

**Steps:**
1. Click **"Connect to Web3"** (connect your wallet)
2. Scroll to **"approve"** function
3. Fill in:
   - **spender (address):** `0x2B4652Bd6149E407E3F57190E25cdBa1FC9d37d8` (game contract)
   - **amount (uint256):** Amount you want to bet (in wei)

**Amount Examples:**
- 1B PONY = `1000000000000000000000000000` (1 + 27 zeros)
- 5B PONY = `5000000000000000000000000000` (5 + 27 zeros)
- 10B PONY = `10000000000000000000000000000` (10 + 27 zeros)
- 50B PONY = `50000000000000000000000000000` (50 + 27 zeros - MAX BET)

**Pro Tip:** Approve a large amount once (like 1T PONY) so you don't have to approve every time.

4. Click **"Write"**
5. Confirm transaction in your wallet
6. Wait for confirmation ✅

---

### Step 3: Place Your Bet!

**Go to Game Contract on Basescan:**
https://basescan.org/address/0x2B4652Bd6149E407E3F57190E25cdBa1FC9d37d8#writeContract

**Steps:**
1. Make sure you're still connected (should show your address)
2. Scroll to **"placeBetAndRace"** function
3. Fill in:
   - **payableAmount (ether):** `0.0005` (this is the ETH entry fee)
   - **_horseId (uint256):** Pick a horse (0-15)
   - **_amount (uint256):** Your bet amount in wei

**Example Bet:**
```
payableAmount: 0.0005
_horseId: 7
_amount: 5000000000000000000000000000
```
This bets 5 Billion PONY on horse #7.

**Horse Selection Tips:**
- Horses numbered 0-15 (16 total)
- All horses have equal chance
- Pick your lucky number!

4. Click **"Write"**
5. Confirm transaction in wallet
6. Wait for confirmation...
7. **Check the result!**

---

### Step 4: Check Your Race Results

**Method 1: Transaction Receipt**

After transaction confirms:
1. Click on the transaction hash
2. Scroll to **"Logs"** section
3. Look for **"RaceExecuted"** event
4. You'll see:
   - **won:** true/false (did you win?)
   - **winners:** [horse1, horse2, horse3] (top 3 finishers)
   - **payout:** Amount you won (in wei)

**Method 2: Read Contract**

Go to: https://basescan.org/address/0x2B4652Bd6149E407E3F57190E25cdBa1FC9d37d8#readContract

Find **"races"** function:
- Input your race ID (starts at 1, increments each race)
- Click **"Query"**
- See full race details

**Method 3: Check Events**

Go to: https://basescan.org/address/0x2B4652Bd6149E407E3F57190E25cdBa1FC9d37d8#events

- Filter by **"RaceExecuted"**
- See all recent races
- Find yours by your address

---

## 💰 Payouts

If you win, PONY is **automatically sent to your wallet!**

**Payout Structure:**
- **1st Place:** 10x your bet
- **2nd Place:** 2.5x your bet
- **3rd Place:** 1x your bet (break even)
- **Other:** Lose bet (goes to jackpot)

**Check Your Balance:**
1. Go to token contract: https://basescan.org/address/0x6ab297799335E7b0f60d9e05439Df156cf694Ba7#readContract
2. Use **"balanceOf"** function
3. Input your address
4. See your PONY balance

---

## 🎟️ Lottery Tickets

**Every race gives you a FREE lottery ticket!**

**Check Your Tickets:**
1. Go to game contract: https://basescan.org/address/0x2B4652Bd6149E407E3F57190E25cdBa1FC9d37d8#readContract
2. Use **"getUserTickets"** function
3. Input your address
4. Get array of your ticket IDs

**Check Current Jackpot Numbers:**
1. Same contract, **"getCurrentJackpotNumbers"** function
2. See the 4 winning numbers (1-50)

**Check If You Won:**
1. Use **"lotteryTickets"** function
2. Input your ticket ID
3. Compare your numbers to jackpot numbers
4. If all 4 match → YOU WON THE JACKPOT! 🎉

**Claim Jackpot:**
1. Go to Write Contract
2. Use **"checkJackpot"** function
3. Input array of your ticket IDs: `[1, 2, 3]`
4. If you win, jackpot is automatically sent!

---

## 🔍 Useful Read Functions

**Check Game Stats:**
https://basescan.org/address/0x2B4652Bd6149E407E3F57190E25cdBa1FC9d37d8#readContract

**Functions to explore:**
- **getGameStats:** See total races, jackpot pool, player count
- **getUserRaces:** See all your race IDs
- **getUserTickets:** See all your lottery tickets
- **getJackpotPool:** Current jackpot amount
- **baseFeeAmount:** Current ETH entry fee
- **getAllPlayersCount:** Total unique players

---

## 📊 Understanding Wei (Token Amounts)

PONY token has 18 decimals. Here's a conversion guide:

| Human Readable | Wei (what you input) |
|---------------|---------------------|
| 1 PONY | 1000000000000000000 (1 + 18 zeros) |
| 1,000 PONY | 1000000000000000000000 (1 + 21 zeros) |
| 1 Million PONY | 1000000000000000000000000 (1 + 24 zeros) |
| 1 Billion PONY | 1000000000000000000000000000 (1 + 27 zeros) |
| 1 Trillion PONY | 1000000000000000000000000000000 (1 + 30 zeros) |

**Easy Calculation:**
- Take your amount (e.g., 5 billion)
- Add 18 zeros
- Result: 5000000000000000000000000000

**Online Converter:**
https://eth-converter.com/
(Works for any 18-decimal token)

---

## 🎮 Example: Complete Bet Flow

Let's bet 10 Billion PONY on Horse #3!

### 1. Approve Tokens
```
Contract: 0x6ab297799335E7b0f60d9e05439Df156cf694Ba7 (Token)
Function: approve
Inputs:
  - spender: 0x2B4652Bd6149E407E3F57190E25cdBa1FC9d37d8
  - amount: 10000000000000000000000000000
Click "Write" → Confirm → Wait ✅
```

### 2. Place Bet
```
Contract: 0x2B4652Bd6149E407E3F57190E25cdBa1FC9d37d8 (Game)
Function: placeBetAndRace
Inputs:
  - payableAmount: 0.0005 ETH
  - _horseId: 3
  - _amount: 10000000000000000000000000000
Click "Write" → Confirm → Wait ✅
```

### 3. Check Results
```
Go to transaction → Logs tab
Find "RaceExecuted" event:
  - won: true (YOU WON!)
  - winners: [3, 7, 12] (horse 3 won!)
  - payout: 100000000000000000000000000000 (100B PONY!)
Check your wallet: +100B PONY received! 🎉
```

---

## ⚡ Pro Tips

### Tip 1: Batch Approve
Approve a large amount once (like 100B or 1T PONY) so you can place multiple bets without approving each time.

### Tip 2: Check Events
The Events tab shows all recent activity. Great for seeing:
- Recent winners
- Jackpot wins
- Popular bet sizes

### Tip 3: Multiple Small Bets
Instead of one 50B bet, do ten 5B bets for more chances to win!

### Tip 4: Save Links
Bookmark the Write Contract pages for quick access:
- Token: https://basescan.org/address/0x6ab297799335E7b0f60d9e05439Df156cf694Ba7#writeContract
- Game: https://basescan.org/address/0x2B4652Bd6149E407E3F57190E25cdBa1FC9d37d8#writeContract

### Tip 5: Mobile Friendly
Works great on mobile with MetaMask mobile browser or Coinbase Wallet app!

---

## 🚨 Important Notes

### Gas Costs
- Approve: ~50k gas (~$0.10 on Base)
- Place bet: ~600-800k gas (~$1-2 on Base)
- Very cheap compared to Ethereum mainnet!

### Entry Fee
- 0.0005 ETH per race (~$1.50 at current prices)
- Goes 50/50 to dev/marketing wallets
- Keep some ETH in wallet for this!

### Bet Limits
- **Min bet:** No minimum! Can bet even 1 PONY
- **Max bet:** 50,000,000,000 PONY (50 Billion)

### Safety
- Only interact with official contracts on Basescan
- Always verify contract addresses
- Token: `0x6ab297799335E7b0f60d9e05439Df156cf694Ba7`
- Game: `0x2B4652Bd6149E407E3F57190E25cdBa1FC9d37d8`

---

## 🆘 Troubleshooting

**"Insufficient ETH fee"**
- Make sure you input 0.0005 (or more) in payableAmount
- Check you have enough ETH for gas + entry fee

**"Token transfer failed"**
- Did you approve enough PONY?
- Check your PONY balance
- Try approving again

**"Invalid horse ID"**
- Horse IDs are 0-15 (not 1-16!)
- Try a number between 0 and 15

**"Transaction failed"**
- Increase gas limit in wallet
- Check you have enough ETH for gas
- Verify all inputs are correct

**Can't see transaction result?**
- Click on transaction hash
- Go to "Logs" tab
- Look for "RaceExecuted" event

---

## 🎯 Quick Reference Card

**Contract Addresses:**
```
PONY Token: 0x6ab297799335E7b0f60d9e05439Df156cf694Ba7
Pixel Pony Game: 0x2B4652Bd6149E407E3F57190E25cdBa1FC9d37d8
```

**Bet Amount Conversions:**
```
1B PONY = 1000000000000000000000000000
5B PONY = 5000000000000000000000000000
10B PONY = 10000000000000000000000000000
50B PONY = 50000000000000000000000000000
```

**Steps to Bet:**
```
1. Approve PONY (token contract)
2. Place bet (game contract, 0.0005 ETH)
3. Check logs for results
4. Collect winnings (automatic!)
```

**Payouts:**
```
1st: 10x | 2nd: 2.5x | 3rd: 1x (break even)
```

---

## 🎉 You're Ready!

No website needed - you can now:
- ✅ Buy PONY tokens
- ✅ Approve spending
- ✅ Place bets
- ✅ Check results
- ✅ Track lottery tickets
- ✅ Play anytime!

**Enjoy racing! 🏇**

---

*For more info, see the full whitepaper at WHITEPAPER_V1.md*
*Smart contracts are open source and verified on Basescan*
