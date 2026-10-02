const mongoose = require('mongoose');

async function fixMissingProfiles() {
  await mongoose.connect('mongodb://localhost:27017/farmdirect');
  const db = mongoose.connection.db;

  const users = await db.collection('users').find({ role: 'farmer' }).toArray();
  console.log(`Found ${users.length} farmers in DB.`);

  let createdCount = 0;
  for (const user of users) {
    const profile = await db.collection('farmerprofiles').findOne({ userId: user._id });
    if (!profile) {
      console.log(`Farmer ${user.name} (${user._id}) is missing FarmerProfile. Creating one...`);
      await db.collection('farmerprofiles').insertOne({
        userId: user._id,
        verificationStatus: 'pending',
        farmName: user.name + "'s Farm",
        createdAt: new Date(),
        updatedAt: new Date()
      });
      createdCount++;
    }
  }

  console.log(`Created ${createdCount} missing farmer profiles.`);
  process.exit(0);
}

fixMissingProfiles().catch(console.error);
