const express = require('express');

const router = express.Router();
const viewsController = require('../Controllers/viewsController');

router.get('/', viewsController.getOverview);

router.get('/tour/:slug', viewsController.getTour);
router.get('/login', viewsController.getLoginForm);
router.get('/signup', viewsController.getSignUpForm);
router.post('/signup', viewsController.createUser);
router.post('/loginme', viewsController.get_loginme);
module.exports = router;
