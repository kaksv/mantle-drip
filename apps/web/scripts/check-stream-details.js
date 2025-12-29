const { createPublicClient, http } = require('viem');
const { celo } = require('viem/chains');

// Contract address
const CONTRACT_ADDRESS = '0x5530975fDe062FE6706298fF3945E3d1a17A310a';
const USER_ADDRESS = '0x7818ced1298849b47a9b56066b5adc72cddaf733';

// Stream IDs from the contract query
const STREAM_IDS = [1, 2, 3, 6, 7, 8, 9, 10, 11, 12];

// Minimal ABI for getStream
const ABI = [
  {
    inputs: [{ internalType: 'uint256', name: 'streamId', type: 'uint256' }],
    name: 'getStream',
    outputs: [
      {
        components: [
          { internalType: 'uint256', name: 'streamId', type: 'uint256' },
          { internalType: 'address', name: 'sender', type: 'address' },
          { internalType: 'address[]', name: 'recipients', type: 'address[]' },
          { internalType: 'address', name: 'token', type: 'address' },
          { internalType: 'uint256', name: 'deposit', type: 'uint256' },
          { internalType: 'uint256', name: 'startTime', type: 'uint256' },
          { internalType: 'uint256', name: 'endTime', type: 'uint256' },
          { internalType: 'uint8', name: 'status', type: 'uint8' },
          { internalType: 'string', name: 'title', type: 'string' },
          { internalType: 'string', name: 'description', type: 'string' },
        ],
        internalType: 'struct IDrip.Stream',
        name: 'stream',
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getBlockNumber',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
];

async function checkStreamDetails() {
  try {
    const client = createPublicClient({
      chain: celo,
      transport: http('https://rpc.ankr.com/celo'),
    });

    console.log(`Checking details for ${STREAM_IDS.length} streams created by: ${USER_ADDRESS}`);
    console.log(`Contract address: ${CONTRACT_ADDRESS}`);
    console.log('');

    // Get current block number
    const currentBlock = await client.getBlockNumber();
    console.log(`Current block: ${currentBlock.toString()}`);
    console.log('');

    const streamDetails = [];

    for (const streamId of STREAM_IDS) {
      try {
        const stream = await client.readContract({
          address: CONTRACT_ADDRESS,
          abi: ABI,
          functionName: 'getStream',
          args: [BigInt(streamId)],
        });

        streamDetails.push({
          streamId,
          sender: stream.sender.toLowerCase(),
          startTime: stream.startTime.toString(),
          endTime: stream.endTime.toString(),
          status: stream.status,
          title: stream.title || '(no title)',
          deposit: stream.deposit.toString(),
        });

        console.log(`Stream ID ${streamId}:`);
        console.log(`  Title: ${stream.title || '(no title)'}`);
        console.log(`  Sender: ${stream.sender.toLowerCase()}`);
        console.log(`  Start Time: ${new Date(Number(stream.startTime) * 1000).toISOString()}`);
        console.log(`  Status: ${stream.status} (0=Pending, 1=Active, 2=Paused, 3=Cancelled, 4=Completed)`);
        console.log('');
      } catch (error) {
        console.error(`Error fetching stream ${streamId}:`, error.message);
      }
    }

    console.log('\n📊 Summary:');
    console.log(`Total streams checked: ${streamDetails.length}`);
    console.log(`All streams from ${USER_ADDRESS}: ${streamDetails.every(s => s.sender === USER_ADDRESS.toLowerCase()) ? 'Yes' : 'No'}`);
    console.log('');

    // Now we need to find the block where each stream was created
    // We can estimate based on startTime, but better to search for the StreamCreated event
    console.log('To find the creation blocks, we need to search for StreamCreated events.');
    console.log('The startTime can help us estimate which block range to search:');
    streamDetails.forEach(s => {
      const startDate = new Date(Number(s.startTime) * 1000);
      console.log(`  Stream ${s.streamId}: Start time ${startDate.toISOString()}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkStreamDetails();

