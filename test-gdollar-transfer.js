#!/usr/bin/env node
// Test if the G$ token transfer function works
const tokenAddress = '0x66f653611e7b7aD22657c0F228CEE477050f0196';
const fromAddress = '0xfAaB5005f7844eC5499cF258F52dE29EDc74aa31'; // DripCore contract
const toAddress = '0x7818ced1298849b47a9b56066b5adc72cddaf733'; // User address
const rpcUrl = 'https://forno.celo-sepolia.celo-testnet.org';

// Check balance of DripCore contract
const BALANCE_OF = '0x70a08231';
const paddedFrom = fromAddress.slice(2).toLowerCase().padStart(64, '0');
const balanceData = BALANCE_OF + paddedFrom;

console.log('Checking DripCore contract balance...');
fetch(rpcUrl, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    jsonrpc: '2.0',
    method: 'eth_call',
    params: [{ to: tokenAddress, data: balanceData }, 'latest'],
    id: 1,
  }),
})
.then(r => r.json())
.then(result => {
  const balance = BigInt(result.result || '0x0');
  console.log(`DripCore balance: ${(Number(balance) / 1e18).toFixed(2)} G$`);
  
  // Check if token has a transfer function that returns bool
  // ERC20 transfer signature: transfer(address,uint256) = 0xa9059cbb
  console.log('\nToken contract should support standard ERC20 transfer(address,uint256)');
  console.log('MockERC20 transfer function should return bool');
  
  if (balance === 0n) {
    console.log('\n❌ ERROR: DripCore has 0 balance - cannot transfer!');
  } else {
    console.log('\n✅ DripCore has balance. Transfer should work.');
    console.log('The issue might be in how the transfer is being called.');
  }
})
.catch(e => console.error('Error:', e.message));
