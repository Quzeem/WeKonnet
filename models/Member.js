const mongoose = require('mongoose');

const MemberSchema = new mongoose.Schema({
  fullname: {
    type: String,
    match: [/^[a-zA-Z][a-zA-Z\s]*$/, 'Please add a valid name'],
    trim: true,
    required: [true, 'Please add a fullname'],
  },
  email: {
    type: String,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email',
    ],
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
    maxlength: [100, 'Description can not be more than 100 characters'],
  },
  gender: {
    type: String,
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
    required: [true, 'Please add a password'],
    minlength: 6,
    select: false,
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  createdAt: {
    type: Date,
    default: Date.now,
  },
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
  },
});

MemberSchema.pre('save', function (next) {
  if (!this.email) {
    this.email = `${this.fullname.split(' ')[0]}${this.phone.slice(
      -4
    )}@domain.com`;
  }
  next();
});

module.exports = mongoose.model('Member', MemberSchema);
