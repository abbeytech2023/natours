const express = require('express');
const authController = require('../Controllers/authController');
const reviewRouter = require('./reviewRoutes');

const {
  getAlltours,
  getTour,
  createTour,
  updateTour,
  deleteTour,
  aliasTopTours,
  getTourStats,
  getMonthlyPlan,
  getToursWithin,
  getDistances,
} = require('../Controllers/tourControllers');

const router = express.Router();
router.route('/tour-stats').get(getTourStats);
router
  .route('/monthly-plan/:year')
  .get(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide', 'guide'),
    getMonthlyPlan,
  );

router.route('/top-5-cheap').get(aliasTopTours, getAlltours);

router
  .route('/tours-within/:distance/center/:latlng/unit/:unit')
  .get(getToursWithin);

// /tours-within?distance=233&center=-40,45&unit=mi
// /tours-within/233/center/-40,45/unit/mi

// router.param('/:id');

router.route('/distances/:latlng/unit/:unit').get(getDistances);

router
  .route('/')
  .get(getAlltours)
  .post(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    createTour,
  );
router
  .route('/:id')
  .get(getTour)
  .patch(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    updateTour,
  )
  .delete(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    deleteTour,
  );

//POST /user/2354age/reviews
//GET /user/2354age/reviews
//GET /user/2354age/reviews/UYYWWHW

// router
//   .route('/:tourId/reviews')
//   .post(
//     authController.protect,
//     authController.restrictTo('user'),
//     reviewController.createReviews,
//   );

router.use('/:tourId/reviews', reviewRouter);

module.exports = router;
