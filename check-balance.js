#!/usr/bin/env node

/**
 * Script to check cUSD balance for an address using direct RPC calls
 * Usage: node check-balance.js <address> [network]
 * Example: node check-balance.js 0x7818ced1298849b47a9b56066b5adc72cddaf733 sepolia
 */

// Token addresses
const TOKEN_ADDRESSES = {
  mainnet: {
    cUSD: '0x765DE816845861e75A25fCA122bb6898B8B1282a',
    rpcUrl: 'https://forno.celo.org',
  },
  sepolia: {
    cUSD: '0xdE9e4C3ce781b4bA68120d6261cbad65ce0aB00b',
    rpcUrl: 'https://forno.celo-sepolia.celo-testnet.org',
  },
  alfajores: {
    cUSD: '0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1',
    rpcUrl: 'https://alfajores-forno.celo-testnet.org',
  },
};

// ERC20 balanceOf function selector: balanceOf(address)
const BALANCE_OF_SELECTOR = '0x70a08231';

function formatUnits(value, decimals = 18) {
  const divisor = BigInt(10 ** decimals);
  const quotient = value / divisor;
  const remainder = value % divisor;
  
  if (remainder === 0n) {
    return quotient.toString();
  }
  
  const remainderStr = remainder.toString().padStart(decimals, '0');
  const trimmed = remainderStr.replace(/0+$/, '');
  return `${quotient}.${trimmed}`;
}

async function checkBalance(address, network = 'sepolia') {
  const config = TOKEN_ADDRESSES[network.toLowerCase()];
  if (!config) {
    console.error(`Unknown network: ${network}. Use: mainnet, sepolia, or alfajores`);
    process.exit(1);
  }

  const tokenAddress = config.cUSD;
  const rpcUrl = config.rpcUrl;

  try {
    console.log(`\nChecking cUSD balance for: ${address}`);
    console.log(`Network: ${network}`);
    console.log(`cUSD Token: ${tokenAddress}`);
    console.log(`RPC: ${rpcUrl}\n`);

    // Encode the function call: balanceOf(address)
    // Pad address to 32 bytes (64 hex chars)
    const paddedAddress = address.slice(2).toLowerCase().padStart(64, '0');
    const data = BALANCE_OF_SELECTOR + paddedAddress;

    // Make RPC call
    const response = await fetch(rpcUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_call',
        params: [
          {
            to: tokenAddress,
            data: data,
          },
          'latest',
        ],
        id: 1,
      }),
    });

    const result = await response.json();

    if (result.error) {
      throw new Error(result.error.message || 'RPC error');
    }

    const balanceHex = result.result;
    if (!balanceHex || balanceHex === '0x') {
      console.log('Balance: 0 cUSD');
      return { balance: 0n, formattedBalance: '0' };
    }

    const balance = BigInt(balanceHex);
    const formattedBalance = formatUnits(balance, 18);

    console.log(`Balance: ${formattedBalance} cUSD`);
    console.log(`Raw balance: ${balance.toString()}\n`);

    return { balance, formattedBalance };
  } catch (error) {
    console.error('Error checking balance:', error.message);
    process.exit(1);
  }
}

// Get address from command line
const address = process.argv[2];
const network = process.argv[3] || 'sepolia';

if (!address) {
  console.error('Usage: node check-balance.js <address> [network]');
  console.error('Example: node check-balance.js 0x7818ced1298849b47a9b56066b5adc72cddaf733 sepolia');
  process.exit(1);
}

// Validate address format
if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
  console.error('Invalid address format. Must be a valid Ethereum address (0x...)');
  process.exit(1);
}

checkBalance(address, network).catch(console.error);

