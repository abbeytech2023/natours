const AppError = require('../Util/AppError');

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

const handleDuplicateFieldDB = (err) => {
  const message = `Duplicate field value: ${err.keyValue.name} please use another value`;
  return new AppError(message, 400);
};

const handleValidationErrorDB = (err) => {
  const error = Object.values(err.errors).map((el) => el.message);

  const message = `Invalid input Data ${error.join('.  ')}`;
  return new AppError(message, 400);
};

const handleTokenExpiredrror = (err) =>
  new AppError('your token has expired please login again', 401);

const handleJWTError = (err) => {
  const message = 'invalid token please login again';
  return new AppError(message, 401);
};
//Error sent during development
const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};

//ERROR SENT DURING PRODUCTION
const sendErrorProd = (err, res) => {
  //Operational trusted error: send message to client
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
    //programming or other unknown error: dont leak error details
  } else {
    // log the error
    // console.error('ERROR 💥', err);
    res.status(500).json({
      status: 'error',
      error: err,
      message: 'Something went very wrong',
    });
  }
};

//A function that decides the error to be sent wether development error or production error
module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 400;

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else if (process.env.NODE_ENV === 'production') {
    let error = { ...err };
    //Transforming mongoDB ERROR TO OUR OWN ISOPERATIONAL ERROR
    if (error.kind === 'ObjectId') error = handleCastErrorDB(error);
    if (error.code === 11000) error = handleDuplicateFieldDB(error);
    if (error._message === 'Tour validation failed')
      error = handleValidationErrorDB(error);
    if (error.name === 'JsonWebTokenError') error = handleJWTError(error);
    if (error.name === 'TokenExpiredError')
      error = handleTokenExpiredrror(error);
    sendErrorProd(error, res);
  }
};
