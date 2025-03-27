var express = require('express');
var router = express.Router();

var userLogin = require('../middleware/userLogin');

router.use(function(req, res, next) {
  var loggedIn = false;
  // check if user is logged in
  if (loggedIn)
    res.redirect('/');
  else
    next();
});

/* GET Login Page */
router.get('/login', function(req, res) {
  res.render('auth/login');
});

router.post('/login', userLogin);

/* GET Register Page */
router.get('/register', function(req, res) {
  res.render('auth/register');
});

module.exports = router;
