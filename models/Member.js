const mongoose = require('mongoose');
const generator = require('generate-password');
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
      unique: true,
    },
    phone: {
      type: String,
      required: [true, 'Please add a phone number'],
      maxlength: [20, 'Phone number can not be longer than 20 characters'],
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
      default: 'no-photo.jpg',
    },
    stateOfOrigin: String,
    location: {
      address: String,
      state: String,
      city: String,
      country: String,
    },
    role: {
      type: String,
      enum: ['member', 'admin'],
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
      select: false,
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

MemberSchema.pre('save', function (next) {
  const member = this;
  if (!member.email) {
    member.email = `${member.firstname}${member.phone.slice(-4)}@domain.com`;
  }
  if (!member.password) {
    member.password = generator.generate({ length: 10, numbers: true });
  }
  next();
});

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
    { _id: member._id.toString() },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES,
    }
  );
  return token;
};

module.exports = mongoose.model('Member', MemberSchema);
