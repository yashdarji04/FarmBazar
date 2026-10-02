const mongoose = require('mongoose');

async function fixMissingOwnerName() {
  await mongoose.connect('mongodb://localhost:27017/farmdirect');
  const db = mongoose.connection.db;

  const profiles = await db.collection('farmerprofiles').find({ ownerName: { $exists: false } }).toArray();
  console.log(`Found ${profiles.length} profiles missing ownerName.`);

  let updatedCount = 0;
  for (const profile of profiles) {
    const user = await db.collection('users').findOne({ _id: profile.userId });
    if (user) {
      await db.collection('farmerprofiles').updateOne(
        { _id: profile._id },
        { $set: { ownerName: user.name } }
      );
      updatedCount++;
    }
  }

  console.log(`Updated ${updatedCount} profiles.`);
  process.exit(0);
}

fixMissingOwnerName().catch(console.error);
