const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const AdminSchema = new mongoose.Schema(
  {
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
    password: {
      type: String,
      required: [true, 'Please add a password'],
      trim: true,
      match: [
        /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9a-zA-Z]).{6,}$/,
        'Password must contain at least six characters, including uppercase and lowercase letters, and numbers.',
      ],
      select: false,
    },
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    role: {
      type: String,
      default: 'admin',
    },
  },
  {
    timestamps: true,
  }
);

// Delete some fiels from data to return to the client
AdminSchema.methods.toJSON = function () {
  const admin = this;
  const adminObject = admin.toObject();

  delete adminObject.password;
  delete adminObject.createdAt;
  delete adminObject.updatedAt;

  return adminObject;
};

// Hash text plain password
AdminSchema.pre('save', async function (next) {
  const admin = this;
  if (admin.isModified('password')) {
    const salt = await bcrypt.genSalt(10);
    admin.password = await bcrypt.hash(admin.password, salt);
  }
  next();
});

// Password Verification
AdminSchema.methods.verifyPassword = async function (enteredPassword) {
  const admin = this;
  const verify = await bcrypt.compare(enteredPassword, admin.password);
  return verify;
};

// Return signed JWT token
AdminSchema.methods.getAuthToken = async function () {
  const admin = this;
  const token = jwt.sign(
    { _id: admin._id.toString(), role: this.role },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES,
    }
  );
  return token;
};

module.exports = mongoose.model('Admin', AdminSchema);
