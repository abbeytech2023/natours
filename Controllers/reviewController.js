const Review = require('../Models/reviewModel');
// const catchAsync = require('../Util/catchAsync');
const factory = require('./handlerControlller');

exports.setTourUserId = (req, res, next) => {
  //Allow nested routes //Getting Tour id from the URL

  if (!req.body.tour) req.body.tour = req.params.tourId;
  if (!req.body.user) req.body.user = req.user.id;
  next();
};

exports.getAllReviews = factory.getAll(Review);
exports.getReview = factory.getOne(Review);
exports.createReviews = factory.createOne(Review);
exports.updateReview = factory.updateOne(Review);
exports.deleteReview = factory.deleteOne(Review);
