const Tour = require('../Models/tourModel');
const AppError = require('../Util/AppError');
const catchAsync = require('../Util/catchAsync');
const User = require('../Models/userModel');

exports.getOverview = catchAsync(async (req, res) => {
  //1) Get Tour data from collection
  const tours = await Tour.find();
  //2)Build template
  res.status(200).render('overview', {
    title: 'All tours',
    tours,
  });
});

exports.getTour = catchAsync(async (req, res, next) => {
  //1)Get the data from the requested tour including reviews and guildelines
  const tour = await Tour.findOne({ slug: req.params.slug }).populate({
    path: 'reviews',
    fields: 'review rating user',
  });

  //2) Build template

  //3)Rendr template using data from 1
  res.status(200).render('tour', {
    title: `${tour.name} Tour`,
    tour,
  });
});

exports.getLoginForm = (req, res) => {
  res
    .status(200)
    // .set(
    //   'content-security-policy',
    //   "script-src 'self' https://cdnjs.cloudflare.com/ajax/libs/axios/0.18.0/axios.min.js 'unsafe-inline' 'unsafe-eval'",
    // )
    .render('login', {
      title: 'LOG IN TO YOUR ACCOUNT',
    });
};

exports.createUser = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.create({ email, password });

  res.status(201).json('user created');
};

// exports.login = catchAsync(async (req, res, next) => {
//   const { email, password } = req.body;
//   try {
//     const user = await User.login(email, password);

//     if (!user) return next(new AppError('incorrect email or password'));

//     res.status(200).json({ user: user._id });
//   } catch (err) {
//     console.log(err);
//   }
// });

exports.getSignUpForm = (req, res) => {
  res.status(200).render('signUp', {
    title: 'Create a New Account',
  });
};

exports.get_loginme = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.loginme(email, password);
  res.send(200).json({ user });
};
