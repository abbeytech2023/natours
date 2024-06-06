const catchAsync = require('../Util/catchAsync');
const AppError = require('../Util/AppError');
const APIFeatures = require('../Util/apiFeatures');

exports.deleteOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);
    if (!doc) {
      return next(new AppError(`No doc found with that ID`, 404));
    }

    res.status(204).json({
      status: 'success',
      data: null,
    });
  });

exports.updateOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!doc) {
      return next(new AppError(`No doccument found with that ID`, 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        data: doc,
      },
    });
  });

exports.createOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.create(req.body);
    res.status(201).json({
      status: 'success',
      data: {
        data: doc,
      },
    });
  });

exports.getOne = (Model, PopOptions) =>
  catchAsync(async (req, res, next) => {
    let query = Model.findById(req.params.id);
    if (PopOptions) query = query.populate(PopOptions);
    const doc = await query;
    // const doc = await doc.findOne({ _id: req.params.id });

    //WE CREATE AN ERROR WE THEN PASS IT INTO NEXT(), AS SOON AS NEXT RECEIVES SOMETHING, IT ASSUMES THAT IT IS AN ERROR AND WILL JUMP
    // STRAIGHT TO THE GLOBAL ERROR HANDLING MIDDLEWARE WHICH WILL THEN SEND THE RESPONSE FOR US
    if (!doc) {
      return next(new AppError(`No doccument found with that ID`, 404));
    }

    res.status(200).json({
      status: 'success',
      data: doc,
    });
  });

exports.getAll = (Model) => async (req, res, next) => {
  //To allow for nested Get Review
  let filter = {};

  if (req.params.tourId) filter = { tour: req.params.tourId };

  //EXCUTE QUERY
  const features = new APIFeatures(Model.find(), req.query)
    .filter()
    .sort()
    .limit()
    .paginate();
  // const doc = await features.query.explain();
  const doc = await features.query;
  // constdoc = await Tour.find()
  //   .where('duration')
  //   .equals(5)
  //   .where('difficulty')
  //   .equals('easy');

  //SEND RESPONSE
  res.status(200).json({
    results: doc.length,
    status: 'success',
    requestedAt: req.requestTime,
    data: {
      data: doc,
    },
  });
};
