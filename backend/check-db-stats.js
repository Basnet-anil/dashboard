require('dotenv').config();
const mongoose = require('mongoose');

// Import all models
const Customer = require('./models/Customer');
const Sale = require('./models/Sale');
const Vendor = require('./models/Vendor');
const Purchase = require('./models/Purchase');
const HR = require('./models/HR');
const Bank = require('./models/Bank');
const Company = require('./models/Company');
const Staff = require('./models/Staff');
const Payroll = require('./models/Payroll');

const checkDatabaseStats = async () => {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      console.error('Missing MONGODB_URI in environment');
      process.exit(1);
    }

    await mongoose.connect(uri, { dbName: process.env.MONGODB_DB || undefined });
    console.log('Connected to MongoDB\n');

    // Get database stats
    const db = mongoose.connection.db;
    const dbStats = await db.stats();

    console.log('═══════════════════════════════════════════════════');
    console.log('           DATABASE STATISTICS');
    console.log('═══════════════════════════════════════════════════');
    console.log(`Database Name: ${db.databaseName}`);
    console.log(`Total Size: ${(dbStats.dataSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`Storage Size: ${(dbStats.storageSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`Index Size: ${(dbStats.indexSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`Number of Collections: ${dbStats.collections}`);
    console.log(`Number of Documents: ${dbStats.objects}`);
    console.log('───────────────────────────────────────────────────\n');

    // Get collection counts
    console.log('COLLECTION-WISE DATA COUNT:');
    console.log('═══════════════════════════════════════════════════');

    const collections = [
      { name: 'Customers', model: Customer },
      { name: 'Sales', model: Sale },
      { name: 'Vendors', model: Vendor },
      { name: 'Purchases', model: Purchase },
      { name: 'HR', model: HR },
      { name: 'Bank', model: Bank },
      { name: 'Company', model: Company },
      { name: 'Staff', model: Staff },
      { name: 'Payroll', model: Payroll }
    ];

    let totalDocuments = 0;
    for (const collection of collections) {
      const count = await collection.model.countDocuments();
      totalDocuments += count;
      console.log(`${collection.name.padEnd(20)} : ${count} records`);
    }

    console.log('───────────────────────────────────────────────────');
    console.log(`TOTAL DOCUMENTS       : ${totalDocuments} records`);
    console.log('═══════════════════════════════════════════════════\n');

    // Get sample data from each collection
    console.log('SAMPLE DATA PREVIEW:');
    console.log('═══════════════════════════════════════════════════');
    
    for (const collection of collections) {
      const count = await collection.model.countDocuments();
      if (count > 0) {
        const sample = await collection.model.findOne().lean();
        console.log(`\n${collection.name}:`);
        console.log(JSON.stringify(sample, null, 2).substring(0, 500) + '...');
      }
    }

    await mongoose.connection.close();
    console.log('\n\nDatabase connection closed.');
    process.exit(0);
  } catch (err) {
    console.error('Error checking database stats:', err);
    process.exit(1);
  }
};

checkDatabaseStats();
