const mongoose = require('mongoose');

async function run() {
  await mongoose.connect('mongodb://localhost:27017/farmdirect');
  const db = mongoose.connection.db;

  console.log('Finding users to keep...');
  const users = await db.collection('users').find({}).toArray();
  
  const keepUserIds = [];
  users.forEach(u => {
    if (u.role === 'admin' || (u.name && u.name.toLowerCase().includes('ramesh'))) {
      keepUserIds.push(u._id);
    }
  });

  const deleteUserIds = users.filter(u => !keepUserIds.some(k => k.equals(u._id))).map(u => u._id);
  
  console.log(`Found ${deleteUserIds.length} users to delete.`);
  
  if (deleteUserIds.length > 0) {
    // Delete users
    const userRes = await db.collection('users').deleteMany({ _id: { $in: deleteUserIds } });
    console.log(`Deleted ${userRes.deletedCount} users.`);

    // Delete farmer profiles
    const farmerRes = await db.collection('farmerprofiles').deleteMany({ userId: { $in: deleteUserIds } });
    console.log(`Deleted ${farmerRes.deletedCount} farmer profiles.`);

    // Delete products associated with deleted farmers
    const productRes = await db.collection('products').deleteMany({ farmerId: { $in: deleteUserIds } });
    console.log(`Deleted ${productRes.deletedCount} products.`);

    // Delete orders associated with deleted customers
    const orderRes = await db.collection('orders').deleteMany({ customerId: { $in: deleteUserIds } });
    console.log(`Deleted ${orderRes.deletedCount} orders.`);
    
    // Delete carts associated with deleted customers
    const cartRes = await db.collection('carts').deleteMany({ user: { $in: deleteUserIds } });
    console.log(`Deleted ${cartRes.deletedCount} carts.`);

    // Delete reviews by deleted customers
    const reviewRes = await db.collection('reviews').deleteMany({ user: { $in: deleteUserIds } });
    console.log(`Deleted ${reviewRes.deletedCount} reviews.`);

    // Delete payments by deleted customers
    const paymentRes = await db.collection('payments').deleteMany({ customerId: { $in: deleteUserIds } });
    console.log(`Deleted ${paymentRes.deletedCount} payments.`);
  } else {
    console.log('No users to delete.');
  }

  console.log('Done!');
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
