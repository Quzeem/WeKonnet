const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

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
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    timestamps: true,
  }
);

// Hash password
OrganizationSchema.pre('save', async function (next) {
  const organization = this;
  if (organization.isModified('password')) {
    const salt = await bcrypt.genSalt(10);
    organization.password = await bcrypt.hash(organization.password, salt);
  }
  next();
});

// Return signed JWT token
OrganizationSchema.methods.getSignedJwtToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES,
  });
};

// Cascade delete members of an organization removed from DB
OrganizationSchema.pre('remove', async function (next) {
  const organization = this;
  await organization
    .model('Member')
    .deleteMany({ organization: organization._id });
  next();
});

// Reverse populate with virtuals
OrganizationSchema.virtual('members', {
  ref: 'Member',
  localField: '_id',
  foreignField: 'organization',
  justOne: false,
});

module.exports = mongoose.model('Organization', OrganizationSchema);
