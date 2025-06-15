const mongoose = require('mongoose');

const ownerSchema = new mongoose.Schema({
  username: String,
  password: String,
});

const Owner = mongoose.model('Owner', ownerSchema);

// Prefill logic
async function prefillOwner() {
  try {
    const existing = await Owner.findOne({ username: 'shyam20' });

    if (!existing) {
      await Owner.create({
        username: 'shyam20',
        password: 'jaishreeshyam'  // Plain password (not secure for prod)
      });
      console.log('Default owner created.');
    } else {
      console.log('Default owner already exists.');
    }
  } catch (err) {
    console.error('Error pre-filling owner:', err.message);
  }
}

// Automatically prefill when the file is imported
prefillOwner();

module.exports = Owner;