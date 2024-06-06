const path = require('path');
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');

const AppError = require('./Util/AppError');
const globalErrorHandler = require('./Controllers/errorController');
const tourRouter = require('./Routes/tourRoutes');
const userRouter = require('./Routes/usersRoutes');
const reviewRouter = require('./Routes/reviewRoutes');
const viewRouter = require('./Routes/viewRoutes');
const User = require('./Models/userModel');

//Start express App
const app = express();

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));
// 1: GLOBAL MIDDLEWARES
// Serving static files
app.use(express.static(path.join(__dirname, 'public')));

// Set security HTTP headers
app.use(helmet());

//development login
if (process.env.NODE_ENV === 'devlopment') {
  app.use(morgan('dev'));
}

//Rate limit is anobject which receives an Object of options
//With rate limit we can define how many request per IP we can allow on our server
const limiter = rateLimit({
  // if you need more access from the same ip, you can increase the number from 100
  max: 100,
  windowMs: 60 * 60 * 1000,
  massage: 'Too many request from this IP, please try again in an hour',
});

// Body parser, reading data from the body into req.body
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());

//Data Sanitization against NoSQL query injection
app.use(mongoSanitize());

//Data sanitization against XSS attacks or cross site scripting attacks
app.use(xss());

//Prevent parameter pollution
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingAverage',
      'ratingQuantity',
      'maxGroupSize',
      'difficulty',
      ' price',
    ],
  }),
);

app.get('/getall', (req, res) => {
  User.find()
    .then((result) => res.send(result))
    .catch((err) => console.log(err));
});

// Test middlewares
// app.use(helmet());
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  console.log(req.cookies);
  next();
});

//Using limiter on our server
app.use('/api', limiter);

//3) ROUTES

app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);

app.all('*', (req, res, next) => {
  // res.status(404).json({

  //   const err = new Error(`cant find ${req.originalUrl} on this server`);
  //   err.status = 'fail';
  //   err.statusCode = 404;
  next(new AppError(`cant find ${req.originalUrl} on this server`, 404));
});

app.use(globalErrorHandler);

module.exports = app;
