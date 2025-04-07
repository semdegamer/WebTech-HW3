const express = require('express');
const router = express.Router();

/* GET Home Page */
router.get('/', function(req, res) {
  console.log("im logging: ", req.loggedIn, req.session, req.user);
  if (req.loggedIn) {
    // If the user is logged in, go to the user homepage
    res.render('user/home');
  } else {
    // If the user is not logged in, go to  the public homepage
    res.render('public/home');
  }
});

module.exports = router;
