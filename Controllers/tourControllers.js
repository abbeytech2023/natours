const fs = require('fs');
const express = require('express');

const Tour = require('../Models/tourModel');
const catchAsync = require('../Util/catchAsync');
const factory = require('./handlerControlller');
const AppError = require('../Util/AppError');

const app = express();

// app.use(express.json());
// const tours = JSON.parse(
//   fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`)
// );

// exports.checkBody = (req, res, next) => {
//   if (!req.body.name || !req.body.price) {
//     return res.status(404).json({
//       status: 'fail',
//       message: 'Missing name of the price',
//     });
//   }
//   next();
// };

// exports.checkID = (req, res, next, val) => {
//   console.log(`your id is ${val}`);

//   if (req.params.id * 1 > tours.length) {
//     return res.status(404).json({
//       status: 'fail',
//       Message: 'Invalid ID',
//     });
//   }
//   next();
// };

exports.aliasTopTours = function (req, res, next) {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage.price';
  req.query.fields = 'name,price,ratingAverage,summary,difficulty';
  next();
};

exports.getAlltours = factory.getAll(Tour);

exports.getTour = factory.getOne(Tour, { path: 'reviews' });

// THE CATCH ASYNC FUNCTION IS CALLED
// exports.getTour = catchAsync(async (req, res, next) => {
//   // console.log(req.params.id);
//   const tour = await Tour.findById(req.params.id).populate('reviews');
//   // const tour = await Tour.findOne({ _id: req.params.id });
//   console.log(tour);

//   //WE CREATE AN ERROR WE THEN PASS IT INTO NEXT(), AS SOON AS NEXT RECEIVES SOMETHING, IT ASSUMES THAT IT IS AN ERROR AND WILL JUMP
//   // STRAIGHT TO THE GLOBAL ERROR HANDLING MIDDLEWARE WHICH WILL THEN SEND THE RESPONSE FOR US
//   if (!tour) {
//     return next(new AppError(`No Tour found with that ID`, 404));
//   }

//   res.status(404).json({
//     status: 'success',
//     data: tour,
//   });
// });

exports.createTour = factory.createOne(Tour);

exports.updateTour = factory.updateOne(Tour);

// exports.updateTour = catchAsync(async (req, res, next) => {
//   const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
//     new: true,
//     runValidators: true,
//   });

//   if (!tour) {
//     return next(new AppError(`No Tour found with that ID`, 404));
//   }

//   res.status(200).json({
//     status: 'success',
//     data: {
//       tour,
//     },
//   });
// });

exports.deleteTour = factory.deleteOne(Tour);

// exports.deleteTour = catchAsync(async (req, res, next) => {
//   const tour = await Tour.findByIdAndDelete(req.params.id);
//   console.log(tour);

//   if (!tour) {
//     return next(new AppError(`No Tour found with that ID`, 404));
//   }

//   res.status(204).json({
//     status: 'success',
//     data: null,
//   });
// });

exports.getTourStats = catchAsync(async (req, res, next) => {
  const stats = await Tour.aggregate([
    {
      // TO SELECT OR FILTER DOCcUMENTS
      $match: { ratingAverage: { $gte: 4.5 } },
    },
    {
      //ALLOWS TO GROUP DOCCS TOGETHER USING ACCUMULATORS
      // WE CAN CALCULATE AVERAGE RATING USING GROUP BASED ON
      // VALUE PASSED TO THE (ID) KEY
      $group: {
        _id: { $toUpper: '$difficulty' },
        numTours: { $sum: 1 },
        numRatings: { $sum: '$ratingsQuantity' },
        avgRating: { $avg: '$ratingAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
      },
    },
    {
      //avgprice: 1 means to arrange our data in ascending order -1 means descending
      $sort: { avgPrice: 1 },
    },
    // {
    //   $match: { _id: { $ne: 'EASY' } },
    // },
  ]);
  res.status(200).json({
    status: 'success',
    data: {
      stats,
    },
  });
});

exports.getMonthlyPlan = async (req, res, next) => {
  const year = req.params.year * 1;
  const plan = await Tour.aggregate([
    {
      // UNWIND IS GOING TO DECONSTRUCT AN ARRAY FIELD FROM THE INPUT
      //DOCCUMENT AND THEN OUTPUT ONE DOCCUMENT FOR EACH ELEMENT OF THE ARRAY
      $unwind: '$startDates',
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    {
      $group: {
        _id: { $month: '$startDates' },
        numTourStarts: { $sum: 1 },
        tours: { $push: '$name' },
      },
    },
    {
      $addFields: {
        month: '$_id',
      },
    },
    {
      //USE TO MAKE FIELDSNAME SHOW OR NOT SHOW BY SETTING THE VALUE TO 0 OR 1
      $project: {
        _id: 0,
      },
    },
    {
      $sort: { numTourStarts: -1 },
    },
    {
      // use to set the number of results to be shown
      $limit: 12,
    },
  ]);
  res.status(200).json({
    results: plan.length,
    status: 'success',
    data: {
      plan,
    },
  });
};

// '/tours-within/:distance/center/:latlng/unit/:unit',

// /tours-within?distance=233&center=-40,45&unit=mi
// /tours-within/233/center/7.165527, 3.371085/unit/mi

exports.getToursWithin = catchAsync(async (req, res, next) => {
  const { distance, latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');
  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;

  if (!lat || !lng) {
    next(
      new AppError(
        'please provide lattitude and longitude in the format lat,lng',
        400,
      ),
    );
  }

  const tours = await Tour.find({
    startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } },
  });

  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: {
      data: tours,
    },
  });
});

exports.getDistances = catchAsync(async (req, res, next) => {
  const { latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');

  const multiplier = unit === 'mi' ? 0.000621371 : 0.001;

  if (!lat || !lng) {
    next(
      new AppError(
        'please provide lattitude and longitude in the format lat,lng',
        400,
      ),
    );
  }

  const distances = await Tour.aggregate([
    {
      $geoNear: {
        //The point from which to calculate the distances
        near: {
          type: 'Point',
          coordinates: [lng * 1, lat * 1],
        },
        // distanceField is the name of the field that will be created and all the calculated distances will be stored
        distanceField: 'distance',
        distanceMultiplier: multiplier,
      },
    },
    {
      $project: {
        distance: 1,
        name: 1,
      },
    },
  ]);
  res.status(200).json({
    status: 'success',
    data: {
      distances,
    },
  });
});
