const express = require('express');
const userController = require('../Controllers/userControllers');
const authController = require('../Controllers/authController');

const router = express.Router();

//CREATING A ROUTE FOR FOR NEW USER SIGNUP
router.post('/signup', authController.signUp);
router.post('/login', authController.login);

router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:token', authController.resetPassword);

//Protect All routes after this middleware
router.use(authController.protect);

router.patch(
  '/updateMyPassword',
  authController.protect,
  authController.updatePassword,
);

router.get(
  '/me',
  authController.protect,
  userController.getMe,
  userController.getUser,
);
router.patch('/updateMe', authController.protect, userController.updateMe);
router.delete('/deleteMe', authController.protect, userController.deleteMe);

//This MidleWare restricts all actions after this middleware to the "admin" alone
router.use(authController.restrictTo('admin'));

router
  .route('/')
  .get(userController.getAllusers)
  .post(userController.createUser);

router
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;
