const { createPublicClient, http } = require('viem');
const { celo } = require('viem/chains');

// Contract address
const CONTRACT_ADDRESS = '0x5530975fDe062FE6706298fF3945E3d1a17A310a';
const USER_ADDRESS = '0x7818ced1298849b47a9b56066b5adc72cddaf733';

// Stream IDs and their start times from previous query
const STREAMS = [
  { id: 2, startTime: 1733346982 }, // 2025-12-04T21:16:22.000Z
  { id: 3, startTime: 1733347680 }, // 2025-12-04T21:28:00.000Z
  { id: 6, startTime: 1733351406 }, // 2025-12-04T22:30:06.000Z
  { id: 7, startTime: 1733353355 }, // 2025-12-04T23:02:35.000Z
  { id: 8, startTime: 1733360736 }, // 2025-12-05T01:05:36.000Z
  { id: 9, startTime: 1733361601 }, // 2025-12-05T01:20:01.000Z
  { id: 10, startTime: 1733409279 }, // 2025-12-05T14:54:39.000Z
  { id: 11, startTime: 1733409538 }, // 2025-12-05T14:58:58.000Z
  { id: 12, startTime: 1733409742 }, // 2025-12-05T15:02:22.000Z
];

async function findCreationBlocks() {
  try {
    const client = createPublicClient({
      chain: celo,
      transport: http('https://rpc.ankr.com/celo'),
    });

    console.log(`Finding creation blocks for streams created by: ${USER_ADDRESS}`);
    console.log(`Contract address: ${CONTRACT_ADDRESS}`);
    console.log('');

    const results = [];

    for (const stream of STREAMS) {
      try {
        // Get block at the timestamp (or closest)
        // Celo has ~5 second block time, so we'll search around the timestamp
        const timestamp = BigInt(stream.startTime);
        
        // Search for blocks around this timestamp (± 1 hour = 720 blocks)
        // StreamCreated event should be in a block close to startTime
        const searchFromBlock = timestamp; // We'll use a different approach
        
        // Actually, let's search for StreamCreated events with this streamId
        // The event has streamId as first indexed parameter
        const streamIdHex = '0x' + BigInt(stream.id).toString(16).padStart(64, '0');
        
        // Search in a range around the startTime
        // Estimate: Celo block time is ~5 seconds, so 1 hour = ~720 blocks
        // We'll search from startTime - 1 hour to startTime + 10 minutes
        const currentBlock = await client.getBlockNumber();
        const blockAtTime = await client.getBlock({ blockNumber: currentBlock });
        const blockTime = Number(blockAtTime.timestamp);
        const blocksPerSecond = 0.2; // ~5 seconds per block
        const secondsDiff = blockTime - stream.startTime;
        const estimatedBlock = currentBlock - BigInt(Math.floor(secondsDiff * blocksPerSecond));
        
        // Search range: ± 100 blocks around estimated block
        const fromBlock = estimatedBlock > 100n ? estimatedBlock - 100n : 0n;
        const toBlock = estimatedBlock + 100n;

        console.log(`Stream ${stream.id} (startTime: ${new Date(stream.startTime * 1000).toISOString()}):`);
        console.log(`  Estimated block: ${estimatedBlock.toString()}`);
        console.log(`  Searching blocks ${fromBlock.toString()} to ${toBlock.toString()}`);

        // Search for StreamCreated events with this streamId in the first topic
        const logs = await client.getLogs({
          address: CONTRACT_ADDRESS,
          fromBlock,
          toBlock,
          event: {
            type: 'event',
            name: 'StreamCreated',
            inputs: [
              { indexed: true, name: 'streamId', type: 'uint256' },
              { indexed: true, name: 'sender', type: 'address' },
              { indexed: false, name: 'recipients', type: 'address[]' },
              { indexed: false, name: 'token', type: 'address' },
              { indexed: false, name: 'deposit', type: 'uint256' },
              { indexed: false, name: 'startTime', type: 'uint256' },
              { indexed: false, name: 'endTime', type: 'uint256' },
              { indexed: false, name: 'title', type: 'string' },
              { indexed: false, name: 'description', type: 'string' },
            ],
          },
          args: {
            streamId: BigInt(stream.id),
          },
        });

        if (logs.length > 0) {
          console.log(`  ✅ Found StreamCreated event at block ${logs[0].blockNumber}`);
          results.push({
            streamId: stream.id,
            blockNumber: Number(logs[0].blockNumber),
            found: true,
          });
        } else {
          console.log(`  ❌ No StreamCreated event found in range`);
          results.push({
            streamId: stream.id,
            estimatedBlock: estimatedBlock.toString(),
            found: false,
          });
        }
        console.log('');
      } catch (error) {
        console.error(`Error searching for stream ${stream.id}:`, error.message);
        results.push({
          streamId: stream.id,
          error: error.message,
        });
      }
    }

    console.log('\n📊 Summary:');
    const found = results.filter(r => r.found).length;
    const missing = results.filter(r => !r.found).length;
    console.log(`Found: ${found} StreamCreated events`);
    console.log(`Missing: ${missing} StreamCreated events`);
    console.log('');
    console.log('Found events:');
    results.filter(r => r.found).forEach(r => {
      console.log(`  Stream ${r.streamId}: Block ${r.blockNumber}`);
    });
    if (missing > 0) {
      console.log('');
      console.log('Missing events (estimated blocks):');
      results.filter(r => !r.found && r.estimatedBlock).forEach(r => {
        console.log(`  Stream ${r.streamId}: Estimated block ${r.estimatedBlock}`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

findCreationBlocks();

