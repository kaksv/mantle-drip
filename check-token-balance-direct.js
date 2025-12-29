#!/usr/bin/env node
const address = '0x7818ced1298849b47a9b56066b5adc72cddaf733';
const rpcUrl = 'https://forno.celo-sepolia.celo-testnet.org';

// Try both possible cUSD addresses
const possibleCUSD = [
  '0xEF4d55D6dE8e8d73232827Cd1e9b2F2dBb45bC80', // Current config
  '0xdE9e4C3ce781b4bA68120d6261cbad65ce0aB00b', // Old address from user-balance.tsx
];

const BALANCE_OF = '0x70a08231'; // balanceOf(address)

async function checkBalance(tokenAddress) {
  const paddedAddress = address.slice(2).toLowerCase().padStart(64, '0');
  const data = BALANCE_OF + paddedAddress;
  
  try {
    const response = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_call',
        params: [{ to: tokenAddress, data }, 'latest'],
        id: 1,
      }),
    });
    
    const result = await response.json();
    if (result.error) return null;
    
    const balance = BigInt(result.result || '0x0');
    return balance;
  } catch (e) {
    return null;
  }
}

async function main() {
  console.log(`Checking cUSD balance for ${address} on Sepolia:\n`);
  
  for (const token of possibleCUSD) {
    const balance = await checkBalance(token);
    if (balance !== null) {
      const formatted = (Number(balance) / 1e18).toFixed(4);
      console.log(`${token}: ${formatted} cUSD (${balance.toString()})`);
    } else {
      console.log(`${token}: Error checking`);
    }
  }
}

main();
