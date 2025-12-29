const { createPublicClient, http, decodeFunctionData } = require('viem');
const { celo } = require('viem/chains');

// Transaction details from the failed transaction
const TX_HASH = '0x250db6f617d34dd00689e3b124adfc0a01cca45ef74615a776922513ee8533b3';
const CONTRACT_ADDRESS = '0x5530975fDe062FE6706298fF3945E3d1a17A310a';
const FROM_ADDRESS = '0x85A4b09fb0788f1C549a68dC2EdAe3F97aeb5Dd7';

// ABI for withdrawFromStream and related functions
const ABI = [
  {
    inputs: [
      { internalType: 'uint256', name: 'streamId', type: 'uint256' },
      { internalType: 'address', name: 'recipient', type: 'address' }
    ],
    name: 'withdrawFromStream',
    outputs: [{ internalType: 'uint256', name: 'withdrawn', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
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
    inputs: [
      { internalType: 'uint256', name: 'streamId', type: 'uint256' },
      { internalType: 'address', name: 'recipient', type: 'address' }
    ],
    name: 'getRecipientBalance',
    outputs: [{ internalType: 'uint256', name: 'balance', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'uint256', name: 'streamId', type: 'uint256' },
      { internalType: 'address', name: 'recipient', type: 'address' }
    ],
    name: 'getRecipientInfo',
    outputs: [
      {
        components: [
          { internalType: 'address', name: 'recipient', type: 'address' },
          { internalType: 'uint256', name: 'ratePerSecond', type: 'uint256' },
          { internalType: 'uint256', name: 'totalWithdrawn', type: 'uint256' },
          { internalType: 'uint256', name: 'lastWithdrawTime', type: 'uint256' },
          { internalType: 'uint256', name: 'currentAccrued', type: 'uint256' },
        ],
        internalType: 'struct IDrip.RecipientInfo',
        name: '',
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
];

async function debugWithdrawal() {
  try {
    const client = createPublicClient({
      chain: celo,
      transport: http('https://rpc.ankr.com/celo'),
    });

    console.log('🔍 Debugging Failed Withdrawal Transaction');
    console.log('='.repeat(60));
    console.log(`Transaction Hash: ${TX_HASH}`);
    console.log(`Contract Address: ${CONTRACT_ADDRESS}`);
    console.log(`From Address: ${FROM_ADDRESS}`);
    console.log('');

    // Get transaction details
    console.log('📋 Fetching transaction details...');
    const tx = await client.getTransaction({ hash: TX_HASH });
    
    if (!tx) {
      console.error('❌ Transaction not found');
      return;
    }

    console.log(`Block Number: ${tx.blockNumber}`);
    console.log(`Gas Limit: ${tx.gas.toString()}`);
    console.log(`Gas Price: ${tx.gasPrice?.toString() || 'N/A'}`);
    console.log('');

    // Get transaction receipt to check status
    console.log('📋 Fetching transaction receipt...');
    try {
      const receipt = await client.getTransactionReceipt({ hash: TX_HASH });
      console.log(`Status: ${receipt.status === 'success' ? '✅ Success' : '❌ Failed'}`);
      console.log(`Gas Used: ${receipt.gasUsed.toString()}`);
      if (receipt.status === 'reverted') {
        console.log('⚠️  Transaction was reverted');
      }
    } catch (error) {
      console.log(`Could not fetch receipt: ${error.message}`);
    }
    console.log('');

    // Decode the function call
    console.log('🔓 Decoding function call...');
    try {
      const decoded = decodeFunctionData({
        abi: ABI,
        data: tx.input,
      });

      console.log(`Function: ${decoded.functionName}`);
      const [streamId, recipient] = decoded.args;
      console.log(`Stream ID: ${streamId.toString()}`);
      console.log(`Recipient: ${recipient}`);
      console.log('');

      // Check stream details
      console.log('📊 Checking Stream Details...');
      const stream = await client.readContract({
        address: CONTRACT_ADDRESS,
        abi: ABI,
        functionName: 'getStream',
        args: [streamId],
      });

      console.log(`Stream ID: ${stream.streamId.toString()}`);
      console.log(`Title: ${stream.title || '(no title)'}`);
      console.log(`Sender: ${stream.sender}`);
      console.log(`Status: ${stream.status} (0=Pending, 1=Active, 2=Paused, 3=Cancelled, 4=Completed)`);
      console.log(`Token: ${stream.token}`);
      console.log(`Deposit: ${stream.deposit.toString()}`);
      console.log(`Start Time: ${new Date(Number(stream.startTime) * 1000).toISOString()}`);
      console.log(`End Time: ${new Date(Number(stream.endTime) * 1000).toISOString()}`);
      console.log(`Recipients: ${stream.recipients.length}`);
      stream.recipients.forEach((r, i) => {
        console.log(`  [${i}] ${r} ${r.toLowerCase() === recipient.toLowerCase() ? '← THIS RECIPIENT' : ''}`);
      });
      console.log('');

      // Check if recipient is in the list
      const isRecipient = stream.recipients.some(r => r.toLowerCase() === recipient.toLowerCase());
      console.log(`✅ Is recipient in stream: ${isRecipient ? 'YES' : 'NO ❌'}`);
      console.log(`✅ Is msg.sender == recipient: ${FROM_ADDRESS.toLowerCase() === recipient.toLowerCase() ? 'YES' : 'NO ❌'}`);
      console.log(`✅ Stream status allows withdrawal: ${[1, 2, 4].includes(Number(stream.status)) ? 'YES' : 'NO ❌'}`);
      console.log('');

      // Check recipient balance
      console.log('💰 Checking Recipient Balance...');
      try {
        const balance = await client.readContract({
          address: CONTRACT_ADDRESS,
          abi: ABI,
          functionName: 'getRecipientBalance',
          args: [streamId, recipient],
        });
        console.log(`Available Balance: ${balance.toString()}`);
        console.log(`Available Balance (formatted): ${(Number(balance) / 1e18).toFixed(6)} tokens`);
        console.log(`✅ Has balance > 0: ${balance > 0n ? 'YES' : 'NO ❌'}`);
      } catch (error) {
        console.error(`❌ Error getting balance: ${error.message}`);
      }
      console.log('');

      // Check recipient info
      console.log('📈 Checking Recipient Info...');
      try {
        const recipientInfo = await client.readContract({
          address: CONTRACT_ADDRESS,
          abi: ABI,
          functionName: 'getRecipientInfo',
          args: [streamId, recipient],
        });
        console.log(`Rate Per Second: ${recipientInfo.ratePerSecond.toString()}`);
        console.log(`Total Withdrawn: ${recipientInfo.totalWithdrawn.toString()}`);
        console.log(`Last Withdraw Time: ${recipientInfo.lastWithdrawTime.toString()} (${recipientInfo.lastWithdrawTime > 0n ? new Date(Number(recipientInfo.lastWithdrawTime) * 1000).toISOString() : 'Never'})`);
        console.log(`Current Accrued: ${recipientInfo.currentAccrued.toString()}`);
      } catch (error) {
        console.error(`❌ Error getting recipient info: ${error.message}`);
      }
      console.log('');

      // Check contract balance for the token at the EXACT block where transaction failed
      console.log('🏦 Checking Contract Balance at Transaction Block...');
      const txBlockNumber = tx.blockNumber;
      console.log(`Transaction Block: ${txBlockNumber}`);
      
      // Get contract balance at the block where transaction was attempted
      try {
        let contractBalance;
        if (stream.token === '0x0000000000000000000000000000000000000000') {
          // Native CELO
          const balance = await client.getBalance({
            address: CONTRACT_ADDRESS,
            blockNumber: txBlockNumber,
          });
          contractBalance = balance;
          console.log(`Contract Native CELO Balance at block ${txBlockNumber}: ${contractBalance.toString()}`);
          console.log(`Contract Native CELO Balance (formatted): ${(Number(contractBalance) / 1e18).toFixed(6)} CELO`);
        } else {
          // ERC20 token
          const balance = await client.readContract({
            address: stream.token,
            abi: [{ inputs: [{ name: 'account', type: 'address' }], name: 'balanceOf', outputs: [{ name: '', type: 'uint256' }], stateMutability: 'view', type: 'function' }],
            functionName: 'balanceOf',
            args: [CONTRACT_ADDRESS],
            blockNumber: txBlockNumber,
          });
          contractBalance = balance;
          console.log(`Contract Token Balance at block ${txBlockNumber}: ${contractBalance.toString()}`);
          console.log(`Contract Token Balance (formatted): ${(Number(contractBalance) / 1e18).toFixed(6)} tokens`);
        }
        
        // Check recipient balance at the EXACT block
        const recipientBalanceAtBlock = await client.readContract({
          address: CONTRACT_ADDRESS,
          abi: ABI,
          functionName: 'getRecipientBalance',
          args: [streamId, recipient],
          blockNumber: txBlockNumber,
        });
        
        console.log(`Recipient Available Balance at block ${txBlockNumber}: ${recipientBalanceAtBlock.toString()}`);
        console.log(`Recipient Available Balance (formatted): ${(Number(recipientBalanceAtBlock) / 1e18).toFixed(6)} tokens`);
        console.log(`✅ Contract has sufficient balance: ${contractBalance >= recipientBalanceAtBlock ? 'YES' : 'NO ❌'}`);
        if (contractBalance < recipientBalanceAtBlock) {
          console.log(`⚠️  INSUFFICIENT CONTRACT BALANCE!`);
          console.log(`   Contract has: ${contractBalance.toString()}`);
          console.log(`   Recipient needs: ${recipientBalanceAtBlock.toString()}`);
          console.log(`   Shortfall: ${(recipientBalanceAtBlock - contractBalance).toString()}`);
        }
        
        // Also check current state for comparison
        console.log('');
        console.log('📊 Current State (for comparison):');
        const currentBlock = await client.getBlockNumber();
        const currentContractBalance = stream.token === '0x0000000000000000000000000000000000000000'
          ? await client.getBalance({ address: CONTRACT_ADDRESS })
          : await client.readContract({
              address: stream.token,
              abi: [{ inputs: [{ name: 'account', type: 'address' }], name: 'balanceOf', outputs: [{ name: '', type: 'uint256' }], stateMutability: 'view', type: 'function' }],
              functionName: 'balanceOf',
              args: [CONTRACT_ADDRESS],
            });
        const currentRecipientBalance = await client.readContract({
          address: CONTRACT_ADDRESS,
          abi: ABI,
          functionName: 'getRecipientBalance',
          args: [streamId, recipient],
        });
        console.log(`Current Block: ${currentBlock}`);
        console.log(`Current Contract Balance: ${currentContractBalance.toString()}`);
        console.log(`Current Recipient Balance: ${currentRecipientBalance.toString()}`);
      } catch (error) {
        console.error(`❌ Error checking contract balance: ${error.message}`);
      }
      console.log('');

      // Summary of potential issues
      console.log('🔍 DIAGNOSIS SUMMARY:');
      console.log('='.repeat(60));
      
      const issues = [];
      if (!isRecipient) {
        issues.push('❌ Address is not a recipient of this stream');
      }
      if (FROM_ADDRESS.toLowerCase() !== recipient.toLowerCase()) {
        issues.push('❌ msg.sender does not match recipient address');
      }
      if (![1, 2, 4].includes(Number(stream.status))) {
        issues.push(`❌ Stream status (${stream.status}) does not allow withdrawals (must be Active=1, Paused=2, or Completed=4)`);
      }
      
      const balance = await client.readContract({
        address: CONTRACT_ADDRESS,
        abi: ABI,
        functionName: 'getRecipientBalance',
        args: [streamId, recipient],
      });
      
      if (balance === 0n) {
        issues.push('❌ Recipient has no available balance to withdraw');
      }
      
      if (issues.length === 0) {
        console.log('✅ All checks passed. The issue might be:');
        console.log('   - Insufficient contract balance (check above)');
        console.log('   - Token transfer failure (ERC20 token issue)');
        console.log('   - Reentrancy guard (unlikely)');
      } else {
        issues.forEach(issue => console.log(issue));
      }

    } catch (error) {
      console.error('❌ Error decoding transaction:', error.message);
      console.log('Raw input:', tx.input);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

debugWithdrawal();

