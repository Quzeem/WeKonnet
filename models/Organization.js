const crypto = require('crypto');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const OrganizationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      match: [
        /^[a-zA-Z][a-zA-Z\s]*$/,
        'Name can only contain alphabets and spaces',
      ],
      unique: true,
      trim: true,
      required: [true, 'Please add a name'],
      maxlength: [50, 'Name can not be nore than 50 characters'],
    },
    username: {
      type: String,
      match: [
        /^[a-z][a-z]+\d*$|^[a-z]\d\d+$/i,
        'Username can only be alpha-numeric characters and numbers in the username have to be at the end.',
      ],
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
    location: {
      address: {
        type: String,
        required: [true, 'Please add an address'],
      },
      state: {
        type: String,
        required: [true, 'Please add a state'],
      },
      city: {
        type: String,
        required: [true, 'Please add a city'],
      },
      country: {
        type: String,
        required: [true, 'Please add a country'],
      },
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

// Delete some fiels from data to return to the client
OrganizationSchema.methods.toJSON = function () {
  const organization = this;
  const organizationObject = organization.toObject();

  delete organizationObject.password;
  delete organizationObject.createdAt;
  delete organizationObject.updatedAt;
  delete organizationObject.id;

  return organizationObject;
};

// Hash text plain password
OrganizationSchema.pre('save', async function (next) {
  const organization = this;
  if (organization.isModified('password')) {
    const salt = await bcrypt.genSalt(10);
    organization.password = await bcrypt.hash(organization.password, salt);
  }
  next();
});

// Password Verification
OrganizationSchema.methods.verifyPassword = async function (enteredPassword) {
  const organization = this;
  const verify = await bcrypt.compare(enteredPassword, organization.password);
  return verify;
};

// Return signed JWT token
OrganizationSchema.methods.getAuthToken = async function () {
  const organization = this;
  const token = jwt.sign(
    { _id: organization._id.toString(), role: this.role },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES,
    }
  );
  return token;
};

// Generate and hash password reset token
OrganizationSchema.methods.getResetPasswordToken = function () {
  const organization = this;

  // Generate token
  const resetToken = crypto.randomBytes(20).toString('hex');

  // Hash the resetToken and set it to resetPasswordToken field
  organization.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // Set when the token will expire (10mins)
  organization.resetPasswordExpires = Date.now() + 10 * 60 * 1000;

  // return original reset token
  return resetToken;
};

// Cascade delete members of an organization removed from DB
OrganizationSchema.pre('remove', async function (next) {
  const organization = this;
  await organization
    .model('Member')
    .updateMany(
      { organizations: organization._id },
      { $pull: { organizations: organization._id } },
      { multi: true }
    );
  next();
});

// Reverse populate with virtuals
OrganizationSchema.virtual('members', {
  ref: 'Member',
  localField: '_id',
  foreignField: 'organizations',
  justOne: false,
});

module.exports = mongoose.model('Organization', OrganizationSchema);
