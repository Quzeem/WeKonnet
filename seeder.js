const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const colors = require('colors');
const dotenv = require('dotenv');
const Organization = require('./models/Organization');
const Member = require('./models/Member');

// Load env vars
dotenv.config({ path: 'config/config.env' });

// Read data
const members = JSON.parse(
  fs.readFileSync(path.join(__dirname, '_data', 'members.json'), 'utf-8')
);
const organizations = JSON.parse(
  fs.readFileSync(path.join(__dirname, '_data', 'organizations.json'), 'utf-8')
);

// Connect to DB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true,
  useFindAndModify: false,
});

// Import Data
const importData = async () => {
  try {
    await Member.create(members);
    await Organization.create(organizations);
    console.log('Data Imported'.green.inverse);
    process.exit();
  } catch (err) {
    console.error(err);
  }
};

// Delete Data
const DeleteData = async () => {
  try {
    await Member.deleteMany();
    await Organization.deleteMany();
    console.log('Data Deleted'.red.inverse);
    process.exit();
  } catch (err) {
    console.error(err);
  }
};

// Run specific command
if (process.argv[2] === '-i') {
  importData();
} else if (process.argv[2] === '-d') {
  DeleteData();
}
