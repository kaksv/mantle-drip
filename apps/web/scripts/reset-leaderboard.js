const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function resetLeaderboard() {
  try {
    console.log('🗑️  Deleting all UserStats records...');
    const deleted = await prisma.userStats.deleteMany({});
    console.log(`   Deleted ${deleted.count} UserStats records`);
    
    console.log('🔄 Resetting IndexerState for mainnet (id=2)...');
    // First event in proxy contract was at block 53003427 (confirmed from CeloScan)
    const STARTING_BLOCK = 53003427n;
    await prisma.indexerState.upsert({
      where: { id: 2 },
      create: { id: 2, lastProcessedBlock: STARTING_BLOCK - 1n }, // Set to block before first event
      update: { lastProcessedBlock: STARTING_BLOCK - 1n },
    });
    console.log(`✅ Leaderboard reset complete!`);
    console.log(`   Starting block set to: ${STARTING_BLOCK.toString()}`);
    console.log('   You can now start syncing from the first event.');
  } catch (error) {
    console.error('❌ Error resetting leaderboard:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

resetLeaderboard();

