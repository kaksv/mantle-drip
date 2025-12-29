const { createPublicClient, http, decodeEventLog } = require('viem');
const { celo } = require('viem/chains');

// Contract address
const CONTRACT_ADDRESS = '0x5530975fDe062FE6706298fF3945E3d1a17A310a';
const USER_ADDRESS = '0x7818ced1298849b47a9b56066b5adc72cddaf733';

// StreamCreated event ABI
const STREAM_CREATED_ABI = [
  {
    anonymous: false,
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
    name: 'StreamCreated',
    type: 'event',
  },
];

async function findStreamsBySender() {
  try {
    const client = createPublicClient({
      chain: celo,
      transport: http('https://rpc.ankr.com/celo'),
    });

    console.log(`Searching for StreamCreated events from: ${USER_ADDRESS}`);
    console.log(`Contract address: ${CONTRACT_ADDRESS}`);
    console.log('');

    // Search from block 53003427 (first event) to current
    const fromBlock = 53003427n;
    const currentBlock = await client.getBlockNumber();
    console.log(`Searching from block ${fromBlock.toString()} to ${currentBlock.toString()}`);
    console.log('');

    // Search in chunks of 1000 blocks to avoid RPC limits
    const CHUNK_SIZE = 1000n;
    const allEvents = [];
    let processed = 0n;

    for (let start = fromBlock; start <= currentBlock; start += CHUNK_SIZE) {
      const end = start + CHUNK_SIZE > currentBlock ? currentBlock : start + CHUNK_SIZE;
      
      try {
        console.log(`Searching blocks ${start.toString()} to ${end.toString()}...`);
        
        // Search for all StreamCreated events (no sender filter - we'll filter after)
        const logs = await client.getLogs({
          address: CONTRACT_ADDRESS,
          fromBlock: start,
          toBlock: end,
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
        });

        console.log(`  Found ${logs.length} StreamCreated events in this range`);

        for (const log of logs) {
          try {
            const decoded = decodeEventLog({
              abi: STREAM_CREATED_ABI,
              data: log.data,
              topics: log.topics,
            });

            const sender = decoded.args.sender.toLowerCase();
            
            // Only include events from our target address
            if (sender === USER_ADDRESS.toLowerCase()) {
              allEvents.push({
                streamId: Number(decoded.args.streamId),
                blockNumber: Number(log.blockNumber),
                sender: sender,
                title: decoded.args.title || '(no title)',
              });

              console.log(`    Stream ID ${decoded.args.streamId} at block ${log.blockNumber} - "${decoded.args.title || '(no title)'}"`);
            }
          } catch (error) {
            console.error(`    Error decoding log: ${error.message}`);
          }
        }

        processed += (end - start);
      } catch (error) {
        if (error.message?.includes('too large')) {
          // Try smaller chunks
          const smallerChunk = 1000n;
          for (let s = start; s < end; s += smallerChunk) {
            const e = s + smallerChunk > end ? end : s + smallerChunk;
            try {
              const logs = await client.getLogs({
                address: CONTRACT_ADDRESS,
                fromBlock: s,
                toBlock: e,
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
              });

              for (const log of logs) {
                try {
                  const decoded = decodeEventLog({
                    abi: STREAM_CREATED_ABI,
                    data: log.data,
                    topics: log.topics,
                  });

                  const sender = decoded.args.sender.toLowerCase();
                  
                  // Only include events from our target address
                  if (sender === USER_ADDRESS.toLowerCase()) {
                    allEvents.push({
                      streamId: Number(decoded.args.streamId),
                      blockNumber: Number(log.blockNumber),
                      sender: sender,
                      title: decoded.args.title || '(no title)',
                    });
                  }
                } catch (err) {
                  // Skip decode errors
                }
              }
            } catch (err) {
              console.error(`    Error in smaller chunk ${s}-${e}: ${err.message}`);
            }
          }
        } else {
          console.error(`  Error: ${error.message}`);
        }
      }
    }

    console.log('');
    console.log('📊 Summary:');
    console.log(`Total StreamCreated events found: ${allEvents.length}`);
    console.log('');
    
    if (allEvents.length > 0) {
      console.log('Found events:');
      allEvents.sort((a, b) => a.streamId - b.streamId);
      allEvents.forEach(e => {
        console.log(`  Stream ID ${e.streamId}: Block ${e.blockNumber} - "${e.title}"`);
      });
    }

    // Expected stream IDs: 1, 2, 3, 6, 7, 8, 9, 10, 11, 12
    const expectedIds = [1, 2, 3, 6, 7, 8, 9, 10, 11, 12];
    const foundIds = allEvents.map(e => e.streamId);
    const missingIds = expectedIds.filter(id => !foundIds.includes(id));

    console.log('');
    console.log(`Expected: ${expectedIds.length} streams`);
    console.log(`Found: ${foundIds.length} streams`);
    console.log(`Missing: ${missingIds.length} streams`);
    
    if (missingIds.length > 0) {
      console.log('');
      console.log('Missing stream IDs:', missingIds.join(', '));
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

findStreamsBySender();

