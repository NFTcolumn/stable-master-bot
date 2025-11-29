// Test script for moderation patterns
// This tests the regex patterns without needing a live bot

// Import the patterns from moderation.js structure
const dmScamPatterns = [
  /(?:send|dm|message|contact|text)\s+(?:me|us)/gi,
  /reach\s+out\s+(?:to\s+)?(?:me|us)/gi,
  /dm\s+(?:me|us|for)/gi,
  /message\s+(?:me|us|for)/gi,
  /send\s+(?:me|us)\s+(?:a\s+)?(?:dm|message|text)/gi,
  /(?:first|next)\s+\d+\s+(?:people|users|members)\s+(?:to\s+)?(?:dm|message|contact)/gi,
];

const solPattern = /\b(?:sol|solana)\b/gi;

// Test cases
const testCases = [
  // DM scam tests
  { text: "The first 10 people to message me will receive my SOL", shouldMatch: 'dm_scam' },
  { text: "DM me for more info", shouldMatch: 'dm_scam' },
  { text: "Send me a DM if interested", shouldMatch: 'dm_scam' },
  { text: "contact me for details", shouldMatch: 'dm_scam' },
  { text: "reach out to me", shouldMatch: 'dm_scam' },
  { text: "text me for the link", shouldMatch: 'dm_scam' },

  // SOL mention tests
  { text: "I have some SOL to give away", shouldMatch: 'sol' },
  { text: "Anyone want my Solana?", shouldMatch: 'sol' },
  { text: "Check out this SOL token", shouldMatch: 'sol' },
  { text: "Solana is better than Base", shouldMatch: 'sol' },

  // Should NOT match
  { text: "This is about our PONY token", shouldMatch: 'none' },
  { text: "Check out the game at pxpony.com", shouldMatch: 'none' },
  { text: "I'm excited about Base Mainnet", shouldMatch: 'none' },
];

console.log('Testing moderation patterns...\n');

let passed = 0;
let failed = 0;

testCases.forEach((testCase, index) => {
  const isDmScam = dmScamPatterns.some(pattern => {
    pattern.lastIndex = 0; // Reset regex state
    return pattern.test(testCase.text);
  });

  solPattern.lastIndex = 0; // Reset regex state
  const isSolMention = solPattern.test(testCase.text);

  let detected = 'none';
  if (isDmScam) detected = 'dm_scam';
  else if (isSolMention) detected = 'sol';

  const testPassed = detected === testCase.shouldMatch;

  if (testPassed) {
    console.log(`✅ Test ${index + 1}: PASSED`);
    passed++;
  } else {
    console.log(`❌ Test ${index + 1}: FAILED`);
    console.log(`   Text: "${testCase.text}"`);
    console.log(`   Expected: ${testCase.shouldMatch}, Got: ${detected}`);
    failed++;
  }
});

console.log(`\n📊 Results: ${passed} passed, ${failed} failed out of ${testCases.length} tests`);

if (failed === 0) {
  console.log('\n🎉 All tests passed!');
  process.exit(0);
} else {
  console.log('\n⚠️  Some tests failed!');
  process.exit(1);
}
