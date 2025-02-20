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
    // Delete existing data in target database
    console.log('Deleting existing data in target database...');
    await targetDb.settlement.deleteMany({});
    await targetDb.chainSync.deleteMany({});
    await targetDb.gasTracking.deleteMany({});
    console.log('Existing data deleted successfully');

    // Migrate settlements
    const settlements = await sourceDb.settlement.findMany();
    console.log(`Found ${settlements.length} settlements to migrate`);
    
    for (const settlement of settlements) {
      await targetDb.settlement.create({
        data: settlement
      });
    }

    // Migrate chainSync data
    const chainSyncs = await sourceDb.chainSync.findMany();
    console.log(`Found ${chainSyncs.length} chain syncs to migrate`);
    
    for (const sync of chainSyncs) {
      await targetDb.chainSync.create({
        data: sync
      });
    }

    // Migrate gasTracking data
    const gasTrackings = await sourceDb.gasTracking.findMany();
    console.log(`Found ${gasTrackings.length} gas tracking records to migrate`);
    
    for (const gas of gasTrackings) {
      await targetDb.gasTracking.create({
        data: gas
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