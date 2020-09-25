const mongoose = require('mongoose');

const OrganizationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      match: [/^[a-zA-Z][a-zA-Z\s]*$/, 'Please add a valid name'],
      trim: true,
      unique: true,
      required: [true, 'Please add a name'],
      maxlength: [50, 'Name can not be nore than 50 characters'],
    },
    username: {
      type: String,
      match: [/^[a-z][a-z]+\d*$|^[a-z]\d\d+$/i, 'Please a valid username'],
      required: [true, 'Please add a username'],
      unique: true,
      trim: true,
      minlength: [2, 'Username must be atleast two characters'],
    },
    email: {
      type: String,
      required: [true, 'Please add an email'],
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please add a valid email',
      ],
      trim: true,
      lowercase: true,
      unique: true,
    },
    address: {
      type: String,
      required: [true, 'Please add an address'],
    },
    phone: {
      type: String,
      maxlength: [20, 'Phone number can not be longer than 20 characters'],
    },
    photo: {
      type: String,
      default: 'no-photo.jpg',
    },
    role: {
      type: String,
      default: 'organization',
    },
    password: {
      type: String,
      required: [true, 'Please add a password'],
      trim: true,
      minlength: [6, 'Password must be atleast six characters'],
      validate(value) {
        if (value.toLowerCase().includes('password')) {
          throw new Error('Password cannot contain "password"');
        }
      },
      select: false,
    },
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Cascade delete members of an organization removed from DB
OrganizationSchema.pre('remove', async function (next) {
  await this.model('Member').deleteMany({ organization: this._id });
});

// Reverse populate with virtuals
OrganizationSchema.virtual('members', {
  ref: 'Member',
  localField: '_id',
  foreignField: 'organization',
  justOne: false,
});

module.exports = mongoose.model('Organization', OrganizationSchema);
