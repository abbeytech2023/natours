const crypto = require('crypto');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require('../Models/userModel');
const catchAsync = require('../Util/catchAsync');
const AppError = require('../Util/AppError');
const sendEmail = require('../Util/email');

const signedToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

const createSendToken = (user, statusCode, res) => {
  const token = signedToken(user._id);
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000,
    ),
    httpOnly: true,
  };
  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

  res.cookie('jwt', token, cookieOptions);

  //remove the passworf from Output
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};

// let currentUser;
// A function that  creates new user from the req. body
exports.signUp = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    role: req.body.role,
    passwordChangedAt: req.body.passwordChangedAt,
  });
  // console.log(newUser);
  // passes the mongodb __id as a param inside signed token
  createSendToken(newUser, 201, res);
  //the response to the client
});
// A function that logs in the user with the email and password from req.body
exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  //check if email and password exist
  if (!email || !password) {
    //if no email and password exist it passes the AppError function in the next() middleware
    return next(new AppError('please provide email and password', 400));
  }
  //check if user exist && password is correct
  const user = await User.findOne({ email }).select('+password');
  // console.log(user);

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('incorrect email or password', 401));
  }

  //if everything is ok, send token to client
  createSendToken(user, 200, res);
  //OR 👇👇

  // const token = signedToken(user._id);
  // res.status(200).json({
  //   status: 'success',
  //   token,
  // });
});

//protecting some pages from users without authentication
exports.protect = catchAsync(async (req, res, next) => {
  //1) GETS THE TOKEN AND CHECK IF ITS VALID
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    next(new AppError('you are not logged in, please log in', 401));
  }
  //2) VERIFICATION TOKEN
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  //3) CHECK IF USER STILL EXIST
  const freshUser = await User.findById(decoded.id);
  // console.log(freshUser);
  if (!freshUser) {
    return next(
      new AppError('the token belonging to this user does no longer exist'),
      401,
    );
  }
  //4) CHECK IF USER CHANGED PASSWORD AFTER THE TOKEN WAS ISSUED
  if (freshUser.changePasswordAfter(decoded.iat)) {
    return next(
      new AppError('user recently changed password, please login again', 401),
    );
  }
  //GRANT ACCESS TO PROTECTED ROUTE
  req.user = freshUser;
  // console.log(req.user);
  next();
});

exports.restrictTo = function (...roles) {
  // console.log(roles);
  return (req, res, next) => {
    //roles["admin", lead-guide], role=user
    if (!roles.includes(req.user.role))
      return next(
        new AppError('You do not have permission to perform this action'),
        403,
      );
    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  //1)Get user posted email
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(new AppError('Theres no user with this email address.', 404));
  }

  //2) Generate the random token
  const resetToken = user.createPasswordResetToken();
  await user.save({
    validateBeforeSave: false,
  });
  // console.log(user);

  //3) send it back by email
  const resetUrl = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;
  const message = `forgot your password? submit a PATCH request with your new password and 
  passwordConfirm to: ${resetUrl}.\nIf you haven"t forget your password please ignore this email`;
  // console.log(message);
  try {
    const mail = await sendEmail({
      email: user.email,
      subject: 'Your password reset token (valid for 10mins)',
      message,
    });
    console.log(user.email);

    res.status(200).json({
      status: 'success',
      message: 'token sent to email',
    });
  } catch (err) {
    console.log(err);
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError(
        'There was an error sending the email, Try again later',
        500,
      ),
    );
  }
});
exports.resetPassword = catchAsync(async (req, res, next) => {
  //1) Get user based on the token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });
  //2) if token has not expired, an there is user, set the new password
  if (!user) {
    return next(new AppError('Token is Invalid or has expired'));
  }
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  //3)Update changepasswordAt property

  //4) Log the user in and send
  createSendToken(user, 200, res);

  //OR 👇👇

  // const token = signedToken(user._id);

  // res.status(200).json({
  //   status: 'success',
  //   token,
  // });
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  //1)Get User from collection
  const user = await User.findById(req.user.id).select('password');
  //2)Check if posted current password is correct
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError('Your current Password is wrong', 401));
  }
  //3) if so, update password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();
  //4) log user in, send jwt
  createSendToken(user, 200, res);
});
