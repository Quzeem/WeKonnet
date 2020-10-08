const crypto = require('crypto');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const MemberSchema = new mongoose.Schema(
  {
    firstname: {
      type: String,
      match: [/^[a-zA-Z][a-zA-Z\s]*$/, 'Name can only contain alphabets'],
      trim: true,
      required: [true, 'Please add a firstname'],
    },
    lastname: {
      type: String,
      match: [/^[a-zA-Z][a-zA-Z\s]*$/, 'Name can only contain alphabets'],
      trim: true,
      required: [true, 'Please add a lastname'],
    },
    email: {
      type: String,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please add a valid email',
      ],
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      match: [
        /^\+[1-9]\d{1,14}$/,
        'Please provide phone number in E.164 format starting with a ‘+’',
      ],
      required: [true, 'Please add a phone number'],
      maxlength: [15, 'Phone number can not be longer than 15 characters'],
      unique: true,
    },
    professionalSkills: {
      type: String,
      trim: true,
      maxlength: [100, 'Description can not be more than 100 characters'],
    },
    gender: {
      type: String,
      lowercase: true,
      enum: ['male', 'female', 'prefer not to say'],
    },
    photo: {
      type: String,
      default:
        'https://res.cloudinary.com/zeemag/image/upload/v1601946625/konnet/no-avatar_a5icj4.png',
    },
    photoId: String,
    stateOfOrigin: String,
    location: {
      address: String,
      state: String,
      city: String,
      country: String,
    },
    role: {
      type: String,
      default: 'member',
    },
    password: {
      type: String,
      trim: true,
      minlength: [6, 'Password must be atleast six characters'],
      validate(value) {
        if (value.toLowerCase().includes('password')) {
          throw new Error('Password cannot contain "password"');
        }
      },
      // select: false,
    },
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    organizations: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        required: true,
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Delete some fiels from data to return to the client
MemberSchema.methods.toJSON = function () {
  const member = this;
  const memberObject = member.toObject();

  delete memberObject.password;
  delete memberObject.createdAt;
  delete memberObject.updatedAt;

  return memberObject;
};

// Hash text plain password
MemberSchema.pre('save', async function (next) {
  const member = this;
  if (member.isModified('password')) {
    const salt = await bcrypt.genSalt(10);
    member.password = await bcrypt.hash(member.password, salt);
  }
  next();
});

// Password Verification
MemberSchema.methods.verifyPassword = async function (enteredPassword) {
  const member = this;
  const verify = await bcrypt.compare(enteredPassword, member.password);
  return verify;
};

// Return signed JWT token
MemberSchema.methods.getAuthToken = async function () {
  const member = this;
  const token = jwt.sign(
    { _id: member._id.toString(), role: this.role },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES,
    }
  );
  return token;
};

// Generate and hash password reset token
MemberSchema.methods.getResetPasswordToken = function () {
  const member = this;

  // Generate token
  const resetToken = crypto.randomBytes(20).toString('hex');

  // Hash the resetToken and set it to resetPasswordToken field
  member.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // Set when the token will expire (10mins)
  member.resetPasswordExpires = Date.now() + 10 * 60 * 1000;

  // return original reset token
  return resetToken;
};

module.exports = mongoose.model('Member', MemberSchema);
