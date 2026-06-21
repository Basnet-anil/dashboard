require('dotenv').config();
const mongoose = require('mongoose');

const checkDB = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI not found in env');
    process.exit(1);
  }
  
  try {
    await mongoose.connect(uri);
    console.log('Connected to MongoDB');
    
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(`Found ${collections.length} collections:`);
    
    for (let col of collections) {
      const count = await mongoose.connection.db.collection(col.name).countDocuments();
      console.log(` - ${col.name}: ${count} document(s)`);
      
      if (count > 0) {
        const samples = await mongoose.connection.db.collection(col.name).find().limit(2).toArray();
        console.log(`    Sample:`, JSON.stringify(samples, null, 2));
      }
    }
    
    await mongoose.disconnect();
  } catch (err) {
    console.error('Error:', err);
  }
};

checkDB();
