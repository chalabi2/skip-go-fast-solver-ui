import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

async function migrateData() {
  // Source (local) database
  const sourceDb = new PrismaClient({
    datasourceUrl: process.env.DATABASE_URL
  });

  // Target (production) database
  const targetDb = new PrismaClient({
    datasourceUrl: process.env.PROD_DATABASE_URL
  });

  try {
    // Migrate settlements
    const settlements = await sourceDb.settlement.findMany();
    console.log(`Found ${settlements.length} settlements to migrate`);
    
    for (const settlement of settlements) {
      await targetDb.settlement.upsert({
        where: {
          orderId_chainId: {
            orderId: settlement.orderId,
            chainId: settlement.chainId
          }
        },
        update: settlement,
        create: settlement
      });
    }

    // Migrate chainSync data
    const chainSyncs = await sourceDb.chainSync.findMany();
    console.log(`Found ${chainSyncs.length} chain syncs to migrate`);
    
    for (const sync of chainSyncs) {
      await targetDb.chainSync.upsert({
        where: {
          chainId: sync.chainId
        },
        update: sync,
        create: sync
      });
    }

    // Migrate gasTracking data
    const gasTrackings = await sourceDb.gasTracking.findMany();
    console.log(`Found ${gasTrackings.length} gas tracking records to migrate`);
    
    for (const gas of gasTrackings) {
      await targetDb.gasTracking.upsert({
        where: {
          chainId: gas.chainId
        },
        update: gas,
        create: gas
      });
    }

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;  // Re-throw to see the full error
  } finally {
    await sourceDb.$disconnect();
    await targetDb.$disconnect();
  }
}

migrateData(); 