const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const catchAsync = require('../Util/catchAsync');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please tell us your name'],
    // unique: true,
  },

  email: {
    type: String,
    required: [true, 'Please provide your email'],
    // unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Pleas provide a valid email'],
  },
  photo: String,
  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin'],
    default: 'user',
  },
  password: {
    type: String,
    required: [true, 'please provide a password'],
    minlength: 8,
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm your password'],
    validate: {
      validator:
        //This only works on crete() or on save()
        function (el) {
          return el === this.password;
        },
      message: 'passwords are not the same',
    },
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});

//hashing our password using a middleware thereby installing a bcrypt package
//Only run this function if password was actually modified
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next;
  //hash the password with cost of 12
  this.password = await bcrypt.hash(this.password, 12);
  //Delete the password confirm field
  this.passwordConfirm = undefined;
  next();
});

// MY outsource login code
userSchema.statics.loginme = async function (email, password) {
  const user = await this.findOne({ email });
  console.log(user);
  if (user) {
    console.log('user success');
    const auth = await bcrypt.compare(password, user.password);
    if (auth) {
      console.log(user);
      return user;
    }
    throw Error('this password is not correct');
  }
  throw Error('this email is not registered');
};

// // Creating a password compare function, that compares
// //password from the database and and inputed password
userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword,
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changePasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10,
    );
    // console.log(changedTimestamp, JWTTimestamp);
    return JWTTimestamp < changedTimestamp;
  }
  //means not hanged
  return false;
};

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  // console.log({ resetToken }, this.passwordResetToken);

  this.passwordResetExpires = Date.now() + 10 * 6 * 1000;

  return resetToken;
};

userSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) return next();

  this.passwordChangedAt = Date.now - 1000;
  next();
});

userSchema.pre(/^find/, function (next) {
  this.find({ active: { $ne: false } });
  next();
});

const User = mongoose.model('User', userSchema);

module.exports = User;
