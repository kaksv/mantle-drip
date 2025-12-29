#!/usr/bin/env node
const contractAddress = '0xfAaB5005f7844eC5499cF258F52dE29EDc74aa31'; // DripCore contract
const tokenAddress = '0x66f653611e7b7aD22657c0F228CEE477050f0196'; // G$ token
const rpcUrl = 'https://forno.celo-sepolia.celo-testnet.org';

const BALANCE_OF = '0x70a08231';
const paddedAddress = contractAddress.slice(2).toLowerCase().padStart(64, '0');
const data = BALANCE_OF + paddedAddress;

fetch(rpcUrl, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    jsonrpc: '2.0',
    method: 'eth_call',
    params: [{ to: tokenAddress, data }, 'latest'],
    id: 1,
  }),
})
.then(r => r.json())
.then(result => {
  const balance = BigInt(result.result || '0x0');
  const formatted = (Number(balance) / 1e18).toLocaleString(undefined, { maximumFractionDigits: 2 });
  console.log(`\n✅ DripCore Contract G$ Balance:`);
  console.log(`   ${formatted} G$`);
  console.log(`   Raw: ${balance.toString()}\n`);
  if (balance === 0n) {
    console.log('⚠️  WARNING: Contract has 0 G$ balance! This is why withdrawals are failing.');
  }
})
.catch(e => console.error('Error:', e.message));
