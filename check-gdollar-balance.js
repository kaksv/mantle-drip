#!/usr/bin/env node
const address = '0x7818ced1298849b47a9b56066b5adc72cddaf733';
const tokenAddress = '0x66f653611e7b7aD22657c0F228CEE477050f0196';
const rpcUrl = 'https://forno.celo-sepolia.celo-testnet.org';

const BALANCE_OF = '0x70a08231';
const paddedAddress = address.slice(2).toLowerCase().padStart(64, '0');
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
  console.log(`\n✅ G$ Balance for ${address}:`);
  console.log(`   ${formatted} G$`);
  console.log(`   Raw: ${balance.toString()}\n`);
})
.catch(e => console.error('Error:', e.message));
