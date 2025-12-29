const { createPublicClient, http, decodeFunctionResult } = require('viem');
const { celo } = require('viem/chains');

// Contract address and ABI
const CONTRACT_ADDRESS = '0x5530975fDe062FE6706298fF3945E3d1a17A310a';
const USER_ADDRESS = '0x7818ced1298849b47a9b56066b5adc72cddaf733';

// Minimal ABI for getSenderStreams (returns just stream IDs)
const ABI = [
  {
    inputs: [{ internalType: 'address', name: 'sender', type: 'address' }],
    name: 'getSenderStreams',
    outputs: [{ internalType: 'uint256[]', name: 'streamIds', type: 'uint256[]' }],
    stateMutability: 'view',
    type: 'function',
  },
];

async function checkUserStreams() {
  try {
    const client = createPublicClient({
      chain: celo,
      transport: http('https://rpc.ankr.com/celo'),
    });

    console.log(`Checking streams for address: ${USER_ADDRESS}`);
    console.log(`Contract address: ${CONTRACT_ADDRESS}`);
    console.log('');

    const streamIds = await client.readContract({
      address: CONTRACT_ADDRESS,
      abi: ABI,
      functionName: 'getSenderStreams',
      args: [USER_ADDRESS],
    });

    console.log(`✅ Found ${streamIds.length} streams created by this address`);
    console.log('');

    if (streamIds.length > 0) {
      console.log('Stream IDs:');
      streamIds.forEach((streamId, index) => {
        console.log(`  ${index + 1}. Stream ID: ${streamId.toString()}`);
      });
    }

    console.log(`\n📊 Summary: ${streamIds.length} total streams created`);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkUserStreams();

