const dotenv = require('dotenv');
const mongoose = require('mongoose');
// const { MongoClient, ServerApiVersion, Schema } = require('mongodb');

// process.on('uncaughtException', (err) => {
//   console.log(err.name, err.message);
//   console.log('UNCAUGHT EXCEPTION! 💥 shutting down...');
//   process.exit(1);
// });

dotenv.config({ path: './config.env' });

const app = require('./app');

// console.log(process.env);
const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD,
);

// const DB = process.env.DATABASE_LOCAL;

mongoose
  .connect(DB)
  //{
  //   serverSelectionTimeoutMS: 30000,
  //   socketTimeoutMS: 1000,
  //   useNewUrlParser: true,
  //   // useUnifiedTopology: true,
  // })
  .then(() => {
    console.log('db connection sucessful');
  })
  .catch((err) => console.log('ERROR', err));

console.log(app.get('env'));
//Starting the server
const port = process.env.PORT || 8000;
const server = app.listen(port, '127.0.0.1', () => {
  console.log(`App running on port ${port}...`);
});

//EVENT LISTENER: GLOBAL WAY OF HANDLING ALL UNHANDLED REJECTIONS IN PROMISES
// process.on('unhandledRejection', (err) => {
//   console.log(err.name, err.message);
//   console.log('UNHANDLED REJECTION! 💥 shutting down...');
//   server.close(() => {
//     process.exit(1);
//   });
// });
