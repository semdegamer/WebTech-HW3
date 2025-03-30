var express = require('express');
var router = express.Router();

/* GET Home Page */
// homepage for user
router.get('/', (req, res, next) => false /* check for logged in, something like: req.user.loggedIn */ ? next() : next('route'), function(req, res) {
  res.render('user/home');
});

// default homepage
router.get('/', function(req, res) {
  res.render('public/home');
});

module.exports = router;