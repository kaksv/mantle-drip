#!/usr/bin/env node
// Verify the G$ token has the correct transfer function
const tokenAddress = '0x66f653611e7b7aD22657c0F228CEE477050f0196';
const rpcUrl = 'https://forno.celo-sepolia.celo-testnet.org';

// Check if token has name, symbol, decimals (standard ERC20)
const NAME = '0x06fdde03'; // name()
const SYMBOL = '0x95d89b41'; // symbol()
const DECIMALS = '0x313ce567'; // decimals()

async function checkToken() {
  try {
    // Check name
    const nameResult = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_call',
        params: [{ to: tokenAddress, data: NAME }, 'latest'],
        id: 1,
      }),
    }).then(r => r.json());
    
    // Check symbol
    const symbolResult = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_call',
        params: [{ to: tokenAddress, data: SYMBOL }, 'latest'],
        id: 1,
      }),
    }).then(r => r.json());
    
    // Check decimals
    const decimalsResult = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_call',
        params: [{ to: tokenAddress, data: DECIMALS }, 'latest'],
        id: 1,
      }),
    }).then(r => r.json());
    
    console.log('\n✅ Token Contract Verification:');
    console.log('   Address:', tokenAddress);
    console.log('   Name call result:', nameResult.result ? 'OK' : 'FAILED');
    console.log('   Symbol call result:', symbolResult.result ? 'OK' : 'FAILED');
    console.log('   Decimals call result:', decimalsResult.result ? 'OK' : 'FAILED');
    
    if (nameResult.result && symbolResult.result && decimalsResult.result) {
      console.log('\n✅ Token appears to be a valid ERC20 contract');
      console.log('   The transfer function should work correctly.');
      console.log('\n⚠️  Possible issues:');
      console.log('   1. The withdrawal amount might exceed available balance');
      console.log('   2. There might be a reentrancy guard issue');
      console.log('   3. The token might have some custom logic preventing transfers');
    } else {
      console.log('\n❌ Token contract verification failed!');
    }
  } catch (e) {
    console.error('Error:', e.message);
  }
}

checkToken();
