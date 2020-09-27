const mongoose = require('mongoose');
const generator = require('generate-password');
const bcrypt = require('bcryptjs');

const MemberSchema = new mongoose.Schema(
  {
    firstname: {
      type: String,
      match: [/^[a-zA-Z][a-zA-Z\s]*$/, 'Please add a valid firstname'],
      trim: true,
      required: [true, 'Please add a firstname'],
    },
    lastname: {
      type: String,
      match: [/^[a-zA-Z][a-zA-Z\s]*$/, 'Please add a valid lastname'],
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
    address: String,
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
    resetPasswordExpire: Date,
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

MemberSchema.pre('save', function (next) {
  if (!this.email) {
    this.email = `${this.firstname}${this.phone.slice(-4)}@domain.com`;
  }
  if (!this.password) {
    this.password = generator.generate({ length: 10, numbers: true });
  }
  next();
});

MemberSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
  next();
});

module.exports = mongoose.model('Member', MemberSchema);
