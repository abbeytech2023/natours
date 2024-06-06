const mongoose = require('mongoose');
const slugify = require('slugify');
const express = require('express');

const User = require('./userModel');

const app = express();
app.use(express.json());

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name'],
      unique: true,
      trim: true,
      maxLength: [40, 'A tour name must have equal or less than 40 characters'],
      minLength: [
        10,
        'A tour name must have equal or higher than 10 characters',
      ],
      //EXTERNAL LIBRARY ON NPM VALIDATOR.JS FOR VALIDATION 👇👇👇
      // validate: [validator.isAlpha, 'Tour name must only contains characters'],
    },

    slug: String,

    ratingAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'rating must be equal or above 1.0'],
      max: [5, 'rating must e equal or less than 5'],
      set: (val) => Math.round(val * 10) / 10,
    },
    ratingQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a price'],
    },

    duration: {
      type: Number,
      required: [true, 'A tour must have a duration'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, ' Tour must have a group size'],
    },
    difficulty: {
      type: String,
      required: [true, ' A tour must have difficulty'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty is either: easy, medium, difficult',
      },
    },

    //setting our own custom validator
    priceDiscount: {
      type: Number,
      validate: {
        validator: function (val) {
          //this only points to current doc on new DOCCUMENT CREATION
          return val < this.price; // 100 < 200
        },
        message: 'discount price ({VALUE}) should be below the regular price',
      },
    },

    summary: {
      type: String,
      trim: true,
      required: [true, 'A tour must have a description'],
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      required: [true, 'A tour must have a cover image'],
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false,
    },
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false,
    },

    //AN Emdeded OBJECT
    startLocation: {
      type: {
        type: String,
        default: 'point',
        // enum: {
        //   values: ['point'],
        // },
      },
      coordinates: [Number],
      address: String,
      description: String,
    },
    locations: [
      {
        type: {
          type: String,
          default: 'point',
          // enum: ['point'],
        },
        coordinates: [Number],
        address: String,
        descripton: String,
        day: Number,
      },
    ],
    guides: [{ type: mongoose.Schema.ObjectId, ref: 'User' }],
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// tourSchema.index({ price: 1});
tourSchema.index({ price: 1, ratingsAverage: -1 });
tourSchema.index({ slug: 1 });
tourSchema.index({ startLocation: '2dsphere' });

//VIRTUAL PROPERTIES ARE FIELDS WE CAN DEFINE IN OUR SCHEMA BUT WILL NOT BE SAVED IN OUR DATABASE
//VIRTUSL PROPERTIES MAKES ALOT OF SENSE FOR FIELDS THAT CAN BE DERIVED FROM ONE ANOTHER E.G CONVERSION OF MILES TO KM
//WE CANNOT USE VIRTUAL PROPERTY IN A QUERY BCOS ITS NOT PART OF THE DATABASE
tourSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7;
});

tourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour',
  localField: '_id',
});

tourSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'guides',
    select: '-__v -passwordChangedAt',
  });
  next();
});

//DOCUMENT MIDDLEWARE: IT RUNS BEFORE THE SAVE() COMMAND AND .CREATE() COMAND, DOESNT WORK ON UPDATE
//the this Onject points to the current doccument
tourSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

// tourSchema.pre('save', async function (next) {
//   const guidesPromises = this.guides.map(async (id) => await User.findById(id));
//   this.guides = await Promise.all(guidesPromises);
// });

// tourSchema.pre('save', (next) => {
//   console.log('will save doccument......');
//   next();
// });

// this middleware has access to the next() and and the doccument that was just saved to the database
// post middleware functions are executed after all the pre middleware function have completed
// tourSchema.post('save', (doc, next) => {
//   console.log(doc);
//   next();
// });

//QUERY MIDDLEWARE:QUERY MIDDLEWARE ALLOWA US TO RUN FUNCTIONS BEFORE OR AFTER A CERTAIN QUERY IS EXECUTED
//THE THIS KEYWORD IN THIS MIDDLEWARE WILL NOW POINT AT THE CURRENT QUERY AND NOT AT THE CURRENT DOCCUMENT
// /^find/ simply means to execute in all the strings that start with find eg "findOne", findByIdAndUpdate","findByIdAndDelete"
// tourSchema.pre(/^find/, function (next) {
//   // tourSchema.pre('find', function (next) {
//   this.find({ secretTour: { $ne: true } });

//   this.start = Date.now();
//   next();
// });

tourSchema.post(/^find/, function (docs, next) {
  console.log(`query took ${Date.now() - this.start} milliseconds`);
  next();
});

//AGGREGATION MIDDLEWARE ALLOWS US TO ADD HOOKS BEFORE OR AFTER AN AGGREGATION HAPPENS
//in aggregation middleware, the this keyword is going to points to the aggregation object
// tourSchema.pre('aggregate', function (next) {
//   this.pipeline().unshift({
//     $match: { secretTour: { $ne: true } },
//   });
//   console.log(this.pipeline());
//   next();
// });

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
