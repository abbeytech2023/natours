const { request } = require('express');
const User = require('../Models/userModel');
const AppError = require('../Util/AppError');
const catchAsync = require('../Util/catchAsync');
const factory = require('./handlerControlller');

const filteredObj = (obj, ...allowedfields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedfields.includes(el)) newObj[el] = obj[el];
  });

  return newObj;
};

exports.updateMe = catchAsync(async (req, res, next) => {
  //1) Create error if user post password
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'this routes is not for password updates. please use /updateMyPassword',
        400,
      ),
    );
  }

  //Filterd out unwanted filled names that are not allowed to be updated
  const filteredBody = filteredObj(req.body, 'name', 'email');

  //Update user Document
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser,
    },
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

exports.getAllusers = factory.getAll(User);
exports.getUser = factory.getOne(User);

exports.updateUser = factory.updateOne(User);

exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not defined, please use /signup instead',
  });
};

exports.deleteUser = factory.deleteOne(User);
