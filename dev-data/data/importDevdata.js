const fs = require('fs');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

const Tour = require('../../Models/tourModel');
const Reviews = require('../../Models/reviewModel');
const User = require('../../Models/userModel');
// const { MongoClient, ServerApiVersion, Schema } = require('mongodb');

dotenv.config({ path: './config.env' });

// console.log(process.env);
const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD,
);

// const DB = process.env.DATABASE_LOCAL;

mongoose
  .connect(DB)

  .then(() => {
    console.log('db connection sucessful');
  });

//READ JSON FILE
const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`, 'utf-8'));
const reviews = JSON.parse(
  fs.readFileSync(`${__dirname}/reviews.json`, 'utf-8'),
);
const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, 'utf-8'));
// console.log(tours);
const importData = async () => {
  try {
    await Tour.create(tours);
    await Reviews.create(reviews, { validateBeforeSave: false });
    await User.create(users, { validateBeforeSave: false });
    console.log('Data successfuly loaded');
  } catch (err) {
    console.log(err);
  }
  process.exit();
};

// DELETE DATA FROM DATABASE
const deleteData = async () => {
  try {
    await Tour.deleteMany();
    await Reviews.deleteMany();
    await User.deleteMany();
    console.log('Data successfuly deleted');
  } catch (err) {
    console.log(err);
  }
  process.exit();
};

if (process.argv[2] === '--import') {
  importData();
} else if (process.argv[2] === '--delete') {
  deleteData();
}

console.log(process.argv);
