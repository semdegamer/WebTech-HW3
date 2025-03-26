var express = require('express');
var router = express.Router();

/* GET Home Page */
router.get('/', function(req, res) {
  // req.locals.user.id === 'undefined'
  
  var loggedIn = false;
  if (loggedIn)
    res.render('public/home');
  else
    res.render('user/home');
});

module.exports = router;